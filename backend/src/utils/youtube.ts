import { google } from 'googleapis';
import dotenv from 'dotenv';
import { IUser } from '../models/User';

dotenv.config();

const clientID = process.env.GOOGLE_CLIENT_ID || '';
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const redirectURI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback';

if (!clientID || !clientSecret) {
  console.warn('WARNING: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set in environment variables.');
}

/**
 * Creates a fresh Google OAuth2 client.
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(clientID, clientSecret, redirectURI);
}

/**
 * Generates the redirect URL for YouTube OAuth authentication.
 */
export function getAuthorizationUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to receive a refresh token
    prompt: 'consent',     // Forces consent screen to ensure refresh token is returned
    state: state,
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  });
}

/**
 * Instantiates the YouTube Data API client authenticated for a specific user.
 * The googleapis client automatically manages token refresh routines in the background.
 */
export function getYouTubeClient(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}
