import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylistItem {
  videoId: string;
  position: number;
  title: string;
  thumbnail: string;
}

export interface IPlaylist extends Omit<Document, '_id'> {
  _id: string; // YouTube Playlist ID
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId | null;
  title: string;
  description: string;
  snapshotVersion: number;
  isDirty: boolean;
  lastSyncedAt: Date;
  items: IPlaylistItem[];
}

const PlaylistItemSchema = new Schema({
  videoId: { type: String, required: true },
  position: { type: Number, required: true },
  title: { type: String, default: '' },
  thumbnail: { type: String, default: '' }
});

const PlaylistSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  snapshotVersion: { type: Number, default: 1 },
  isDirty: { type: Boolean, default: false },
  lastSyncedAt: { type: Date, default: Date.now },
  items: [PlaylistItemSchema]
});

export const Playlist = mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
