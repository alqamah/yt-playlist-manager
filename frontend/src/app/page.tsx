'use client';

import { useState } from 'react';
import { useStore, Playlist, Category } from '../store/useStore';
import { 
  Search, 
  RefreshCw, 
  Layers, 
  Plus, 
  Trash2, 
  X, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  Check, 
  ListVideo
} from 'lucide-react';

const YoutubeIcon = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Dashboard() {
  const {
    playlists,
    categories,
    searchQuery,
    selectedCategoryId,
    activePlaylistId,
    setSearchQuery,
    setSelectedCategoryId,
    setActivePlaylistId,
    categorizePlaylist,
    addCategory,
    deleteCategory,
    reorderVideo,
    deleteVideo,
    syncToYouTube
  } = useStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#00f0ff');
  const [showCatModal, setShowCatModal] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  // Filter and search logic
  const filteredPlaylists = playlists.filter((pl) => {
    const matchesSearch = 
      pl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pl.description && pl.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategoryId === 'all') return matchesSearch;
    if (selectedCategoryId === 'uncategorized') return matchesSearch && pl.categoryId === null;
    return matchesSearch && pl.categoryId === selectedCategoryId;
  });

  const activePlaylist = playlists.find((pl) => pl.id === activePlaylistId);

  // Sync handler with animation
  const handleSync = async (playlistId: string) => {
    setSyncingIds(prev => ({ ...prev, [playlistId]: true }));
    try {
      await syncToYouTube(playlistId);
    } finally {
      setSyncingIds(prev => ({ ...prev, [playlistId]: false }));
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName, newCatColor);
    setNewCatName('');
    setShowCatModal(false);
  };

  // Estimate Quota consumption
  const totalDirtyPlaylists = playlists.filter(pl => pl.isDirty).length;
  const estimatedQuota = playlists.reduce((total, pl) => {
    if (!pl.isDirty) return total;
    return total + (pl.items.length * 50);
  }, 0);

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="glass app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <YoutubeIcon size={28} />
          </div>
          <div className="brand-title-group">
            <h1>
              YouTube Playlist Manager
              <span className="beta-badge">Beta</span>
            </h1>
            <p className="brand-subtitle">Triage, categorize, and sync playlists with YouTube API quota optimization</p>
          </div>
        </div>

        {/* Sync Panel / Quota Indicator */}
        <div className="status-panel">
          <div>
            <div className="status-label">Estimated Quota Usage</div>
            <div className="status-value">
              {estimatedQuota} <span>/ 10,000 units</span>
            </div>
          </div>
          <div className="status-divider"></div>
          <div className="sync-status">
            <span className="status-dot-wrapper" style={{ display: 'inline-flex', position: 'relative', height: '8px', width: '8px' }}>
              <span className={`status-dot-ping ${totalDirtyPlaylists > 0 ? 'dirty' : 'synced'}`} style={{ position: 'absolute', height: '100%', width: '100%', borderRadius: '9999px', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: '0.75' }}></span>
              <span className={`status-dot ${totalDirtyPlaylists > 0 ? 'dirty' : 'synced'}`} style={{ height: '8px', width: '8px', borderRadius: '9999px', display: 'inline-block' }}></span>
            </span>
            <span style={{ color: '#cbd5e1' }}>
              {totalDirtyPlaylists > 0 ? `${totalDirtyPlaylists} Playlists modified` : 'All synced'}
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
                <div key={cat.id} className="category-row">
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`nav-item ${selectedCategoryId === cat.id ? 'active' : ''}`}
                  >
                    <div className="nav-item-content">
                      <span className="color-dot" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="count-badge">
                      {playlists.filter(p => p.categoryId === cat.id).length}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
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
              {selectedCategoryId !== 'all' && selectedCategoryId !== 'uncategorized' && `${categories.find(c => c.id === selectedCategoryId)?.name} Playlists`}
            </h2>
            <span>Showing {filteredPlaylists.length} playlists</span>
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
                const playlistCat = categories.find(c => c.id === playlist.categoryId);
                const isSyncing = syncingIds[playlist.id] || false;

                return (
                  <article key={playlist.id} className="glass playlist-card">
                    {/* Thumbnail Image */}
                    <div 
                      onClick={() => setActivePlaylistId(playlist.id)}
                      className="playlist-thumb"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={playlist.thumbnail} 
                        alt={playlist.title}
                      />
                      <div className="playlist-overlay"></div>
                      <div className="video-count-badge">
                        {playlist.videoCount} videos
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
                        <h3 onClick={() => setActivePlaylistId(playlist.id)}>
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
                          onChange={(e) => categorizePlaylist(playlist.id, e.target.value || null)}
                          className="category-dropdown"
                        >
                          <option value="">Move to...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>

                        {/* Sync actions */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {playlist.isDirty ? (
                            <button
                              onClick={() => handleSync(playlist.id)}
                              disabled={isSyncing}
                              className="sync-button-yellow"
                            >
                              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                              {isSyncing ? 'Syncing...' : 'Sync'}
                            </button>
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

      {/* Slide-over Side Drawer (Playlist Videos Details) */}
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
                  <span>Video Playlist Order</span>
                  {activePlaylist.isDirty && (
                    <span className="unsaved-badge">
                      <AlertCircle size={10} />
                      Unsaved changes
                    </span>
                  )}
                </div>

                {/* Videos list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {activePlaylist.items.map((video, idx) => (
                    <div key={video.id} className="video-item">
                      <div className="video-info">
                        <h4>{video.title}</h4>
                        <p>{video.channelTitle} • {video.duration}</p>
                      </div>

                      {/* Reorder and Delete controls */}
                      <div className="video-controls">
                        <button
                          disabled={idx === 0}
                          onClick={() => reorderVideo(activePlaylist.id, video.id, idx - 1)}
                          className="video-control-btn"
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          disabled={idx === activePlaylist.items.length - 1}
                          onClick={() => reorderVideo(activePlaylist.id, video.id, idx + 1)}
                          className="video-control-btn"
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          onClick={() => deleteVideo(activePlaylist.id, video.id)}
                          className="video-delete-btn"
                          title="Remove Video"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer footer (Sync controls) */}
            <div className="drawer-footer">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Quota Estimated</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
                  {activePlaylist.isDirty ? `${activePlaylist.items.length * 50} units` : '0 units'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setActivePlaylistId(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {activePlaylist.isDirty && (
                  <button
                    onClick={() => handleSync(activePlaylist.id)}
                    disabled={syncingIds[activePlaylist.id] || false}
                    className="btn-sync-action"
                  >
                    <RefreshCw size={12} className={syncingIds[activePlaylist.id] ? 'animate-spin' : ''} />
                    {syncingIds[activePlaylist.id] ? 'Syncing...' : 'Sync changes'}
                  </button>
                )}
              </div>
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
                  placeholder="e.g. Cooking, Study, Gym..."
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
