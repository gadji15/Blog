import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  createdAt: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const genres = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", 
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", 
  "Thriller", "Western"
];

export const contentSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["movie", "series"]),
  releaseYear: z.number(),
  genres: z.array(z.string()),
  posterUrl: z.string(),
  backdropUrl: z.string(),
  rating: z.number().min(0).max(100).optional(),
  duration: z.number().optional(), // in minutes
  trailerUrl: z.string().optional(),
  isExclusive: z.boolean().default(false),
  isNew: z.boolean().default(false),
  seasons: z.number().optional(), // only for series
  videoUrl: z.string().optional(),
});

export const progressSchema = z.object({
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type Content = z.infer<typeof contentSchema>;
export type Progress = z.infer<typeof progressSchema>;
export type Favorite = z.infer<typeof favoriteSchema>;
