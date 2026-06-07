# YouTube Playlist Manager: Backend Specification

This document details the backend architecture, database schemas, background worker pipelines, API route handlers, and YouTube Data API optimization algorithms.

## 1. Core Stack
* **API Framework:** Next.js Route Handlers (API Routes in App Router under `src/app/api/...`).
* **Background Jobs:** Inngest (Serverless queues, event-driven orchestration, and retry coordination).
* **Database:** MongoDB Atlas (NoSQL relational document store with Mongoose ODM).
* **Integration:** YouTube Data API v3 (OAuth2 for user authorization, `playlists.list`, `playlistItems.*` endpoints).

---

## 2. MongoDB Data Models
We use an embedded array schema for playlist items to optimize read operations, coupled with relational category assignments.

### 2.1 `categories` Model
Stores custom categorization buckets created by users.
```typescript
import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#00f0ff' }, // Custom HEX color for UI indicator
  orderIndex: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
```

### 2.2 `playlists` Model
Embedded item array storage for $O(1)$ video fetching inside a playlist.
```typescript
const PlaylistItemSchema = new Schema({
  videoId: { type: String, required: true },
  position: { type: Number, required: true }
});

const PlaylistSchema = new Schema({
  _id: { type: String }, // Maps directly to YouTube Playlist ID
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, // Nullable
  title: { type: String, required: true },
  description: { type: String, default: '' },
  snapshotVersion: { type: Number, default: 1 },
  isDirty: { type: Boolean, default: false },
  lastSyncedAt: { type: Date, default: Date.now },
  items: [PlaylistItemSchema] // Embedded playlist items
});

export const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', PlaylistSchema);
```

---

## 3. Quota Optimization Engine (The LIS Algorithm)
Updating video positions on YouTube via `playlistItems.update` costs **50 quota units per operation**. A naive reorder of a 50-video playlist can exhaust the entire daily 10,000-unit quota in four actions.

To prevent this, the synchronization engine implements the **Longest Increasing Subsequence (LIS)** algorithm to detect the minimal set of moves.

### Reorder Algorithm
1. **Fetch current state:** Compare local state target order with the last cached YouTube snapshot order.
2. **Apply LIS:** Find the longest subset of videos that are already in the correct relative order.
3. **Isolate outliers:** Any video *not* part of the LIS is considered out-of-place.
4. **Dispatch:** Call `playlistItems.update` *only* for the outlier videos, repositioning them into their correct targets.

### Cost Matrix
| Operation | Target API Endpoint | Quota Cost |
| :--- | :--- | :--- |
| **Move Video** | `playlistItems.update` (Outlier nodes only) | 50 units / moved item |
| **Add Video** | `playlistItems.insert` | 50 units |
| **Remove Video** | `playlistItems.delete` | 50 units |
| **Modify Category** | MongoDB Internal Update Only | **0 units** |

---

## 4. Background Ingestion & Inngest Pipelines
Inngest schedules and retries long-running sync operations without blocking the frontend response.

### 4.1 Ingestion Flow (`src/inngest/jobs/importPlaylists.ts`)
* **Trigger Event:** `oauth/tokens.created` (dispatched on successful OAuth authentication).
* **Steps:**
  1. Fetch all user playlists via `youtube.playlists.list` (paginated, 50 per page).
  2. Bulk upsert playlists into MongoDB with `categoryId: null`.
  3. Fetch items for each playlist via `youtube.playlistItems.list` and save to the `items` array.
  4. Send completion webhook or Server-Sent Event (SSE) to update client state.

### 4.2 Sync Outbound Flow (`src/inngest/jobs/syncToYouTube.ts`)
* **Trigger Event:** `playlist/sync.requested`.
* **Steps:**
  1. Retrieve playlist state and compare with recorded snapshot.
  2. Run the LIS/difference comparison.
  3. Execute calls against YouTube API within exponential backoff error-handling wrappers.
  4. Increment `snapshotVersion` in MongoDB and mark `isDirty: false`.

---

## 5. Concurrency & Optimistic Lock Control
Because categorizations can happen quickly across multiple browser tabs, we enforce optimistic concurrency using `snapshotVersion`.

### Write Logic
```typescript
const updatedPlaylist = await Playlist.findOneAndUpdate(
  { 
    _id: playlistId, 
    snapshotVersion: clientVersion 
  },
  { 
    $set: { categoryId: newCategoryId, isDirty: true },
    $inc: { snapshotVersion: 1 } 
  },
  { new: true }
);

if (!updatedPlaylist) {
  throw new Error("ConcurrencyError: State has changed in another session. Refresh required.");
}
```
If the update yields `null`, the client's current data is stale. The API will respond with status code `409 Conflict`, prompting the frontend to reload resources.
