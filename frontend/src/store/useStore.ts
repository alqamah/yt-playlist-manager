import { create } from 'zustand';

export interface PlaylistItem {
  id: string;
  title: string;
  channelTitle: string;
  duration: string;
  position: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  categoryId: string | null;
  isDirty: boolean;
  snapshotVersion: number;
  items: PlaylistItem[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

interface StoreState {
  playlists: Playlist[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryId: string | 'all' | 'uncategorized';
  activePlaylistId: string | null;
  
  // Setters
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (categoryId: string | 'all' | 'uncategorized') => void;
  setActivePlaylistId: (playlistId: string | null) => void;
  
  // Actions
  categorizePlaylist: (playlistId: string, categoryId: string | null) => void;
  addCategory: (name: string, color: string) => void;
  deleteCategory: (categoryId: string) => void;
  reorderVideo: (playlistId: string, videoId: string, newIndex: number) => void;
  deleteVideo: (playlistId: string, videoId: string) => void;
  syncToYouTube: (playlistId: string) => Promise<void>;
}

// Initial Mock Categories
const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Tech & Coding', color: '#00f0ff' },
  { id: 'cat-2', name: 'Focus Music', color: '#bd00ff' },
  { id: 'cat-3', name: 'Business & Startups', color: '#ffc700' },
];

// Initial Mock Playlists
const initialPlaylists: Playlist[] = [
  {
    id: 'pl-1',
    title: 'Next.js 16 Masterclass',
    description: 'Learn the new compiler, server actions, dynamic routing, and optimizations in Next.js 16.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    videoCount: 4,
    categoryId: 'cat-1',
    isDirty: false,
    snapshotVersion: 1,
    items: [
      { id: 'v-1', title: 'Next.js 16 App Router Tutorial', channelTitle: 'Vercel Developers', duration: '12:45', position: 0 },
      { id: 'v-2', title: 'React Compiler: Under the Hood', channelTitle: 'React Core', duration: '24:10', position: 1 },
      { id: 'v-3', title: 'Optimizing Font Loading and Images', channelTitle: 'Next.js Guides', duration: '08:30', position: 2 },
      { id: 'v-4', title: 'Advanced Server Actions Patterns', channelTitle: 'CodeCraft', duration: '18:55', position: 3 },
    ]
  },
  {
    id: 'pl-2',
    title: 'Lofi Beats for Deep Work',
    description: 'Relaxing beats to keep your focus sharp and your mind clear while coding.',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    videoCount: 3,
    categoryId: 'cat-2',
    isDirty: false,
    snapshotVersion: 1,
    items: [
      { id: 'v-5', title: 'Coding in the Rain - Lofi Chill', channelTitle: 'Chill Beats', duration: '2:30:00', position: 0 },
      { id: 'v-6', title: 'Midnight Coffee Session', channelTitle: 'Lofi Cafe', duration: '1:15:00', position: 1 },
      { id: 'v-7', title: 'Late Night Debugging Radio', channelTitle: 'Synthwave Radio', duration: '3:00:00', position: 2 },
    ]
  },
  {
    id: 'pl-3',
    title: 'Indie Hacker Blueprint',
    description: 'Case studies, product market fit, and validation techniques for solo developers.',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    videoCount: 3,
    categoryId: 'cat-3',
    isDirty: true, // Started with some shifts
    snapshotVersion: 1,
    items: [
      { id: 'v-8', title: 'How I Built a $10k/mo Micro-SaaS', channelTitle: 'Indie Builders', duration: '15:20', position: 0 },
      { id: 'v-9', title: 'Finding Profitable Niches Fast', channelTitle: 'SaaS Founder', duration: '11:45', position: 1 },
      { id: 'v-10', title: 'Cold Outreach Tactics that Scale', channelTitle: 'Growth Hacker', duration: '22:15', position: 2 },
    ]
  },
  {
    id: 'pl-4',
    title: 'Rust Programming Basics',
    description: 'Ownership, borrowing, lifetimes, and safety guarantees in Rust.',
    thumbnail: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    videoCount: 2,
    categoryId: null, // Uncategorized
    isDirty: false,
    snapshotVersion: 1,
    items: [
      { id: 'v-11', title: 'Why Everyone Loves Rust', channelTitle: 'No Boilerplate', duration: '09:40', position: 0 },
      { id: 'v-12', title: 'The Borrow Checker Explained Simply', channelTitle: 'Rustaceans', duration: '14:25', position: 1 },
    ]
  },
  {
    id: 'pl-5',
    title: 'Cooking Foundations: Knife Skills',
    description: 'Learn to slice, dice, julienne, and maintain knives like a professional chef.',
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    videoCount: 2,
    categoryId: null, // Uncategorized
    isDirty: false,
    snapshotVersion: 1,
    items: [
      { id: 'v-13', title: 'Master Chef Knife Skills 101', channelTitle: 'Culinary Arts', duration: '10:15', position: 0 },
      { id: 'v-14', title: 'How to Sharpen a Kitchen Knife', channelTitle: 'Kitchen Basics', duration: '07:50', position: 1 },
    ]
  }
];

export const useStore = create<StoreState>((set) => ({
  playlists: initialPlaylists,
  categories: initialCategories,
  searchQuery: '',
  selectedCategoryId: 'all',
  activePlaylistId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
  setActivePlaylistId: (playlistId) => set({ activePlaylistId: playlistId }),

  categorizePlaylist: (playlistId, categoryId) => set((state) => ({
    playlists: state.playlists.map((pl) => 
      pl.id === playlistId ? { ...pl, categoryId, isDirty: true } : pl
    )
  })),

  addCategory: (name, color) => set((state) => ({
    categories: [...state.categories, { id: `cat-${Date.now()}`, name, color }]
  })),

  deleteCategory: (categoryId) => set((state) => ({
    categories: state.categories.filter((cat) => cat.id !== categoryId),
    playlists: state.playlists.map((pl) => 
      pl.categoryId === categoryId ? { ...pl, categoryId: null, isDirty: true } : pl
    ),
    // Reset selected filter if it was the deleted category
    selectedCategoryId: state.selectedCategoryId === categoryId ? 'all' : state.selectedCategoryId
  })),

  reorderVideo: (playlistId, videoId, newIndex) => set((state) => {
    return {
      playlists: state.playlists.map((pl) => {
        if (pl.id !== playlistId) return pl;
        
        const items = [...pl.items];
        const currentIndex = items.findIndex((item) => item.id === videoId);
        if (currentIndex === -1) return pl;

        const [movedItem] = items.splice(currentIndex, 1);
        items.splice(newIndex, 0, movedItem);

        // Update positions
        const updatedItems = items.map((item, index) => ({
          ...item,
          position: index
        }));

        return {
          ...pl,
          items: updatedItems,
          isDirty: true
        };
      })
    };
  }),

  deleteVideo: (playlistId, videoId) => set((state) => ({
    playlists: state.playlists.map((pl) => {
      if (pl.id !== playlistId) return pl;
      
      const filteredItems = pl.items.filter((item) => item.id !== videoId);
      
      // Re-normalize positions
      const updatedItems = filteredItems.map((item, index) => ({
        ...item,
        position: index
      }));

      return {
        ...pl,
        items: updatedItems,
        videoCount: updatedItems.length,
        isDirty: true
      };
    })
  })),

  syncToYouTube: async (playlistId) => {
    // Simulate YouTube Sync delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    set((state) => ({
      playlists: state.playlists.map((pl) => 
        pl.id === playlistId 
          ? { ...pl, isDirty: false, snapshotVersion: pl.snapshotVersion + 1 } 
          : pl
      )
    }));
  }
}));
