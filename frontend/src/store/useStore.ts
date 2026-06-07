import { create } from 'zustand';

export interface PlaylistItem {
  videoId: string;
  position: number;
  title: string;
  thumbnail: string;
}

export interface Playlist {
  _id: string; // YouTube Playlist ID
  title: string;
  description: string;
  thumbnail: string;
  items: PlaylistItem[];
  categoryId: string | null;
  isDirty: boolean;
  snapshotVersion: number;
}

export interface Category {
  _id: string;
  name: string;
  color: string;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

interface StoreState {
  // State
  playlists: Playlist[];
  categories: Category[];
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  searchQuery: string;
  selectedCategoryId: string | 'all' | 'uncategorized';
  activePlaylistId: string | null;
  error: string | null;

  // Setters / Local Sync UI actions
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (categoryId: string | 'all' | 'uncategorized') => void;
  setActivePlaylistId: (playlistId: string | null) => void;
  clearError: () => void;
  
  // Backend API Actions
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  triggerSync: () => Promise<void>;
  
  categorizePlaylist: (playlistId: string, categoryId: string | null) => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

const API_BASE = 'http://localhost:3001/api';

/**
 * Standard fetch helper that injects credential cookies.
 */
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Crucial to pass session cookies to backend
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errMsg = `HTTP Error ${response.status}`;
    try {
      const body = await response.json();
      errMsg = body.error || errMsg;
    } catch (e) {}
    throw new Error(errMsg);
  }

  return response.json();
}

export const useStore = create<StoreState>((set, get) => ({
  playlists: [],
  categories: [],
  isAuthenticated: false,
  isLoading: true,
  user: null,
  searchQuery: '',
  selectedCategoryId: 'all',
  activePlaylistId: null,
  error: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
  setActivePlaylistId: (playlistId) => set({ activePlaylistId: playlistId }),
  clearError: () => set({ error: null }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchAPI('/auth/status');
      if (res.authenticated) {
        set({ isAuthenticated: true, user: res.user, isLoading: false });
        // Auto-fetch dashboard items
        get().fetchPlaylists();
        get().fetchCategories();
      } else {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch (err: any) {
      console.error('Auth verification error:', err);
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
      set({ isAuthenticated: false, user: null, playlists: [], categories: [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to log out' });
    }
  },

  fetchPlaylists: async () => {
    try {
      const data = await fetchAPI('/playlists');
      set({ playlists: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load playlists' });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await fetchAPI('/categories');
      set({ categories: data });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load categories' });
    }
  },

  triggerSync: async () => {
    set({ isLoading: true });
    try {
      const res = await fetchAPI('/playlists/sync', { method: 'POST' });
      if (res.success) {
        set({ playlists: res.playlists, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Sync operation failed', isLoading: false });
    }
  },

  categorizePlaylist: async (playlistId, categoryId) => {
    const playlist = get().playlists.find((pl) => pl._id === playlistId);
    if (!playlist) return;

    // Save previous category for rollback on failure
    const prevCategoryId = playlist.categoryId;
    
    // 1. Optimistic UI update
    set((state) => ({
      playlists: state.playlists.map((pl) => 
        pl._id === playlistId ? { ...pl, categoryId, isDirty: true } : pl
      )
    }));

    try {
      // 2. Persist in database (passes current snapshotVersion for lock check)
      const updatedPlaylist = await fetchAPI(`/playlists/${playlistId}/category`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          categoryId, 
          clientVersion: playlist.snapshotVersion 
        }),
      });

      // 3. Update store with backend payload containing incremented version
      set((state) => ({
        playlists: state.playlists.map((pl) => 
          pl._id === playlistId ? updatedPlaylist : pl
        )
      }));
    } catch (err: any) {
      console.error('Category sync error:', err);
      // 4. Rollback store on conflict or failure
      set((state) => ({
        error: err.message || 'Conflict detected: Playlist updated in another tab. Reloading...',
        playlists: state.playlists.map((pl) => 
          pl._id === playlistId ? { ...pl, categoryId: prevCategoryId, isDirty: false } : pl
        )
      }));
      // Re-fetch database to align client state
      get().fetchPlaylists();
    }
  },

  addCategory: async (name, color) => {
    try {
      const newCategory = await fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, color }),
      });
      set((state) => ({
        categories: [...state.categories, newCategory]
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to create category' });
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      await fetchAPI(`/categories/${categoryId}`, { method: 'DELETE' });
      set((state) => ({
        categories: state.categories.filter((cat) => cat._id !== categoryId),
        playlists: state.playlists.map((pl) => 
          pl.categoryId === categoryId ? { ...pl, categoryId: null } : pl
        ),
        selectedCategoryId: state.selectedCategoryId === categoryId ? 'all' : state.selectedCategoryId
      }));
      // Reload playlists to ensure isDirty states and categorizations align
      get().fetchPlaylists();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete category' });
    }
  }
}));
