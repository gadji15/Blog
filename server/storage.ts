import { users, type User, type InsertUser } from "@shared/schema";
import { type Content, type Progress, type Favorite } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
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
  saveUserProgress(progress: Progress): Promise<Progress>;
  
  // User favorites related methods
  getUserFavorites(userId: number): Promise<Content[]>;
  addToFavorites(favorite: Favorite): Promise<void>;
  removeFromFavorites(userId: number, contentId: number): Promise<void>;
  
  // For user sessions
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private content: Map<number, Content>;
  private progress: Progress[];
  private favorites: Favorite[];
  currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.progress = [];
    this.favorites = [];
    this.currentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with sample content
    this.initializeContent();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLanguage(userId: number, language: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    user.language = language;
    this.users.set(userId, user);
    return user;
  }

  async getAllContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContentById(id: number): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async getContentByType(type: "movie" | "series"): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.type === type
    );
  }

  async getFeaturedContent(): Promise<Content> {
    // Get one random featured content
    const allContent = Array.from(this.content.values());
    return allContent[Math.floor(Math.random() * allContent.length)];
  }

  async getTrendingContent(): Promise<Content[]> {
    // Get random content as trending (in real world would be based on analytics)
    const allContent = Array.from(this.content.values());
    return this.shuffleArray(allContent).slice(0, 6);
  }

  async getRecommendedContent(userId: number): Promise<Content[]> {
    // In a real app, this would use user preferences
    const allContent = Array.from(this.content.values());
    return this.shuffleArray(allContent).slice(0, 6);
  }

  async getPopularSeries(): Promise<Content[]> {
    const series = Array.from(this.content.values()).filter(
      (content) => content.type === "series"
    );
    return this.shuffleArray(series).slice(0, 6);
  }

  async getLatestMovies(): Promise<Content[]> {
    const movies = Array.from(this.content.values()).filter(
      (content) => content.type === "movie"
    );
    return this.shuffleArray(movies).slice(0, 8);
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter(
      (content) => 
        content.title.toLowerCase().includes(lowerQuery) ||
        content.description.toLowerCase().includes(lowerQuery) ||
        content.genres.some(genre => genre.toLowerCase().includes(lowerQuery))
    );
  }

  async getUserProgress(userId: number): Promise<Progress[]> {
    return this.progress.filter(p => p.userId === userId);
  }

  async saveUserProgress(progress: Progress): Promise<Progress> {
    // Check if progress already exists for this user and content
    const existingIndex = this.progress.findIndex(
      p => p.userId === progress.userId && p.contentId === progress.contentId
    );
    
    if (existingIndex >= 0) {
      // Update existing progress
      this.progress[existingIndex] = {
        ...this.progress[existingIndex],
        ...progress,
        timestamp: new Date()
      };
      return this.progress[existingIndex];
    } else {
      // Add new progress
      const newProgress = {
        ...progress,
        timestamp: new Date()
      };
      this.progress.push(newProgress);
      return newProgress;
    }
  }

  async getUserFavorites(userId: number): Promise<Content[]> {
    const userFavorites = this.favorites.filter(f => f.userId === userId);
    const contentIds = userFavorites.map(f => f.contentId);
    return Array.from(this.content.values()).filter(
      content => contentIds.includes(content.id)
    );
  }

  async addToFavorites(favorite: Favorite): Promise<void> {
    // Check if already in favorites
    const exists = this.favorites.some(
      f => f.userId === favorite.userId && f.contentId === favorite.contentId
    );
    
    if (!exists) {
      this.favorites.push({
        ...favorite,
        addedAt: new Date()
      });
    }
  }

  async removeFromFavorites(userId: number, contentId: number): Promise<void> {
    this.favorites = this.favorites.filter(
      f => !(f.userId === userId && f.contentId === contentId)
    );
  }

  // Helper function to shuffle an array
  private shuffleArray<T>(array: T[]): T[] {
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
  }

  // Initialize with sample content
  private initializeContent() {
    const sampleContent: Content[] = [
      {
        id: 1,
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
        id: 2,
        title: "Starlight Empire",
        description: "The galactic federation faces its greatest threat as rebel forces gain power. Follow Admiral Zara as she leads the last fleet to defend humanity's future.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Action", "Adventure"],
        posterUrl: "https://source.unsplash.com/vC8wj_Kphak",
        backdropUrl: "https://source.unsplash.com/vC8wj_Kphak",
        rating: 94,
        duration: 142,
        isNew: true,
        videoUrl: "https://example.com/videos/starlight-empire"
      },
      {
        id: 3,
        title: "Cyber Revolution",
        description: "In a world where humans and AI have merged, one man discovers a conspiracy that could end humanity as we know it.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Thriller", "Action"],
        posterUrl: "https://source.unsplash.com/m3hn2Kn5Bns",
        backdropUrl: "https://source.unsplash.com/m3hn2Kn5Bns",
        rating: 92,
        duration: 118,
        videoUrl: "https://example.com/videos/cyber-revolution"
      },
      {
        id: 4,
        title: "Quantum Portal",
        description: "Physicists open a gateway to parallel universes, but they may have unleashed something that cannot be controlled.",
        type: "movie",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Mystery", "Thriller"],
        posterUrl: "https://source.unsplash.com/_JBKdviweXI",
        backdropUrl: "https://source.unsplash.com/_JBKdviweXI",
        rating: 89,
        duration: 125,
        videoUrl: "https://example.com/videos/quantum-portal"
      },
      {
        id: 5,
        title: "Neon Knights",
        description: "In a cyberpunk megacity, a team of rogue hackers battle corrupt corporations to free the city from digital tyranny.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Action", "Cyberpunk"],
        posterUrl: "https://source.unsplash.com/ZPeXrWxOjRQ",
        backdropUrl: "https://source.unsplash.com/ZPeXrWxOjRQ",
        rating: 95,
        duration: 133,
        videoUrl: "https://example.com/videos/neon-knights"
      },
      {
        id: 6,
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
        videoUrl: "https://example.com/videos/aurora-rising"
      },
      {
        id: 7,
        title: "Eternal Eclipse",
        description: "A space mission to study a mysterious solar eclipse discovers that it's actually an alien megastructure.",
        type: "movie",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Horror", "Mystery"],
        posterUrl: "https://source.unsplash.com/nT9X1dlW9h0",
        backdropUrl: "https://source.unsplash.com/nT9X1dlW9h0",
        rating: 88,
        duration: 115,
        videoUrl: "https://example.com/videos/eternal-eclipse"
      },
      {
        id: 8,
        title: "Stellar Command",
        description: "The crew of the ISV Intrepid faces the challenges of deep space exploration and first contact with alien civilizations.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Adventure", "Drama"],
        posterUrl: "https://source.unsplash.com/vC8wj_Kphak",
        backdropUrl: "https://source.unsplash.com/vC8wj_Kphak",
        rating: 94,
        seasons: 3,
        isNew: true,
        videoUrl: "https://example.com/videos/stellar-command"
      },
      {
        id: 9,
        title: "Temporal Agents",
        description: "A secret government agency polices time travel and prevents tampering with the timeline.",
        type: "series",
        releaseYear: 2020,
        genres: ["Sci-Fi", "Action", "Mystery"],
        posterUrl: "https://source.unsplash.com/hv4mY9eHUOg",
        backdropUrl: "https://source.unsplash.com/hv4mY9eHUOg",
        rating: 90,
        seasons: 5,
        videoUrl: "https://example.com/videos/temporal-agents"
      },
      {
        id: 10,
        title: "Dream Protocol",
        description: "A new technology allows people to enter and manipulate dreams, but the boundary between dreams and reality begins to blur.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Thriller", "Mystery"],
        posterUrl: "https://source.unsplash.com/PDX_a_82obo",
        backdropUrl: "https://source.unsplash.com/PDX_a_82obo",
        rating: 92,
        seasons: 2,
        videoUrl: "https://example.com/videos/dream-protocol"
      },
      {
        id: 11,
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
        videoUrl: "https://example.com/videos/cosmic-detectives"
      },
      {
        id: 12,
        title: "Neon Dynasty",
        description: "In a future Japan, artificial intelligence has evolved to create a new social hierarchy and ignites a technological revolution.",
        type: "series",
        releaseYear: 2020,
        genres: ["Sci-Fi", "Drama", "Cyberpunk"],
        posterUrl: "https://source.unsplash.com/AYOloXG-Qig",
        backdropUrl: "https://source.unsplash.com/AYOloXG-Qig",
        rating: 93,
        seasons: 4,
        videoUrl: "https://example.com/videos/neon-dynasty"
      },
      {
        id: 13,
        title: "Quantum Collapse",
        description: "Physicists discover that the universe is beginning to collapse, and they have only months to find a solution.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Drama", "Thriller"],
        posterUrl: "https://source.unsplash.com/5QgIuuBxKwM",
        backdropUrl: "https://source.unsplash.com/5QgIuuBxKwM",
        rating: 91,
        seasons: 2,
        videoUrl: "https://example.com/videos/quantum-collapse"
      },
      {
        id: 14,
        title: "Galactic Frontiers",
        description: "Colonists on the edge of explored space face harsh conditions and discover mysterious alien artifacts.",
        type: "series",
        releaseYear: 2021,
        genres: ["Sci-Fi", "Adventure", "Mystery"],
        posterUrl: "https://source.unsplash.com/Y8K6WDctxBs",
        backdropUrl: "https://source.unsplash.com/Y8K6WDctxBs",
        rating: 87,
        seasons: 3,
        videoUrl: "https://example.com/videos/galactic-frontiers"
      },
      {
        id: 15,
        title: "Astral Horizon",
        description: "A deep space exploration mission encounters a phenomenon that challenges our understanding of physics and reality.",
        type: "movie",
        releaseYear: 2023,
        genres: ["Sci-Fi", "Adventure", "Mystery"],
        posterUrl: "https://source.unsplash.com/U2BI3GMnSSE",
        backdropUrl: "https://source.unsplash.com/U2BI3GMnSSE",
        rating: 90,
        duration: 144,
        videoUrl: "https://example.com/videos/astral-horizon"
      },
      {
        id: 16,
        title: "Cyber Nexus",
        description: "A hacker uncovers a global conspiracy involving mind control through neural implants.",
        type: "series",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Thriller", "Cyberpunk"],
        posterUrl: "https://source.unsplash.com/BtbjCFUvBXs",
        backdropUrl: "https://source.unsplash.com/BtbjCFUvBXs",
        rating: 89,
        seasons: 2,
        videoUrl: "https://example.com/videos/cyber-nexus"
      },
      {
        id: 17,
        title: "Parallel Dreams",
        description: "A machine that can record and play back dreams reveals alternate realities and hidden truths.",
        type: "movie",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Drama", "Mystery"],
        posterUrl: "https://source.unsplash.com/c9FQyqIECds",
        backdropUrl: "https://source.unsplash.com/c9FQyqIECds",
        rating: 86,
        duration: 112,
        videoUrl: "https://example.com/videos/parallel-dreams"
      },
      {
        id: 18,
        title: "Time Paradox",
        description: "A time traveler breaks the cardinal rule and changes his past, creating a cascade of unintended consequences.",
        type: "movie",
        releaseYear: 2022,
        genres: ["Sci-Fi", "Thriller", "Mystery"],
        posterUrl: "https://source.unsplash.com/hv4mY9eHUOg",
        backdropUrl: "https://source.unsplash.com/hv4mY9eHUOg",
        rating: 93,
        duration: 127,
        videoUrl: "https://example.com/videos/time-paradox"
      }
    ];

    sampleContent.forEach(content => {
      this.content.set(content.id, content);
    });
  }
}

export const storage = new MemStorage();
