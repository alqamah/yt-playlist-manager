import { Router } from 'express';
import crypto from 'crypto';
import { getOAuth2Client, getAuthorizationUrl } from '../utils/youtube';
import { google } from 'googleapis';
import { User } from '../models/User';

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    userId?: string;
  }
}

export const authRouter = Router();

/**
 * Endpoint to initiate the Google OAuth2 flow.
 * Generates a state token and redirects the browser.
 */
authRouter.get('/youtube', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  
  const authUrl = getAuthorizationUrl(state);
  res.redirect(authUrl);
});

/**
 * Endpoint to handle the callback from Google OAuth.
 * Exchanges code for tokens, upserts User, and establishes session.
 */
authRouter.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const sessionState = req.session.oauthState;
  
  if (error) {
    console.error('Google OAuth redirect error:', error);
    return res.status(400).send(`Authentication failed: ${error}`);
  }

  // 1. Verify CSRF State Parameter
  if (!state || state !== sessionState) {
    return res.status(400).send('Authentication failed: Invalid state parameter (CSRF attempt detected).');
  }

  // Clear state from session
  delete req.session.oauthState;

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Authentication failed: Authorization code missing.');
  }

  try {
    const oauth2Client = getOAuth2Client();
    
    // 2. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken({ code });
    oauth2Client.setCredentials(tokens);

    // 3. Retrieve user profile info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const googleUser = userInfoResponse.data;

    if (!googleUser.id || !googleUser.email) {
      return res.status(400).send('Authentication failed: Profile details not returned from Google.');
    }

    if (!tokens.refresh_token) {
      // If refresh token is missing, it means user previously authorized the app.
      // We must fetch user from DB. If not found, prompt them to re-consent.
      const existingUser = await User.findOne({ googleId: googleUser.id });
      if (!existingUser) {
        // Force re-authorization to get refresh token
        return res.redirect('/api/auth/youtube');
      }
      
      // Established session
      req.session.userId = (existingUser._id as string).toString();
      return res.redirect('http://localhost:3000');
    }

    // 4. Save/Update User and Token details in DB
    const user = await User.findOneAndUpdate(
      { googleId: googleUser.id },
      { 
        email: googleUser.email,
        displayName: googleUser.name || '',
        refreshToken: tokens.refresh_token
      },
      { upsert: true, new: true }
    );

    // 5. Establish server session
    req.session.userId = (user._id as string).toString();

    // 6. Redirect back to frontend dashboard
    res.redirect('http://localhost:3000');
  } catch (err) {
    console.error('Error during token exchange:', err);
    res.status(500).send('Internal Server Error: Failed to exchange tokens.');
  }
});

/**
 * Checks current session authentication status.
 */
authRouter.get('/status', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (err) {
    console.error('Error fetching auth status:', err);
    res.status(500).json({ error: 'Failed to retrieve auth status' });
  }
});

/**
 * Endpoint to destroy session.
 */
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout session destroy error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid'); // Clear default express-session cookie
    res.json({ success: true });
  });
});
