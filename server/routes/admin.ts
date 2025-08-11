import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Url } from "../models/Url";
import { memoryStorage } from "../storage/memory";

export const getAllUrls: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    console.log('📊 Admin getAllUrls called');
    console.log('User from request:', user);

    if (!user) {
      console.log('❌ No user in request object');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('✅ Fetching URLs for user:', { uid: user.uid, email: user.email });

    const useDatabase = mongoose.connection.readyState === 1;

    console.log('📊 Admin dashboard - Database status:', {
      readyState: mongoose.connection.readyState,
      useDatabase,
      requestingUser: user.uid
    });

    if (useDatabase) {
      try {
        console.log('🔍 Fetching URLs from MongoDB for user:', user.uid);
        const urls = await Url.find({ userId: user.uid })
          .sort({ createdAt: -1 })
          .select('originalUrl shortCode visitCount createdAt updatedAt userId userEmail');

        console.log('📊 MongoDB query result:', {
          totalFound: urls.length,
          userId: user.uid,
          userEmail: user.email
        });

        // Double-check: filter again to ensure only user's URLs
        const userFilteredUrls = urls.filter(url => url.userId === user.uid);

        console.log('📊 Database results:', {
          totalFound: urls.length,
          afterUserFilter: userFilteredUrls.length,
          requestingUser: user.uid
        });

        return res.json({
          urls: userFilteredUrls.map(url => ({
            originalUrl: url.originalUrl,
            shortCode: url.shortCode,
            visitCount: url.visitCount,
            createdAt: url.createdAt,
            updatedAt: url.updatedAt,
            userId: url.userId,
            userEmail: url.userEmail
          })),
          total: userFilteredUrls.length,
          debug: {
            requestingUser: user.uid,
            requestingEmail: user.email
          }
        });
      } catch (dbError) {
        console.log('Database error, falling back to memory storage:', dbError);
      }
    }

    // Use memory storage - get user-specific URLs
    const urls = await memoryStorage.findByUser(user.uid);

    // Double-check: ensure all URLs belong to the requesting user
    const strictUserUrls = urls.filter(url => url.userId === user.uid);

    console.log('📊 Memory storage results:', {
      totalFound: urls.length,
      afterStrictFilter: strictUserUrls.length,
      requestingUser: user.uid
    });

    res.json({
      urls: strictUserUrls.map(url => ({
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        visitCount: url.visitCount,
        createdAt: url.createdAt,
        updatedAt: url.createdAt, // Memory storage doesn't track updates
        userId: url.userId,
        userEmail: url.userEmail
      })),
      total: strictUserUrls.length,
      debug: {
        requestingUser: user.uid,
        requestingEmail: user.email
      }
    });
  } catch (error) {
    console.error('Error getting user URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUrl: RequestHandler = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const user = (req as any).user;

    if (!shortCode) {
      return res.status(400).json({ error: 'Short code is required' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const useDatabase = mongoose.connection.readyState === 1;

    if (useDatabase) {
      try {
        // Only delete if the URL belongs to the authenticated user
        const deletedUrl = await Url.findOneAndDelete({
          shortCode,
          userId: user.uid
        });

        if (deletedUrl) {
          return res.json({
            message: 'URL deleted successfully',
            deletedUrl: {
              originalUrl: deletedUrl.originalUrl,
              shortCode: deletedUrl.shortCode,
              visitCount: deletedUrl.visitCount
            }
          });
        }
      } catch (dbError) {
        console.log('Database error, falling back to memory storage:', dbError);
      }
    }

    // Use memory storage - check ownership before deleting
    const urlToDelete = await memoryStorage.findByShortCode(shortCode);
    if (urlToDelete && urlToDelete.userId === user.uid) {
      const deleted = await memoryStorage.deleteByShortCode(shortCode);
      if (deleted) {
        return res.json({
          message: 'URL deleted successfully from memory storage',
          shortCode
        });
      }
    }

    res.status(404).json({ error: 'URL not found or not authorized' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
