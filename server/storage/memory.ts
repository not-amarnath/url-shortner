interface UrlEntry {
  originalUrl: string;
  shortCode: string;
  visitCount: number;
  userId: string;
  userEmail: string;
  createdAt: Date;
}

// In-memory storage for demo purposes with persistence
const urlStorage = new Map<string, UrlEntry>();
const shortCodeIndex = new Map<string, string>(); // shortCode -> originalUrl
const userIndex = new Map<string, Set<string>>(); // userId -> Set of shortCodes

export const memoryStorage = {
  async findByOriginalUrl(originalUrl: string, userId: string): Promise<UrlEntry | null> {
    const entry = urlStorage.get(originalUrl + userId);
    return entry || null;
  },

  async findByShortCode(shortCode: string): Promise<UrlEntry | null> {
    const originalUrlWithUser = shortCodeIndex.get(shortCode);
    if (originalUrlWithUser) {
      return urlStorage.get(originalUrlWithUser) || null;
    }
    return null;
  },

  async save(originalUrl: string, shortCode: string, userId: string, userEmail: string): Promise<UrlEntry> {
    console.log('💾 Saving URL to memory storage:', {
      originalUrl,
      shortCode,
      userId,
      userEmail
    });

    const entry: UrlEntry = {
      originalUrl,
      shortCode,
      visitCount: 0,
      userId,
      userEmail,
      createdAt: new Date()
    };

    const key = originalUrl + userId;
    urlStorage.set(key, entry); // Use combined key to allow same URL for different users
    shortCodeIndex.set(shortCode, key);

    // Maintain user index for faster lookups
    if (!userIndex.has(userId)) {
      userIndex.set(userId, new Set());
    }
    userIndex.get(userId)!.add(shortCode);

    console.log('✅ URL saved successfully. Storage stats:', {
      totalUrls: urlStorage.size,
      userUrls: userIndex.get(userId)?.size || 0,
      userId: userId
    });

    return entry;
  },

  async findByUser(userId: string): Promise<UrlEntry[]> {
    console.log('🔍 Finding URLs for user:', userId);
    const userUrls: UrlEntry[] = [];

    // Use user index for faster lookup
    const userShortCodes = userIndex.get(userId);
    if (userShortCodes) {
      for (const shortCode of userShortCodes) {
        const key = shortCodeIndex.get(shortCode);
        if (key) {
          const entry = urlStorage.get(key);
          if (entry && entry.userId === userId) {
            userUrls.push(entry);
          }
        }
      }
    }

    // Fallback: search all entries if user index is empty (for backward compatibility)
    if (userUrls.length === 0) {
      console.log('📋 Using fallback search method');
      for (const entry of urlStorage.values()) {
        if (entry.userId === userId) {
          userUrls.push(entry);
          // Rebuild user index
          if (!userIndex.has(userId)) {
            userIndex.set(userId, new Set());
          }
          userIndex.get(userId)!.add(entry.shortCode);
        }
      }
    }

    console.log('📊 Memory storage stats:', {
      totalUsers: userIndex.size,
      totalUrls: urlStorage.size,
      userUrls: userUrls.length,
      userIndexSize: userIndex.get(userId)?.size || 0,
      requestedUserId: userId,
      allUserIds: [...userIndex.keys()]
    });

    return userUrls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  },

  async incrementVisitCount(shortCode: string): Promise<void> {
    const originalUrlWithUser = shortCodeIndex.get(shortCode);
    if (originalUrlWithUser) {
      const entry = urlStorage.get(originalUrlWithUser);
      if (entry) {
        entry.visitCount++;
      }
    }
  },

  async deleteByShortCode(shortCode: string): Promise<boolean> {
    const originalUrlWithUser = shortCodeIndex.get(shortCode);
    if (originalUrlWithUser) {
      const entry = urlStorage.get(originalUrlWithUser);
      if (entry) {
        // Remove from user index
        const userShortCodes = userIndex.get(entry.userId);
        if (userShortCodes) {
          userShortCodes.delete(shortCode);
          if (userShortCodes.size === 0) {
            userIndex.delete(entry.userId);
          }
        }
      }

      urlStorage.delete(originalUrlWithUser);
      shortCodeIndex.delete(shortCode);

      console.log('🗑️ URL deleted successfully:', {
        shortCode,
        remainingUrls: urlStorage.size,
        remainingUsers: userIndex.size
      });

      return true;
    }
    return false;
  },

  async exists(shortCode: string): Promise<boolean> {
    return shortCodeIndex.has(shortCode);
  },

  // For debugging
  getAll(): UrlEntry[] {
    return Array.from(urlStorage.values());
  },

  // Get storage statistics
  getStats() {
    const userStats = new Map<string, number>();
    for (const [userId, shortCodes] of userIndex.entries()) {
      userStats.set(userId, shortCodes.size);
    }

    return {
      totalUrls: urlStorage.size,
      totalUsers: userIndex.size,
      userStats: Object.fromEntries(userStats),
      shortCodes: Array.from(shortCodeIndex.keys()),
      userEmails: [...new Set(Array.from(urlStorage.values()).map(url => url.userEmail))]
    };
  }
};
