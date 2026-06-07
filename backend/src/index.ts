import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth';
import { playlistsRouter } from './routes/playlists';
import { categoriesRouter } from './routes/categories';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/yt-manager';
const sessionSecret = process.env.SESSION_SECRET || 'yt-playlist-manager-secret-key-change-me';

// 1. Establish Database Connection
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB database successfully.'))
  .catch((err) => console.error('MongoDB database connection error:', err));

// 2. CORS configuration enabling credentialed request cookies
app.use(cors({
  origin: 'http://localhost:3000', // Dashboard frontend URL
  credentials: true
}));

app.use(express.json());

// 3. Configure Express Cookie Sessions backed by MongoDB store
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days session life
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000,
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// 4. API Endpoints Routing
app.use('/api/auth', authRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/categories', categoriesRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`Backend API server running on port ${port}`);
});
