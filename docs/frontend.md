# YouTube Playlist Manager: Frontend Specification

This document details the frontend architecture, design system, component hierarchy, and state management for the YouTube Playlist Manager.

## 1. Core Stack
* **Framework:** Next.js (App Router, configured as a client-side Single Page Application for interactive views).
* **State Management:** Zustand (lightweight, decoupled reactive store for immediate state transitions).
* **Drag & Drop:** `@hello-pangea/dnd` (accessible and robust drag-and-drop utility for the Kanban triage layout).
* **Icons:** Lucide React (clean, vector outline icons).

---

## 2. Design System & Aesthetics
To deliver a premium, modern user experience, the interface adheres to a curated **Glassmorphism / Neon Accent** dark theme.

### Color Palette (Vanilla CSS Custom Properties)
```css
:root {
  /* Base Backgrounds */
  --bg-dark: #090a0f;
  --bg-card: rgba(17, 18, 25, 0.7);
  --bg-card-hover: rgba(25, 27, 38, 0.8);
  
  /* Borders & Glass effect */
  --border-glass: rgba(255, 255, 255, 0.08);
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  
  /* Brand & Accents */
  --accent-neon-blue: #00f0ff;
  --accent-neon-purple: #bd00ff;
  --accent-red-yt: #ff0000;
  
  /* Text */
  --text-primary: #f8fafc;
  --text-muted: #94a3b8;
  --text-disabled: #475569;
}
```

### Typography
* **Primary Font:** `Inter` or `Outfit` loaded from Google Fonts.
* **Weights:** 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold).

### Hover & Interaction Micro-Animations
* Buttons scale down slightly on active click: `transform: scale(0.98); transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);`.
* Hovering cards triggers a subtle blur filter reduction and a neon border glow: `box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);`.

---

## 3. Core Pages & Component Layout
The application features a single main responsive grid layout with collapsible side panels.

```text
+-------------------------------------------------------------+
|  Sidebar  | Header (OAuth status + Sync Quota Progress)     |
|  (Lists   |-------------------------------------------------|
|  Playlists|  Main Kanban Board (Drag playlists to category) |
|  & Lanes) |  [Uncategorized]   [Tech]   [Music]   [Tutorial]|
|           |  +---------+     +-----+   +-----+   +---------+|
|           |  | Playlist|     | ... |   | ... |   | ...     ||
|           |  +---------+     +-----+   +-----+   +---------+|
+-------------------------------------------------------------+
```

### 3.1 Kanban Lane Component (`/src/components/kanban/Lane.tsx`)
* Each lane represents one document from the `categories` collection.
* Supports dragging and dropping entire Playlists between lanes.
* Includes dynamic badge counters (e.g. `12 Playlists`).

### 3.2 Playlist Card Component (`/src/components/kanban/PlaylistCard.tsx`)
* Displays thumbnail, title, total videos, and sync status badge (`Dirty` vs `Synced`).
* Clicking the card opens a slide-over detailed panel showing individual video items inside that playlist.

### 3.3 Slide-Over Playlist Details (`/src/components/playlist/PlaylistDetailPanel.tsx`)
* Renders the internal videos ordered by position.
* Allows reordering videos within the playlist (triggers local order mutations).
* Allows deleting videos from the playlist.

### 3.4 Quota Status Header (`/src/components/layout/Header.tsx`)
* Tracks the estimated YouTube API quota consumption based on the local sync queue.
* Displays a progress bar indicating how close the user is to the 10,000-unit limit.

---

## 4. Zustand State Management (`/src/store/useStore.ts`)
The central state store coordinates UI state updates, local mutations, and API syncing.

### Store Architecture
```typescript
interface AppState {
  playlists: Record<string, Playlist>;
  categories: Category[];
  isSyncing: boolean;
  estimatedQuotaCost: number;
  
  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  setCategories: (categories: Category[]) => void;
  categorizePlaylist: (playlistId: string, categoryId: string | null) => void;
  reorderVideo: (playlistId: string, videoId: string, newPosition: number) => void;
  deleteVideo: (playlistId: string, videoId: string) => void;
  syncToYouTube: () => Promise<void>;
}
```

### Optimistic UI Strategy
1. **User Action:** User drags a playlist to a new category.
2. **Immediate Update:** Zustand store mutates `categoryId` in memory. `isDirty` is set to `true`.
3. **Background Persistence:** A debounced backend POST/PATCH is triggered to save the category assignment in MongoDB.
4. **Error Handling:** If backend update fails, the store reverts the item's `categoryId` to its previous state and displays a glassmorphic toast notification.
