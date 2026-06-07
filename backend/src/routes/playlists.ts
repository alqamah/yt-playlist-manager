import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Playlist } from '../models/Playlist';
import { Category } from '../models/Category';
import { getYouTubeClient } from '../utils/youtube';

export const playlistsRouter = Router();

// Middleware to ensure user is logged in
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }
  next();
}

/**
 * Endpoint to list all user playlists cached in MongoDB.
 * Triggers an initial sync if none are found in the database.
 */
playlistsRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  try {
    let playlists = await Playlist.find({ userId });
    
    // If cache is empty, trigger an initial sync from YouTube
    if (playlists.length === 0) {
      console.log('Cache empty for user, executing initial YouTube sync...');
      await syncPlaylistsFromYouTube(userId as string);
      playlists = await Playlist.find({ userId });
    }
    
    res.json(playlists);
  } catch (err) {
    console.error('Error listing playlists:', err);
    res.status(500).json({ error: 'Failed to retrieve playlists' });
  }
});

/**
 * Endpoint to manually trigger a fresh synchronization from YouTube.
 */
playlistsRouter.post('/sync', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    await syncPlaylistsFromYouTube(userId as string);
    const playlists = await Playlist.find({ userId });
    res.json({ success: true, playlists });
  } catch (err) {
    console.error('Error syncing playlists:', err);
    res.status(500).json({ error: 'Failed to sync playlists with YouTube' });
  }
});

/**
 * Endpoint to update the category of a playlist.
 * Implements optimistic concurrency control via snapshotVersion.
 */
playlistsRouter.patch('/:id/category', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const playlistId = req.params.id;
  const { categoryId, clientVersion } = req.body; // clientVersion is snapshotVersion

  if (clientVersion === undefined) {
    return res.status(400).json({ error: 'Missing clientVersion for concurrency check' });
  }

  try {
    // 1. Verify category exists if provided
    if (categoryId) {
      const categoryExists = await Category.findOne({ _id: categoryId, userId });
      if (!categoryExists) {
        return res.status(400).json({ error: 'Category does not exist or unauthorized' });
      }
    }

    // 2. Perform atomic update with optimistic locking check
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      { 
        _id: playlistId, 
        userId,
        snapshotVersion: clientVersion 
      },
      { 
        $set: { categoryId: categoryId || null, isDirty: true },
        $inc: { snapshotVersion: 1 } 
      },
      { new: true }
    );

    if (!updatedPlaylist) {
      // If matchedCount is 0, the record has been modified by another process
      return res.status(499).json({ 
        error: 'ConcurrencyConflict: The playlist has been updated by another session. Please refresh.' 
      });
    }

    res.json(updatedPlaylist);
  } catch (err) {
    console.error('Error updating playlist category:', err);
    res.status(500).json({ error: 'Failed to update playlist category' });
  }
});

/**
 * Core utility function to sync YouTube playlists and videos to MongoDB cache.
 */
async function syncPlaylistsFromYouTube(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  const youtube = getYouTubeClient(user.refreshToken);
  
  // 1. Fetch user playlists
  let nextPlaylistsPageToken: string | undefined = undefined;
  const ytPlaylists = [];
  
  do {
    const playlistsResponse: any = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
      pageToken: nextPlaylistsPageToken
    });
    
    if (playlistsResponse.data.items) {
      ytPlaylists.push(...playlistsResponse.data.items);
    }
    nextPlaylistsPageToken = playlistsResponse.data.nextPageToken || undefined;
  } while (nextPlaylistsPageToken);

  console.log(`Fetched ${ytPlaylists.length} playlists from YouTube. Fetching items...`);

  // 2. For each playlist, fetch its items (videos)
  for (const pl of ytPlaylists) {
    let nextItemsPageToken: string | undefined = undefined;
    const items = [];
    
    try {
      do {
        const itemsResponse: any = await youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: pl.id,
          maxResults: 50,
          pageToken: nextItemsPageToken
        });
        
        if (itemsResponse.data.items) {
          items.push(...itemsResponse.data.items);
        }
        nextItemsPageToken = itemsResponse.data.nextPageToken || undefined;
      } while (nextItemsPageToken);
    } catch (err) {
      console.warn(`Warning: Could not fetch items for playlist ${pl.id} (${pl.snippet?.title}):`, err);
    }

    // Map YouTube items to our embedded schema format
    const mappedItems = items.map((item: any, index: number) => {
      const videoTitle = item.snippet?.title || 'Unknown Video';
      const videoThumbnail = item.snippet?.thumbnails?.default?.url || 
                            item.snippet?.thumbnails?.medium?.url || 
                            item.snippet?.thumbnails?.high?.url || 
                            '';
      return {
        videoId: item.snippet?.resourceId?.videoId || '',
        position: item.snippet?.position !== undefined ? item.snippet.position : index,
        title: videoTitle,
        thumbnail: videoThumbnail
      };
    });

    const title = pl.snippet?.title || 'Untitled Playlist';
    const description = pl.snippet?.description || '';
    const thumbnail = pl.snippet?.thumbnails?.high?.url || pl.snippet?.thumbnails?.medium?.url || pl.snippet?.thumbnails?.default?.url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

    // 3. Upsert into MongoDB
    // Preserve local fields like categoryId if it already exists
    const existingPlaylist = await Playlist.findOne({ _id: pl.id, userId });
    
    await Playlist.findOneAndUpdate(
      { _id: pl.id, userId },
      {
        $set: {
          title,
          description,
          thumbnail,
          items: mappedItems,
          lastSyncedAt: new Date(),
          isDirty: false // Newly synced from YouTube means in-sync
        },
        $setOnInsert: {
          categoryId: null,
          snapshotVersion: 1
        }
      },
      { upsert: true, new: true }
    );
  }
}
