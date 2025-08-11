import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Url } from "../models/Url";
import { memoryStorage } from "../storage/memory";
import shortid from "shortid";

export const shortenUrl: RequestHandler = async (req, res) => {
  try {
    const { originalUrl } = req.body;
    const user = (req as any).user;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(originalUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Ensure URL has protocol
    const normalizedUrl = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`;

    const useDatabase = mongoose.connection.readyState === 1;

    console.log('💾 Database status:', {
      readyState: mongoose.connection.readyState,
      useDatabase,
      connectionName: mongoose.connection.name
    });

    if (useDatabase) {
      // Use MongoDB
      try {
        console.log('🔍 Checking for existing URL in MongoDB...');
        // Check if URL already exists for this user
        const existingUrl = await Url.findOne({
          originalUrl: normalizedUrl,
          userId: user.uid
        });

        console.log('📊 Existing URL check result:', existingUrl ? 'Found existing' : 'Not found');

        if (existingUrl) {
          console.log('✅ Returning existing short code:', existingUrl.shortCode);
          return res.json({ shortCode: existingUrl.shortCode });
        }

        // Generate unique short code
        console.log('🎲 Generating unique short code...');
        let shortCode: string;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          shortCode = shortid.generate();
          const existingCode = await Url.findOne({ shortCode });
          if (!existingCode) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          throw new Error('Failed to generate unique short code');
        }

        console.log('✅ Generated unique short code:', shortCode);

        // Create new URL entry
        const newUrl = new Url({
          originalUrl: normalizedUrl,
          shortCode: shortCode!,
          userId: user.uid,
          userEmail: user.email
        });

        console.log('💾 Saving to MongoDB...');
        const savedUrl = await newUrl.save();

        console.log('✅ URL saved to MongoDB:', {
          shortCode: savedUrl.shortCode,
          userId: savedUrl.userId,
          userEmail: savedUrl.userEmail,
          id: savedUrl._id
        });

        return res.json({ shortCode: shortCode! });
      } catch (dbError) {
        console.log('Database error, falling back to memory storage:', dbError);
        // Fall through to memory storage
      }
    }

    // Use memory storage (fallback or when database is not available)
    console.log('Using memory storage for URL shortening');

    // Check if URL already exists for this user in memory
    const existingEntry = await memoryStorage.findByOriginalUrl(normalizedUrl, user.uid);
    if (existingEntry) {
      return res.json({ shortCode: existingEntry.shortCode });
    }

    // Generate unique short code
    let shortCode: string;
    let isUnique = false;

    while (!isUnique) {
      shortCode = shortid.generate();
      const exists = await memoryStorage.exists(shortCode);
      if (!exists) {
        isUnique = true;
      }
    }

    // Save to memory storage
    await memoryStorage.save(normalizedUrl, shortCode!, user.uid, user.email);

    res.json({ shortCode: shortCode! });
  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const redirectUrl: RequestHandler = async (req, res) => {
  try {
    const { shortCode } = req.params;

    if (!shortCode) {
      return res.status(400).json({ error: 'Short code is required' });
    }

    const useDatabase = mongoose.connection.readyState === 1;

    if (useDatabase) {
      // Try MongoDB first
      try {
        const url = await Url.findOneAndUpdate(
          { shortCode },
          { $inc: { visitCount: 1 } },
          { new: true }
        );
        if (url) {
          return res.redirect(url.originalUrl);
        }
      } catch (dbError) {
        console.log('Database error, falling back to memory storage:', dbError);
        // Fall through to memory storage
      }
    }

    // Check memory storage
    const entry = await memoryStorage.findByShortCode(shortCode);
    if (entry) {
      // Increment visit count in memory
      await memoryStorage.incrementVisitCount(shortCode);
      return res.redirect(entry.originalUrl);
    }

    // URL not found in either storage
    return res.status(404).json({ error: 'URL not found' });
  } catch (error) {
    console.error('Error redirecting URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
