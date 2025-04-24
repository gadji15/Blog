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
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  progress: many(progress),
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
