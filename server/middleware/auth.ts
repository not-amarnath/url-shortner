import { RequestHandler } from "express";

// Simple Firebase ID token verification (client-side tokens)
// In production, you should use Firebase Admin SDK for server-side verification
export const authenticateUser: RequestHandler = async (req, res, next) => {
  try {
    console.log('🔐 Authentication middleware called');
    console.log('Headers:', {
      authorization: req.headers.authorization ? 'Bearer token present' : 'No auth header',
      userId: req.headers['x-user-id'] || 'Missing',
      userEmail: req.headers['x-user-email'] || 'Missing'
    });

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      console.log('❌ Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // The client should send user info in headers after Firebase auth
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    if (!userId || !userEmail) {
      console.log('❌ User information missing:', { userId, userEmail });
      return res.status(401).json({ error: 'User information missing' });
    }

    // Add user info to request
    (req as any).user = {
      uid: userId,
      email: userEmail
    };

    console.log('✅ User authenticated:', { uid: userId, email: userEmail });
    next();
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware for optional authentication (for public URL access)
export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    
    if (authHeader && userId && userEmail) {
      (req as any).user = {
        uid: userId,
        email: userEmail
      };
    }
    
    next();
  } catch (error) {
    // Continue without auth for public access
    next();
  }
};
