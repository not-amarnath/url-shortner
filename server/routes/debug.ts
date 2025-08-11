import { RequestHandler } from "express";
import { memoryStorage } from "../storage/memory";

export const getStoredUrls: RequestHandler = (req, res) => {
  try {
    const urls = memoryStorage.getAll();
    const stats = memoryStorage.getStats();

    res.json({
      count: urls.length,
      stats: stats,
      urls: urls.map(url => ({
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        userId: url.userId,
        userEmail: url.userEmail,
        visitCount: url.visitCount,
        createdAt: url.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting stored URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
