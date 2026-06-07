## MVP System Architecture

```text
[Client: Next.js SPA] <--> [API Layer: Next.js Route Handlers]
                                        │
                                        ▼
                        [Background Workers: Inngest] <--> [External: YouTube Data API v3]
                                        │
                                        ▼
                            [Database: MongoDB Atlas]

```

Stripping the AI/ML layer reduces backend complexity by 60% and eliminates vector index costs, allowing you to validate the core routing, state-diffing, and YouTube API quota-management engines immediately.

---

## MongoDB Data Schema

The schema shifts from vector-based item categorization to a relational document model where users manually define categories and assign fetched playlists to them.

### 1. `categories` Collection

User-defined buckets for triage.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "color": "string",
  "orderIndex": "int32",
  "createdAt": "date"
}

```

### 2. `playlists` Collection

Playlists are now mapped to the user-defined `categoryId`. Items are stored as an embedded array for $O(1)$ document retrieval.

```json
{
  "_id": "string", // YouTube Playlist ID
  "userId": "ObjectId",
  "categoryId": "ObjectId", // Nullable until categorized
  "title": "string",
  "description": "string",
  "snapshotVersion": "int32",
  "isDirty": "boolean",
  "lastSyncedAt": "date",
  "items": [
    {
      "videoId": "string",
      "position": "int32"
    }
  ]
}

```

---

## Core MVP Workflows

### 1. Ingestion Pipeline

* **Trigger:** OAuth completion redirects to the dashboard. Client dispatches an initialization event.
* **Execution:** Inngest worker executes a paginated fetch against `playlists.list` (Cost: 1 unit per 50 playlists).
* **Write Strategy:** Bulk `upsert` into the `playlists` collection. `categoryId` defaults to `null` (rendering them in an "Uncategorized" lane on the UI).

### 2. The Triage Interface (Frontend)

The Kanban architecture remains, but lanes now represent user-created documents from the `categories` collection.

* **State Management:** Zustand holds the localized `playlists` array.
* **Interaction:** Dragging a playlist from "Uncategorized" into "Tech Talks" updates the `categoryId` in the local store and flags `isDirty = true`.
* **Optimistic UI:** Category mutations are instantaneous on the client. A debounced background sync pushes the updated `categoryId` to MongoDB via a `PATCH` request.

### 3. YouTube API Quota Optimization Engine

Even without AI, managing the 10,000-unit daily YouTube quota is the highest-leverage engineering challenge. Updates made in the UI must be translated into the absolute minimum number of API calls.

When the user triggers a "Sync to YouTube" action, the backend calculates the diff between the MongoDB state and the cached YouTube snapshot.

| Scenario | Algorithm / Action | Quota Cost |
| --- | --- | --- |
| **Move Video within Playlist** | Calculate Longest Increasing Subsequence (LIS) to find out-of-place nodes. Dispatch `playlistItems.update` only for nodes that shifted relative order. | 50 units / moved item |
| **Delete Video** | Dispatch `playlistItems.delete`. | 50 units / deleted item |
| **Add Video** | Dispatch `playlistItems.insert`. | 50 units / inserted item |
| **Update Playlist Category** | Purely internal MongoDB state change. **Zero YouTube API interaction required.** | 0 units |

### 4. Concurrency & Race Conditions

Because manual categorization relies on human input, session management is critical to prevent state overwrites if the user has multiple tabs open.

* **Implementation:** Use `snapshotVersion` for optimistic concurrency control.
* **Logic:** When dispatching a write to MongoDB, the query must include the current snapshot version: `db.playlists.updateOne({ _id: id, snapshotVersion: currentVersion }, { $set: {...}, $inc: { snapshotVersion: 1 } })`. If `matchedCount === 0`, the client state is stale and forces a data refresh before allowing further UI mutations.