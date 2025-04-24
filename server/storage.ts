import { 
  users, type User, type InsertUser, 
  content, type Content, type InsertContent,
  progress, type Progress, type InsertProgress,
  favorites, type Favorite, type InsertFavorite,
  contentSchema 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, sql, desc, asc, or, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLanguage(userId: number, language: string): Promise<User | undefined>;
  
  // Content related methods
  getAllContent(): Promise<Content[]>;
  getContentById(id: number): Promise<Content | undefined>;
  getContentByType(type: "movie" | "series"): Promise<Content[]>;
  getFeaturedContent(): Promise<Content>;
  getTrendingContent(): Promise<Content[]>;
  getRecommendedContent(userId: number): Promise<Content[]>;
  getPopularSeries(): Promise<Content[]>;
  getLatestMovies(): Promise<Content[]>;
  searchContent(query: string): Promise<Content[]>;

  // User progress related methods
  getUserProgress(userId: number): Promise<Progress[]>;
  saveUserProgress(progress: InsertProgress): Promise<Progress>;
  
  // User favorites related methods
  getUserFavorites(userId: number): Promise<Content[]>;
  addToFavorites(favorite: InsertFavorite): Promise<void>;
  removeFromFavorites(userId: number, contentId: number): Promise<void>;
  
  // For user sessions
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Seed the database with sample content if it's empty
    this.seedDatabase();
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLanguage(userId: number, language: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ language })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Content related methods
  async getAllContent(): Promise<Content[]> {
    const results = await db.select().from(content);
    return results.map(this.mapContentFromDb);
  }

  async getContentById(id: number): Promise<Content | undefined> {
    const [result] = await db.select().from(content).where(eq(content.id, id));
    if (!result) return undefined;
    return this.mapContentFromDb(result);
  }

  async getContentByType(type: "movie" | "series"): Promise<Content[]> {
    const results = await db.select().from(content).where(eq(content.type, type));
    return results.map(this.mapContentFromDb);
  }

  async getFeaturedContent(): Promise<Content> {
    // Get a random piece of content marked as exclusive
    const exclusiveContent = await db
      .select()
      .from(content)
      .where(eq(content.isExclusive, true))
      .limit(10);
    
    if (exclusiveContent.length === 0) {
      // Fallback: Get any content
      const [randomContent] = await db.select().from(content).limit(1);
      return this.mapContentFromDb(randomContent);
    }
    
    // Pick a random exclusive content
    const randomIndex = Math.floor(Math.random() * exclusiveContent.length);
    return this.mapContentFromDb(exclusiveContent[randomIndex]);
  }

  async getTrendingContent(): Promise<Content[]> {
    // In a real app, this would be based on analytics
    // For now, get 6 random pieces of content
    const results = await db
      .select()
      .from(content)
      .orderBy(sql`RANDOM()`)
      .limit(6);
    
    return results.map(this.mapContentFromDb);
  }

  async getRecommendedContent(userId: number): Promise<Content[]> {
    // Get content based on user's favorites and progress
    // For now, return random content similar to favorites
    const favoriteGenres = await db
      .select({ genres: content.genres })
      .from(content)
      .innerJoin(favorites, eq(content.id, favorites.contentId))
      .where(eq(favorites.userId, userId))
      .limit(3);
    
    // If user has no favorites, return trending content
    if (favoriteGenres.length === 0) {
      return this.getTrendingContent();
    }
    
    // Get unique genres from favorites (flattened)
    const uniqueGenres = [...new Set(favoriteGenres.flatMap(f => f.genres))];
    
    // Get content that matches any of these genres
    const results = await db
      .select()
      .from(content)
      .where(
        or(
          ...uniqueGenres.map(genre => 
            sql`${content.genres}::text[] && ARRAY[${genre}]::text[]`
          )
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(6);
    
    return results.map(this.mapContentFromDb);
  }

  async getPopularSeries(): Promise<Content[]> {
    const results = await db
      .select()
      .from(content)
      .where(eq(content.type, "series"))
      .orderBy(content.rating.desc())
      .limit(6);
    
    return results.map(this.mapContentFromDb);
  }

  async getLatestMovies(): Promise<Content[]> {
    const results = await db
      .select()
      .from(content)
      .where(eq(content.type, "movie"))
      .orderBy(content.releaseYear.desc())
      .limit(8);
    
    return results.map(this.mapContentFromDb);
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    
    const results = await db
      .select()
      .from(content)
      .where(
        or(
          like(sql`LOWER(${content.title})`, lowerQuery),
          like(sql`LOWER(${content.description})`, lowerQuery),
          sql`EXISTS (
            SELECT 1 FROM unnest(${content.genres}) AS genre 
            WHERE LOWER(genre) LIKE ${lowerQuery}
          )`
        )
      );
    
    return results.map(this.mapContentFromDb);
  }

  // User progress related methods
  async getUserProgress(userId: number): Promise<Progress[]> {
    const results = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, userId));
    
    return results;
  }

  async saveUserProgress(progressData: InsertProgress): Promise<Progress> {
    // Check if progress already exists for this user and content
    const [existingProgress] = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, progressData.userId),
          eq(progress.contentId, progressData.contentId)
        )
      );
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(progress)
        .set({
          ...progressData,
          timestamp: new Date()
        })
        .where(eq(progress.id, existingProgress.id))
        .returning();
      
      return updatedProgress;
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(progress)
        .values({
          ...progressData,
          timestamp: new Date()
        })
        .returning();
      
      return newProgress;
    }
  }

  // User favorites related methods
  async getUserFavorites(userId: number): Promise<Content[]> {
    const userFavorites = await db
      .select({ contentId: favorites.contentId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    if (userFavorites.length === 0) {
      return [];
    }
    
    const contentIds = userFavorites.map(f => f.contentId);
    
    const results = await db
      .select()
      .from(content)
      .where(inArray(content.id, contentIds));
    
    return results.map(this.mapContentFromDb);
  }

  async addToFavorites(favorite: InsertFavorite): Promise<void> {
    // Check if already in favorites
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, favorite.userId),
          eq(favorites.contentId, favorite.contentId)
        )
      );
    
    if (!existingFavorite) {
      await db
        .insert(favorites)
        .values({
          ...favorite,
          addedAt: new Date()
        });
    }
  }

  async removeFromFavorites(userId: number, contentId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.contentId, contentId)
        )
      );
  }

    // Admin content management methods
  async addContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db
      .insert(content)
      .values(contentData)
      .returning();
    
    return this.mapContentFromDb(newContent);
  }
  
  async updateContent(contentId: number, updateData: Partial<InsertContent>): Promise<Content> {
    const [updatedContent] = await db
      .update(content)
      .set(updateData)
      .where(eq(content.id, contentId))
      .returning();
    
    return this.mapContentFromDb(updatedContent);
  }
  
  async deleteContent(contentId: number): Promise<void> {
    await db
      .delete(content)
      .where(eq(content.id, contentId));
  }

  // Helper method to convert database content to API content format
  private mapContentFromDb(dbContent: any): Content {
    // Make sure we handle null values properly
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
      createdAt: dbContent.createdAt || null
    };
  }

  // Helper method to seed the database with initial content
  private async seedDatabase() {
    // Check if content table is empty
    const [count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(content);
    
    if (count.count > 0) {
      return; // Database already has content
    }
    
    // Sample content to seed the database
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
    
    // Insert content in batches
    await db.insert(content).values(sampleContent);
  }
}

export const storage = new DatabaseStorage();