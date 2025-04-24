import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertContentSchema } from "@shared/schema";

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Content routes
  app.get("/api/content", async (req, res, next) => {
    try {
      const content = await storage.getAllContent();
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/content/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const content = await storage.getContentById(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      res.json(content);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/movies", async (req, res, next) => {
    try {
      const movies = await storage.getContentByType("movie");
      res.json(movies);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/series", async (req, res, next) => {
    try {
      const series = await storage.getContentByType("series");
      res.json(series);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/featured", async (req, res, next) => {
    try {
      const featured = await storage.getFeaturedContent();
      res.json(featured);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/trending", async (req, res, next) => {
    try {
      const trending = await storage.getTrendingContent();
      res.json(trending);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/recommended", ensureAuthenticated, async (req, res, next) => {
    try {
      const recommended = await storage.getRecommendedContent(req.user.id);
      res.json(recommended);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/popular-series", async (req, res, next) => {
    try {
      const popularSeries = await storage.getPopularSeries();
      res.json(popularSeries);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/latest-movies", async (req, res, next) => {
    try {
      const latestMovies = await storage.getLatestMovies();
      res.json(latestMovies);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/search", async (req, res, next) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchContent(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  // User progress routes
  app.get("/api/progress", ensureAuthenticated, async (req, res, next) => {
    try {
      const progress = await storage.getUserProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/progress", ensureAuthenticated, async (req, res, next) => {
    try {
      const progress = {
        ...req.body,
        userId: req.user.id
      };
      
      const savedProgress = await storage.saveUserProgress(progress);
      res.json(savedProgress);
    } catch (error) {
      next(error);
    }
  });

  // Favorites routes
  app.get("/api/favorites", ensureAuthenticated, async (req, res, next) => {
    try {
      const favorites = await storage.getUserFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/favorites", ensureAuthenticated, async (req, res, next) => {
    try {
      const { contentId } = req.body;
      if (!contentId) {
        return res.status(400).json({ message: "Content ID is required" });
      }
      
      await storage.addToFavorites({
        userId: req.user.id,
        contentId: contentId
      });
      
      res.status(201).json({ message: "Added to favorites" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/favorites/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      await storage.removeFromFavorites(req.user.id, contentId);
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      next(error);
    }
  });

  // Admin content management routes
  app.post("/api/admin/content", ensureAdmin, async (req, res, next) => {
    try {
      // Parse and validate the input using the schema
      const contentData = insertContentSchema.parse(req.body);
      
      // Add content to database
      const newContent = await storage.addContent(contentData);
      
      res.status(201).json(newContent);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/content/:id", ensureAdmin, async (req, res, next) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // First check if content exists
      const existingContent = await storage.getContentById(contentId);
      if (!existingContent) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Update content in database
      const updatedContent = await storage.updateContent(contentId, req.body);
      
      res.json(updatedContent);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/content/:id", ensureAdmin, async (req, res, next) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // First check if content exists
      const existingContent = await storage.getContentById(contentId);
      if (!existingContent) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Delete content from database
      await storage.deleteContent(contentId);
      
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
