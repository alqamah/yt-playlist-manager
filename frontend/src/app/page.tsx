'use client';

import { useState, useEffect } from 'react';
import { useStore, Playlist, Category } from '../store/useStore';
import { 
  Search, 
  RefreshCw, 
  Layers, 
  Plus, 
  Trash2, 
  X, 
  AlertCircle, 
  Check, 
  ListVideo,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const {
    playlists,
    categories,
    searchQuery,
    selectedCategoryId,
    activePlaylistId,
    isAuthenticated,
    isLoading,
    user,
    error,
    checkAuth,
    logout,
    triggerSync,
    setSearchQuery,
    setSelectedCategoryId,
    setActivePlaylistId,
    categorizePlaylist,
    addCategory,
    deleteCategory,
    clearError
  } = useStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#00f0ff');
  const [showCatModal, setShowCatModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 1. Initial Authentication Check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2. Clear error toast automatically after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Filter and search logic
  const filteredPlaylists = playlists.filter((pl) => {
    const matchesSearch = 
      pl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pl.description && pl.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategoryId === 'all') return matchesSearch;
    if (selectedCategoryId === 'uncategorized') return matchesSearch && pl.categoryId === null;
    return matchesSearch && pl.categoryId === selectedCategoryId;
  });

  const activePlaylist = playlists.find((pl) => pl._id === activePlaylistId);

  // Trigger manual YouTube sync
  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName, newCatColor);
    setNewCatName('');
    setShowCatModal(false);
  };

  const handleLogin = () => {
    // Redirect browser to our backend OAuth entry point
    window.location.href = 'http://localhost:3001/api/auth/youtube';
  };

  // 3. Loading Screen
  if (isLoading && !isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#08090c' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: '#00f0ff' }} />
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '1rem', fontWeight: 500 }}>Checking YouTube authorization...</span>
      </div>
    );
  }

  // 4. Unauthenticated / Connect YouTube Screen
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#08090c' }}>
        {/* Glow backdrop decor */}
        <div style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(255, 0, 85, 0.12) 0%, transparent 70%)', top: '15%', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)', bottom: '20%', zIndex: 0 }}></div>

        <div className="glass" style={{ maxWidth: '440px', width: '100%', borderRadius: '1.5rem', padding: '2.5rem', textAlign: 'center', zIndex: 1, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ height: '4.5rem', width: '4.5rem', borderRadius: '1.25rem', background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            {/* Custom YouTube SVG Logo */}
            <svg viewBox="0 0 24 24" width="40" height="40" fill="#ff0055">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>YouTube Playlist Manager</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem', lineHeight: '1.5' }}>
            Triage, sort, and organize your playlists. We use LIS sequence diffing to sync your actions with up to 90% fewer API calls.
          </p>

          <button 
            onClick={handleLogin}
            className="btn-primary-cyan"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', marginTop: '2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={16} />
            Connect YouTube Account
          </button>
          
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>
            <span>OAuth 2.0 SECURE PROTOCOL</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate estimated quota changes pending
  const totalDirtyPlaylists = playlists.filter(pl => pl.isDirty).length;

  return (
    <div className="app-container">
      {/* Toast Error Alert Popup */}
      {error && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(15, 10, 15, 0.95)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', zIndex: 99, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fff' }}>
          <AlertCircle size={18} style={{ color: '#f43f5e' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{error}</span>
          <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.15rem' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Panel */}
      <header className="glass app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div className="brand-title-group">
            <h1>
              YouTube Playlist Manager
              <span className="beta-badge">Beta</span>
            </h1>
            <p className="brand-subtitle">Logged in as {user?.displayName || user?.email}</p>
          </div>
        </div>

        {/* Sync Panel / Quota Indicator */}
        <div className="status-panel">
          <div>
            <div className="status-label">User Session</div>
            <div className="status-value" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.15rem' }}>
              <span>{user?.email}</span>
              <button 
                onClick={logout} 
                style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0.15rem', display: 'flex', alignItems: 'center' }} 
                title="Disconnect Account"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
          <div className="status-divider"></div>
          <div className="sync-status">
            <span className="status-dot-wrapper" style={{ display: 'inline-flex', position: 'relative', height: '8px', width: '8px' }}>
              <span className={`status-dot-ping ${totalDirtyPlaylists > 0 ? 'dirty' : 'synced'}`} style={{ position: 'absolute', height: '100%', width: '100%', borderRadius: '9999px', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: '0.75' }}></span>
              <span className={`status-dot ${totalDirtyPlaylists > 0 ? 'dirty' : 'synced'}`} style={{ height: '8px', width: '8px', borderRadius: '9999px', display: 'inline-block' }}></span>
            </span>
            <span style={{ color: '#cbd5e1' }}>
              {totalDirtyPlaylists > 0 ? `${totalDirtyPlaylists} local modifications` : 'YouTube synced'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="main-grid">
        
        {/* Left Sidebar Controls */}
        <aside className="sidebar">
          {/* Search bar */}
          <div className="glass search-box">
            <Search style={{ color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              placeholder="Search playlists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories Selector */}
          <div className="glass categories-container">
            <div className="section-header">
              <h2>
                <Layers size={14} />
                Categories
              </h2>
              <button 
                onClick={() => setShowCatModal(true)}
                className="icon-btn-cyan"
                title="Add Category"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <nav className="nav-list">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`nav-item ${selectedCategoryId === 'all' ? 'active' : ''}`}
              >
                <div className="nav-item-content">
                  <span>All Playlists</span>
                </div>
                <span className="count-badge">{playlists.length}</span>
              </button>

              <button
                onClick={() => setSelectedCategoryId('uncategorized')}
                className={`nav-item ${selectedCategoryId === 'uncategorized' ? 'active' : ''}`}
              >
                <div className="nav-item-content">
                  <span>Uncategorized</span>
                </div>
                <span className="count-badge">
                  {playlists.filter(p => p.categoryId === null).length}
                </span>
              </button>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>

              {categories.map((cat) => (
                <div key={cat._id} className="category-row">
                  <button
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={`nav-item ${selectedCategoryId === cat._id ? 'active' : ''}`}
                  >
                    <div className="nav-item-content">
                      <span className="color-dot" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="count-badge">
                      {playlists.filter(p => p.categoryId === cat._id).length}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat._id)}
                    className="delete-cat-btn"
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Playlists Main Workspace */}
        <main className="workspace">
          <div className="workspace-header">
            <h2>
              {selectedCategoryId === 'all' && 'All Playlists'}
              {selectedCategoryId === 'uncategorized' && 'Uncategorized Playlists'}
              {selectedCategoryId !== 'all' && selectedCategoryId !== 'uncategorized' && `${categories.find(c => c._id === selectedCategoryId)?.name} Playlists`}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Showing {filteredPlaylists.length} playlists</span>
              <button 
                onClick={handleSyncAll}
                disabled={syncing}
                className="btn-primary-cyan"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync YouTube'}
              </button>
            </div>
          </div>

          {filteredPlaylists.length === 0 ? (
            <div className="empty-state">
              <ListVideo style={{ color: '#475569', marginBottom: '1rem' }} size={40} />
              <h3>No playlists found</h3>
              <p>Try resetting your search query or choosing another category</p>
            </div>
          ) : (
            <div className="playlists-grid">
              {filteredPlaylists.map((playlist) => {
                const playlistCat = categories.find(c => c._id === playlist.categoryId);

                return (
                  <article key={playlist._id} className="glass playlist-card">
                    {/* Thumbnail Image */}
                    <div 
                      onClick={() => setActivePlaylistId(playlist._id)}
                      className="playlist-thumb"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={playlist.thumbnail} 
                        alt={playlist.title}
                      />
                      <div className="playlist-overlay"></div>
                      <div className="video-count-badge">
                        {playlist.items.length} videos
                      </div>

                      {playlistCat && (
                        <span 
                          className="card-cat-badge"
                          style={{ backgroundColor: playlistCat.color }}
                        >
                          {playlistCat.name}
                        </span>
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="playlist-details">
                      <div>
                        <h3 onClick={() => setActivePlaylistId(playlist._id)}>
                          {playlist.title}
                        </h3>
                        <p>
                          {playlist.description || "No description provided."}
                        </p>
                      </div>

                      {/* Dropdown for Categorizing */}
                      <div className="card-actions">
                        <select
                          value={playlist.categoryId || ''}
                          onChange={(e) => categorizePlaylist(playlist._id, e.target.value || null)}
                          className="category-dropdown"
                        >
                          <option value="">Move to...</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>

                        {/* Sync status identifier */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {playlist.isDirty ? (
                            <span className="synced-status-tag" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
                              Needs Sync
                            </span>
                          ) : (
                            <span className="synced-status-tag">
                              <Check size={11} />
                              Synced
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Slide-over Side Drawer (Playlist Videos Details - READ ONLY FOR LIVE SYNC PIPELINE) */}
      {activePlaylist && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setActivePlaylistId(null)}
            className="drawer-backdrop"
          ></div>

          {/* Drawer container */}
          <div className="drawer">
            <div className="drawer-content">
              <header className="drawer-header">
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Playlist Details</span>
                  <h2>{activePlaylist.title}</h2>
                </div>
                <button 
                  onClick={() => setActivePlaylistId(null)}
                  className="close-btn"
                >
                  <X size={18} />
                </button>
              </header>

              <div style={{ marginTop: '1rem' }}>
                <div className="drawer-section-title">
                  <span>Videos inside Playlist</span>
                </div>

                {/* Videos list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {activePlaylist.items.map((video, idx) => (
                    <div key={video.videoId} className="video-item">
                      <div className="video-info">
                        <h4>Video ID: {video.videoId}</h4>
                        <p>Position: #{video.position + 1}</p>
                      </div>
                    </div>
                  ))}
                  {activePlaylist.items.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', marginTop: '2rem' }}>No videos in this playlist.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="drawer-footer">
              <div></div>
              <button
                onClick={() => setActivePlaylistId(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Category Modal Dialog */}
      {showCatModal && (
        <>
          <div 
            onClick={() => setShowCatModal(false)}
            className="modal-backdrop"
          ></div>
          <div className="glass modal">
            <header className="modal-header">
              <h3>Create New Category</h3>
              <button 
                onClick={() => setShowCatModal(false)}
                className="close-btn"
              >
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Coding, Study, Gym..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Accent Color</label>
                <div className="color-picker-group">
                  <input 
                    type="color" 
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>{newCatColor}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-cyan"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
