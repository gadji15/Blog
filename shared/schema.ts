import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isAdmin: boolean("is_admin").default(false),
  isVip: boolean("is_vip").default(false),
  vipExpiresAt: timestamp("vip_expires_at"),
  preferredQuality: text("preferred_quality").default("auto"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  price: integer("price").notNull(), // Price in cents
  duration: integer("duration").notNull(), // Duration in days
  features: text("features").array().notNull(),
  quality: text("quality").notNull(), // e.g., "HD", "4K", "8K"
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment transactions table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("XOF"),
  paymentMethod: text("payment_method").notNull(), // "wave", "orange_money", "credit_card"
  paymentDetails: jsonb("payment_details"), // Store payment provider specific details
  status: text("status").notNull(), // "pending", "completed", "failed", "refunded"
  transactionId: text("transaction_id"), // External transaction ID
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  progress: many(progress),
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// Content table
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "movie" or "series"
  releaseYear: integer("release_year").notNull(),
  genres: text("genres").array().notNull(),
  posterUrl: text("poster_url").notNull(),
  backdropUrl: text("backdrop_url").notNull(),
  rating: integer("rating"),
  duration: integer("duration"), // in minutes, for movies
  trailerUrl: text("trailer_url"),
  isExclusive: boolean("is_exclusive").default(false),
  isNew: boolean("is_new").default(false),
  seasons: integer("seasons"), // only for series
  videoUrl: text("video_url"),
  cast: jsonb("cast").$type<Array<{name: string, role: string, photo?: string}>>(),
  director: text("director"),
  studio: text("studio"),
  maturityRating: text("maturity_rating"), // e.g., "PG-13", "R", "TV-MA"
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentRelations = relations(content, ({ many }) => ({
  favorites: many(favorites),
  progress: many(progress),
}));

// User Progress table
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull(), // Percentage completed (0-100)
  timestamp: timestamp("timestamp").defaultNow(),
  currentEpisode: integer("current_episode"),
  currentSeason: integer("current_season"),
  timeRemaining: integer("time_remaining"), // in seconds
});

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [progress.contentId],
    references: [content.id],
  }),
}));

// User Favorites table
export const favorites = pgTable("favorites", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.contentId] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [favorites.contentId],
    references: [content.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  createdAt: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  timestamp: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  addedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  timestamp: true,
});

export const genres = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", 
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", 
  "Thriller", "Western"
];

// Maturity rating options
export const maturityRatings = [
  "G", "PG", "PG-13", "R", "NC-17", // Movie ratings
  "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA" // TV ratings
];

// Zod schemas for API validation
export const castMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  photo: z.string().optional(),
});

export const contentSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["movie", "series"]),
  releaseYear: z.number(),
  genres: z.array(z.string()),
  posterUrl: z.string(),
  backdropUrl: z.string(),
  rating: z.number().min(0).max(100).optional().nullable(),
  duration: z.number().optional().nullable(), // in minutes
  trailerUrl: z.string().optional().nullable(),
  isExclusive: z.boolean().default(false),
  isNew: z.boolean().default(false),
  seasons: z.number().optional().nullable(), // only for series
  videoUrl: z.string().optional().nullable(),
  cast: z.array(castMemberSchema).optional().nullable(),
  director: z.string().optional().nullable(),
  studio: z.string().optional().nullable(),
  maturityRating: z.string().optional().nullable(),
  createdAt: z.date().optional().nullable(),
});

export const progressSchema = z.object({
  id: z.number().optional(),
  userId: z.number(),
  contentId: z.number(),
  progress: z.number(), // Percentage completed (0-100)
  timestamp: z.date().optional(),
  currentEpisode: z.number().optional(),
  currentSeason: z.number().optional(),
  timeRemaining: z.number().optional(), // in seconds
});

export const favoriteSchema = z.object({
  userId: z.number(),
  contentId: z.number(),
  addedAt: z.date().optional(),
});

// Payment methods
export const paymentMethods = ["wave", "orange_money", "credit_card"] as const;

// Zod schemas for subscription and payment
export const subscriptionPlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  duration: z.number(),
  features: z.array(z.string()),
  quality: z.string(),
  description: z.string(),
  createdAt: z.date().optional(),
});

export const subscriptionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  planId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  autoRenew: z.boolean(),
  createdAt: z.date().optional(),
});

export const paymentDetailsSchema = z.object({
  provider: z.string().optional(),
  transactionReference: z.string().optional(),
  accountNumber: z.string().optional(),
  cardLast4: z.string().optional(),
  receiptUrl: z.string().optional(),
}).passthrough();

export const paymentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  subscriptionId: z.number().optional(),
  amount: z.number(),
  currency: z.string(),
  paymentMethod: z.enum(paymentMethods),
  paymentDetails: paymentDetailsSchema.optional(),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  transactionId: z.string().optional(),
  timestamp: z.date(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
