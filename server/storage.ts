import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, like, sql, or, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import * as schema from "@shared/schema";
import ws from "ws";

// Configure Neon WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Session store using PostgreSQL
const PostgresSessionStore = connectPg(session);

class DatabaseStorage {
  sessionStore: connectPg.PGStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed the database if it's empty
    this.seedDatabase();
  }

  // User related methods
  async getUser(id: number) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: any) {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }
  
  async updateUserProfile(userId: number, data: { firstName?: string, lastName?: string, email?: string }) {
    const [user] = await db.update(schema.users)
      .set(data)
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  async updateUserLanguage(userId: number, language: string) {
    const [user] = await db.update(schema.users)
      .set({ language })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  async updateUserVipStatus(userId: number, isVip: boolean, vipExpiresAt?: Date) {
    const [user] = await db.update(schema.users)
      .set({
        isVip,
        vipExpiresAt: vipExpiresAt || null
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  async updateUserPreferredQuality(userId: number, preferredQuality: string) {
    const [user] = await db.update(schema.users)
      .set({ preferredQuality })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  // Content related methods
  async getAllContent() {
    const results = await db.select().from(schema.content);
    return results.map(this.mapContentFromDb);
  }

  async getContentById(id: number) {
    const [result] = await db.select().from(schema.content).where(eq(schema.content.id, id));
    if (!result) return undefined;
    return this.mapContentFromDb(result);
  }

  async getContentByType(type: 'movie' | 'series') {
    const results = await db.select().from(schema.content).where(eq(schema.content.type, type));
    return results.map(this.mapContentFromDb);
  }

  async getFeaturedContent() {
    const exclusiveContent = await db.select().from(schema.content)
      .where(eq(schema.content.isExclusive, true))
      .limit(10);
    
    if (exclusiveContent.length === 0) {
      const [randomContent] = await db.select().from(schema.content).limit(1);
      return this.mapContentFromDb(randomContent);
    }
    
    const randomIndex = Math.floor(Math.random() * exclusiveContent.length);
    return this.mapContentFromDb(exclusiveContent[randomIndex]);
  }

  async getTrendingContent() {
    const results = await db.select().from(schema.content)
      .orderBy(sql`RANDOM()`)
      .limit(6);
    return results.map(this.mapContentFromDb);
  }

  async getRecommendedContent(userId: number) {
    // Get genres from user's favorite content
    const favoriteGenres = await db.select({ genres: schema.content.genres })
      .from(schema.content)
      .innerJoin(schema.favorites, eq(schema.content.id, schema.favorites.contentId))
      .where(eq(schema.favorites.userId, userId))
      .limit(3);
    
    if (favoriteGenres.length === 0) {
      return this.getTrendingContent();
    }
    
    // Flatten and deduplicate genres
    const uniqueGenres = [...new Set(favoriteGenres.flatMap(f => f.genres))];
    
    // Find content that matches any of the user's favorite genres
    const results = await db.select().from(schema.content)
      .where(
        or(
          ...uniqueGenres.map(genre => 
            sql`${schema.content.genres}::text[] && ARRAY[${genre}]::text[]`
          )
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(6);
    
    return results.map(this.mapContentFromDb);
  }

  async getPopularSeries() {
    const results = await db.select().from(schema.content)
      .where(eq(schema.content.type, 'series'))
      .orderBy(schema.content.rating.desc())
      .limit(6);
    return results.map(this.mapContentFromDb);
  }

  async getLatestMovies() {
    const results = await db.select().from(schema.content)
      .where(eq(schema.content.type, 'movie'))
      .orderBy(schema.content.releaseYear.desc())
      .limit(8);
    return results.map(this.mapContentFromDb);
  }

  async searchContent(query: string) {
    const lowerQuery = `%${query.toLowerCase()}%`;
    
    const results = await db.select().from(schema.content)
      .where(
        or(
          like(sql`LOWER(${schema.content.title})`, lowerQuery),
          like(sql`LOWER(${schema.content.description})`, lowerQuery),
          sql`EXISTS (
            SELECT 1 FROM unnest(${schema.content.genres}) AS genre 
            WHERE LOWER(genre) LIKE ${lowerQuery}
          )`
        )
      );
    
    return results.map(this.mapContentFromDb);
  }

  async getExclusiveContent() {
    const results = await db.select().from(schema.content)
      .where(eq(schema.content.isExclusive, true))
      .orderBy(sql`RANDOM()`)
      .limit(8);
    return results.map(this.mapContentFromDb);
  }

  // User progress related methods
  async getUserProgress(userId: number) {
    const results = await db.select().from(schema.progress)
      .where(eq(schema.progress.userId, userId))
      .orderBy(schema.progress.timestamp.desc());
    
    // Fetch associated content for each progress item
    const progressWithContent = await Promise.all(
      results.map(async (progress) => {
        const content = await this.getContentById(progress.contentId);
        return {
          ...progress,
          content
        };
      })
    );
    
    return progressWithContent;
  }

  async saveUserProgress(progressData: any) {
    // Check if progress entry already exists
    const [existingProgress] = await db.select().from(schema.progress)
      .where(
        and(
          eq(schema.progress.userId, progressData.userId),
          eq(schema.progress.contentId, progressData.contentId)
        )
      );
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db.update(schema.progress)
        .set({
          ...progressData,
          timestamp: new Date()
        })
        .where(eq(schema.progress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      // Create new progress entry
      const [newProgress] = await db.insert(schema.progress)
        .values({
          ...progressData,
          timestamp: new Date()
        })
        .returning();
      return newProgress;
    }
  }

  // User favorites related methods
  async getUserFavorites(userId: number) {
    // Get content IDs from user's favorites
    const userFavorites = await db.select({ contentId: schema.favorites.contentId })
      .from(schema.favorites)
      .where(eq(schema.favorites.userId, userId));
    
    if (userFavorites.length === 0) {
      return [];
    }
    
    // Get content details for all favorites
    const contentIds = userFavorites.map(f => f.contentId);
    const results = await db.select().from(schema.content)
      .where(inArray(schema.content.id, contentIds));
    
    return results.map(this.mapContentFromDb);
  }

  async addToFavorites(favorite: { userId: number, contentId: number }) {
    // Check if favorite already exists
    const [existingFavorite] = await db.select().from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, favorite.userId),
          eq(schema.favorites.contentId, favorite.contentId)
        )
      );
    
    if (!existingFavorite) {
      await db.insert(schema.favorites)
        .values({
          ...favorite,
          addedAt: new Date()
        });
    }
  }

  async removeFromFavorites(userId: number, contentId: number) {
    await db.delete(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, userId),
          eq(schema.favorites.contentId, contentId)
        )
      );
  }

  // Admin content management methods
  async addContent(contentData: any) {
    const [newContent] = await db.insert(schema.content)
      .values(contentData)
      .returning();
    return this.mapContentFromDb(newContent);
  }

  async updateContent(contentId: number, updateData: any) {
    const [updatedContent] = await db.update(schema.content)
      .set(updateData)
      .where(eq(schema.content.id, contentId))
      .returning();
    return this.mapContentFromDb(updatedContent);
  }

  async deleteContent(contentId: number) {
    await db.delete(schema.content)
      .where(eq(schema.content.id, contentId));
  }

  // Subscription plan related methods
  async getAllSubscriptionPlans() {
    const plans = await db.select().from(schema.subscriptionPlans)
      .orderBy(schema.subscriptionPlans.price);
    return plans;
  }

  async getSubscriptionPlanById(id: number) {
    const [plan] = await db.select().from(schema.subscriptionPlans)
      .where(eq(schema.subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: any) {
    const [newPlan] = await db.insert(schema.subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, data: any) {
    const [updatedPlan] = await db.update(schema.subscriptionPlans)
      .set(data)
      .where(eq(schema.subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteSubscriptionPlan(id: number) {
    await db.delete(schema.subscriptionPlans)
      .where(eq(schema.subscriptionPlans.id, id));
  }

  // User subscription related methods
  async getUserSubscription(userId: number) {
    const [subscription] = await db.select().from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.isActive, true)
        )
      );
    return subscription;
  }
  
  async getSubscriptionById(id: number) {
    const [subscription] = await db.select().from(schema.subscriptions)
      .where(eq(schema.subscriptions.id, id));
    return subscription;
  }

  async createSubscription(subscription: any) {
    const [newSubscription] = await db.insert(schema.subscriptions)
      .values(subscription)
      .returning();
    
    // Update user VIP status if subscription is active
    if (subscription.isActive) {
      await this.updateUserVipStatus(
        subscription.userId,
        true,
        subscription.endDate
      );
    }
    
    return newSubscription;
  }

  async updateSubscription(id: number, data: any) {
    const [updatedSubscription] = await db.update(schema.subscriptions)
      .set(data)
      .where(eq(schema.subscriptions.id, id))
      .returning();
    
    // Update user VIP status if subscription is inactive
    if (data.isActive === false) {
      await this.updateUserVipStatus(updatedSubscription.userId, false);
    }
    
    return updatedSubscription;
  }

  async cancelSubscription(id: number) {
    const [subscription] = await db.select().from(schema.subscriptions)
      .where(eq(schema.subscriptions.id, id));
    
    if (subscription) {
      await db.update(schema.subscriptions)
        .set({
          isActive: false,
          autoRenew: false
        })
        .where(eq(schema.subscriptions.id, id));
      
      // Remove VIP status from user
      await this.updateUserVipStatus(subscription.userId, false);
    }
  }

  // Payment related methods
  async getUserPayments(userId: number) {
    const userPayments = await db.select().from(schema.payments)
      .where(eq(schema.payments.userId, userId))
      .orderBy(schema.payments.timestamp.desc());
    return userPayments;
  }

  async createPayment(payment: any) {
    const [newPayment] = await db.insert(schema.payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: string, transactionId?: string) {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    const [updatedPayment] = await db.update(schema.payments)
      .set(updateData)
      .where(eq(schema.payments.id, id))
      .returning();
    
    // If payment is completed and associated with a subscription, activate the subscription
    if (status === 'completed' && updatedPayment.subscriptionId) {
      const [subscription] = await db.select().from(schema.subscriptions)
        .where(eq(schema.subscriptions.id, updatedPayment.subscriptionId));
      
      if (subscription) {
        await db.update(schema.subscriptions)
          .set({ isActive: true })
          .where(eq(schema.subscriptions.id, subscription.id));
        
        await this.updateUserVipStatus(
          updatedPayment.userId,
          true,
          subscription.endDate
        );
      }
    }
    
    return updatedPayment;
  }

  // Helper method to convert database content to API content format
  mapContentFromDb(dbContent: any) {
    return {
      id: dbContent.id,
      title: dbContent.title,
      description: dbContent.description,
      type: dbContent.type,
      releaseYear: dbContent.releaseYear,
      genres: dbContent.genres,
      posterUrl: dbContent.posterUrl,
      backdropUrl: dbContent.backdropUrl,
      rating: dbContent.rating || null,
      duration: dbContent.duration || null,
      trailerUrl: dbContent.trailerUrl || null,
      isExclusive: dbContent.isExclusive || false,
      isNew: dbContent.isNew || false,
      seasons: dbContent.seasons || null,
      videoUrl: dbContent.videoUrl || null,
      cast: dbContent.cast || null,
      director: dbContent.director || null,
      studio: dbContent.studio || null,
      maturityRating: dbContent.maturityRating || null,
      createdAt: dbContent.createdAt || null
    };
  }

  // Helper method to seed the database with initial content
  async seedDatabase() {
    try {
      // Only seed if database is empty
      const [contentCount] = await db.select({ count: sql`count(*)` }).from(schema.content);
      const [planCount] = await db.select({ count: sql`count(*)` }).from(schema.subscriptionPlans);
      
      if (parseInt(contentCount.count as string) === 0) {
        await this.seedContentData();
      }
      
      if (parseInt(planCount.count as string) === 0) {
        await this.seedSubscriptionPlans();
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }

  async seedSubscriptionPlans() {
    const plans = [
      {
        name: "Standard VIP",
        description: "Accès à tous les contenus VIP, qualité HD, recommendations personnalisées.",
        price: 5000, // 5000 XOF
        duration: 30, // 30 jours
        features: ["Contenu exclusif", "Qualité HD", "Recommendations personnalisées"],
        quality: "HD",
        isActive: true
      },
      {
        name: "Premium VIP",
        description: "Accès à tous les contenus VIP, qualité Ultra HD, téléchargements illimités, pas de publicités.",
        price: 9000, // 9000 XOF
        duration: 30, // 30 jours
        features: ["Contenu exclusif", "Qualité Ultra HD", "Téléchargements illimités", "Sans publicités"],
        quality: "4K",
        isActive: true
      },
      {
        name: "Famille VIP",
        description: "Tous les avantages Premium pour jusqu'à 4 profils différents.",
        price: 15000, // 15000 XOF
        duration: 30, // 30 jours
        features: ["Contenu exclusif", "Qualité Ultra HD", "Téléchargements illimités", "Sans publicités", "Jusqu'à 4 profils"],
        quality: "4K",
        isActive: true
      }
    ];
    
    await db.insert(schema.subscriptionPlans).values(plans);
  }

  async seedContentData() {
    const sampleContent = [
      {
        title: "Nebula Odyssey",
        description: "A captivating sci-fi adventure that follows humanity's first interstellar mission to a distant planet. When unexpected anomalies threaten their mission, the crew must navigate cosmic dangers and personal conflicts to survive.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Adventure", "Drama"],
        posterUrl: "https://source.unsplash.com/fUnfEz3VLv4",
        backdropUrl: "https://source.unsplash.com/vC8wj_Kphak",
        rating: 97,
        duration: 135,
        trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        isExclusive: true,
        isNew: true,
        videoUrl: "https://example.com/videos/nebula-odyssey"
      },
      {
        title: "Starlight Empire",
        description: "The galactic federation faces its greatest threat as rebel forces gain power. Follow Admiral Zara as she leads the last fleet to defend humanity's future.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Action", "Adventure"],
        posterUrl: "https://source.unsplash.com/vC8wj_Kphak",
        backdropUrl: "https://source.unsplash.com/vC8wj_Kphak",
        rating: 94,
        duration: 142,
        isExclusive: false,
        isNew: true,
        videoUrl: "https://example.com/videos/starlight-empire"
      },
      {
        title: "Cyber Revolution",
        description: "In a world where humans and AI have merged, one man discovers a conspiracy that could end humanity as we know it.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Thriller", "Action"],
        posterUrl: "https://source.unsplash.com/m3hn2Kn5Bns",
        backdropUrl: "https://source.unsplash.com/m3hn2Kn5Bns",
        rating: 92,
        duration: 118,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/cyber-revolution"
      },
      {
        title: "Quantum Portal",
        description: "Physicists open a gateway to parallel universes, but they may have unleashed something that cannot be controlled.",
        type: "movie",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Mystery", "Thriller"],
        posterUrl: "https://source.unsplash.com/_JBKdviweXI",
        backdropUrl: "https://source.unsplash.com/_JBKdviweXI",
        rating: 89,
        duration: 125,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/quantum-portal"
      },
      {
        title: "Neon Knights",
        description: "In a cyberpunk megacity, a team of rogue hackers battle corrupt corporations to free the city from digital tyranny.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Action", "Cyberpunk"],
        posterUrl: "https://source.unsplash.com/ZPeXrWxOjRQ",
        backdropUrl: "https://source.unsplash.com/ZPeXrWxOjRQ",
        rating: 95,
        duration: 133,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/neon-knights"
      },
      {
        title: "Aurora Rising",
        description: "When strange lights appear in the sky worldwide, an astronomer makes a discovery that will change our understanding of the universe.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Drama", "Mystery"],
        posterUrl: "https://source.unsplash.com/9xngoIpxcEo",
        backdropUrl: "https://source.unsplash.com/9xngoIpxcEo",
        rating: 91,
        duration: 128,
        isExclusive: true,
        isNew: false,
        videoUrl: "https://example.com/videos/aurora-rising"
      },
      {
        title: "Eternal Eclipse",
        description: "A space mission to study a mysterious solar eclipse discovers that it's actually an alien megastructure.",
        type: "movie",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Horror", "Mystery"],
        posterUrl: "https://source.unsplash.com/nT9X1dlW9h0",
        backdropUrl: "https://source.unsplash.com/nT9X1dlW9h0",
        rating: 88,
        duration: 115,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/eternal-eclipse"
      },
      {
        title: "Stellar Command",
        description: "The crew of the ISV Intrepid faces the challenges of deep space exploration and first contact with alien civilizations.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Adventure", "Drama"],
        posterUrl: "https://source.unsplash.com/vC8wj_Kphak",
        backdropUrl: "https://source.unsplash.com/vC8wj_Kphak",
        rating: 94,
        seasons: 3,
        isExclusive: false,
        isNew: true,
        videoUrl: "https://example.com/videos/stellar-command"
      },
      {
        title: "Temporal Agents",
        description: "A secret government agency polices time travel and prevents tampering with the timeline.",
        type: "series",
        releaseYear: 2020,
        genres: ["Sci-Fi", "Action", "Mystery"],
        posterUrl: "https://source.unsplash.com/hv4mY9eHUOg",
        backdropUrl: "https://source.unsplash.com/hv4mY9eHUOg",
        rating: 90,
        seasons: 5,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/temporal-agents"
      },
      {
        title: "Dream Protocol",
        description: "A new technology allows people to enter and manipulate dreams, but the boundary between dreams and reality begins to blur.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Thriller", "Mystery"],
        posterUrl: "https://source.unsplash.com/PDX_a_82obo",
        backdropUrl: "https://source.unsplash.com/PDX_a_82obo",
        rating: 92,
        seasons: 2,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/dream-protocol"
      },
      {
        title: "Cosmic Detectives",
        description: "Two detectives solve crimes across the galaxy, dealing with alien cultures and interstellar politics.",
        type: "series",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Crime", "Mystery"],
        posterUrl: "https://source.unsplash.com/Kp9RY6tC-HY",
        backdropUrl: "https://source.unsplash.com/Kp9RY6tC-HY",
        rating: 88,
        seasons: 1,
        isExclusive: true,
        isNew: false,
        videoUrl: "https://example.com/videos/cosmic-detectives"
      },
      {
        title: "Neon Dynasty",
        description: "In a future Japan, artificial intelligence has evolved to create a new social hierarchy and ignites a technological revolution.",
        type: "series",
        releaseYear: 2020,
        genres: ["Sci-Fi", "Drama", "Cyberpunk"],
        posterUrl: "https://source.unsplash.com/AYOloXG-Qig",
        backdropUrl: "https://source.unsplash.com/AYOloXG-Qig",
        rating: 93,
        seasons: 4,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/neon-dynasty"
      },
      {
        title: "Quantum Collapse",
        description: "Physicists discover that the universe is beginning to collapse, and they have only months to find a solution.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Drama", "Thriller"],
        posterUrl: "https://source.unsplash.com/5QgIuuBxKwM",
        backdropUrl: "https://source.unsplash.com/5QgIuuBxKwM",
        rating: 91,
        seasons: 2,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/quantum-collapse"
      },
      {
        title: "Galactic Frontiers",
        description: "Colonists on the edge of explored space face harsh conditions and discover mysterious alien artifacts.",
        type: "series",
        releaseYear: 2021,
        genres: ["Sci-Fi", "Adventure", "Mystery"],
        posterUrl: "https://source.unsplash.com/Y8K6WDctxBs",
        backdropUrl: "https://source.unsplash.com/Y8K6WDctxBs",
        rating: 87,
        seasons: 3,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/galactic-frontiers"
      },
      {
        title: "Astral Horizon",
        description: "A deep space exploration mission encounters a phenomenon that challenges our understanding of physics and reality.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Adventure", "Mystery"],
        posterUrl: "https://source.unsplash.com/U2BI3GMnSSE",
        backdropUrl: "https://source.unsplash.com/U2BI3GMnSSE",
        rating: 90,
        duration: 144,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/astral-horizon"
      },
      {
        title: "Cyber Nexus",
        description: "A hacker uncovers a global conspiracy involving mind control through neural implants.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Thriller", "Cyberpunk"],
        posterUrl: "https://source.unsplash.com/BtbjCFUvBXs",
        backdropUrl: "https://source.unsplash.com/BtbjCFUvBXs",
        rating: 89,
        seasons: 2,
        isExclusive: false,
        isNew: false,
        videoUrl: "https://example.com/videos/cyber-nexus"
      }
    ];
    
    await db.insert(schema.content).values(sampleContent);
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();