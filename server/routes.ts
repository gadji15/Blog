import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertContentSchema, 
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema, 
  insertPaymentSchema 
} from "@shared/schema";

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

// Middleware to check if user has VIP status
const ensureVIP = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.isVip) {
    return next();
  }
  res.status(403).json({ message: "VIP subscription required to access this resource" });
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
      
      // If content is exclusive and user is not VIP, hide video URL
      if (content.isExclusive && (!req.isAuthenticated() || !req.user?.isVip)) {
        const { videoUrl, ...contentInfo } = content;
        return res.json({
          ...contentInfo,
          videoUrl: null,
          vipRequired: true
        });
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
  
  // VIP and subscription plan routes
  app.get("/api/exclusive-content", ensureVIP, async (req, res, next) => {
    try {
      const exclusiveContent = await storage.getExclusiveContent();
      res.json(exclusiveContent);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/subscription-plans", async (req, res, next) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/user/subscription", ensureAuthenticated, async (req, res, next) => {
    try {
      const subscription = await storage.getUserSubscription(req.user.id);
      res.json(subscription || { active: false });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/subscribe", ensureAuthenticated, async (req, res, next) => {
    try {
      const { planId, paymentMethod, autoRenew = false } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }
      
      // Get the subscription plan
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Calculate subscription end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // Create subscription (initially inactive until payment is confirmed)
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        planId: plan.id,
        startDate,
        endDate,
        autoRenew,
        isActive: false
      });
      
      // Create a pending payment
      const payment = await storage.createPayment({
        userId: req.user.id,
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: "XOF",
        paymentMethod,
        paymentDetails: req.body.paymentDetails || {},
        status: "pending",
        timestamp: new Date(),
        transactionId: null
      });
      
      res.status(201).json({
        subscription,
        payment,
        plan
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/payments/complete", ensureAuthenticated, async (req, res, next) => {
    try {
      const { paymentId, transactionId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }
      
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID is required" });
      }
      
      // Update payment status
      const payment = await storage.updatePaymentStatus(
        paymentId,
        "completed",
        transactionId
      );
      
      // Get subscription
      if (payment.subscriptionId) {
        const subscription = await storage.getUserSubscription(req.user.id);
        res.json({ payment, subscription });
      } else {
        res.json({ payment });
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/payments", ensureAuthenticated, async (req, res, next) => {
    try {
      const payments = await storage.getUserPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/cancel-subscription", ensureAuthenticated, async (req, res, next) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID is required" });
      }
      
      await storage.cancelSubscription(subscriptionId);
      res.json({ message: "Subscription canceled successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin subscription plan management routes
  app.post("/api/admin/subscription-plans", ensureAdmin, async (req, res, next) => {
    try {
      // Parse and validate the input using the schema
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      
      // Add plan to database
      const newPlan = await storage.createSubscriptionPlan(planData);
      
      res.status(201).json(newPlan);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/admin/subscription-plans/:id", ensureAdmin, async (req, res, next) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // First check if plan exists
      const existingPlan = await storage.getSubscriptionPlanById(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Update plan in database
      const updatedPlan = await storage.updateSubscriptionPlan(planId, req.body);
      
      res.json(updatedPlan);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/admin/subscription-plans/:id", ensureAdmin, async (req, res, next) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // First check if plan exists
      const existingPlan = await storage.getSubscriptionPlanById(planId);
      if (!existingPlan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Delete plan from database
      await storage.deleteSubscriptionPlan(planId);
      
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/user/vip", ensureAdmin, async (req, res, next) => {
    try {
      const { userId, isVip, expiresAt } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.updateUserVipStatus(
        userId, 
        isVip, 
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // User preferences routes
  app.post("/api/user/quality", ensureAuthenticated, async (req, res, next) => {
    try {
      const { quality } = req.body;
      if (!quality) {
        return res.status(400).json({ message: "Quality preference is required" });
      }
      
      const user = await storage.updateUserPreferredQuality(req.user.id, quality);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}