import { z } from 'zod';

// Users schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.coerce.date(), // Convert to Date object
  password_hash: z.string()
});

export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password_hash: z.string().min(1) // Assuming password hash is non-empty
});

export const updateUserInputSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  password_hash: z.string().min(1).optional()
});

export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// User dashboards schema
export const userDashboardSchema = z.object({
  user_id: z.string(),
  carbon_footprint: z.number(),
  historical_data: z.string().nullable(),
  daily_tips: z.string().nullable(),
  challenges: z.string().nullable()
});

export const createUserDashboardInputSchema = z.object({
  user_id: z.string(),
  carbon_footprint: z.number(),
  historical_data: z.string().nullable(),
  daily_tips: z.string().nullable(),
  challenges: z.string().nullable()
});

export const updateUserDashboardInputSchema = z.object({
  user_id: z.string(),
  carbon_footprint: z.number().optional(),
  historical_data: z.string().nullable().optional(),
  daily_tips: z.string().nullable().optional(),
  challenges: z.string().nullable().optional()
});

// Impact calculators schema
export const impactCalculatorSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  travel_habits: z.string().nullable(),
  energy_consumption: z.string().nullable(),
  waste_management: z.string().nullable()
});

export const createImpactCalculatorInputSchema = z.object({
  user_id: z.string(),
  travel_habits: z.string().nullable(),
  energy_consumption: z.string().nullable(),
  waste_management: z.string().nullable()
});

export const updateImpactCalculatorInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  travel_habits: z.string().nullable().optional(),
  energy_consumption: z.string().nullable().optional(),
  waste_management: z.string().nullable().optional()
});

// Eco community forum schema
export const ecoCommunityForumSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  thread_title: z.string(),
  content: z.string(),
  created_at: z.coerce.date()
});

export const createEcoCommunityForumInputSchema = z.object({
  user_id: z.string(),
  thread_title: z.string().min(1),
  content: z.string().min(1),
  created_at: z.coerce.date() // Assuming created_at is provided as input
});

export const updateEcoCommunityForumInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  thread_title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  created_at: z.coerce.date().optional()
});

// Events schema
export const eventSchema = z.object({
  id: z.string(),
  event_name: z.string(),
  event_date: z.coerce.date(),
  location: z.string().nullable(),
  organizer_id: z.string()
});

export const createEventInputSchema = z.object({
  event_name: z.string(),
  event_date: z.coerce.date(),
  location: z.string().nullable(),
  organizer_id: z.string()
});

export const updateEventInputSchema = z.object({
  id: z.string(),
  event_name: z.string().optional(),
  event_date: z.coerce.date().optional(),
  location: z.string().nullable().optional(),
  organizer_id: z.string().optional()
});

// Resource library schema
export const resourceLibrarySchema = z.object({
  id: z.string(),
  content_type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content_url: z.string().nullable(),
  author_id: z.string()
});

export const createResourceLibraryInputSchema = z.object({
  content_type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content_url: z.string().nullable(),
  author_id: z.string()
});

export const updateResourceLibraryInputSchema = z.object({
  id: z.string(),
  content_type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  content_url: z.string().nullable().optional(),
  author_id: z.string().optional()
});

// Alerts schema
export const alertSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  alert_type: z.string(),
  message: z.string(),
  created_at: z.coerce.date()
});

export const createAlertInputSchema = z.object({
  user_id: z.string(),
  alert_type: z.string(),
  message: z.string(),
  created_at: z.coerce.date() // Assuming created_at is provided as input
});

export const updateAlertInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  alert_type: z.string().optional(),
  message: z.string().optional(),
  created_at: z.coerce.date().optional()
});

// Authentication schema
export const authenticationSchema = z.object({
  auth_token: z.string(),
  user_id: z.string(),
  is_authenticated: z.boolean(),
  is_loading: z.boolean(),
  error_message: z.string().nullable()
});

export const createAuthenticationInputSchema = z.object({
  user_id: z.string(),
  is_authenticated: z.boolean(),
  is_loading: z.boolean(),
  error_message: z.string().nullable()
});

export const updateAuthenticationInputSchema = z.object({
  auth_token: z.string(),
  user_id: z.string().optional(),
  is_authenticated: z.boolean().optional(),
  is_loading: z.boolean().optional(),
  error_message: z.string().nullable().optional()
});

// inferred types:
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

export type UserDashboard = z.infer<typeof userDashboardSchema>;
export type CreateUserDashboardInput = z.infer<typeof createUserDashboardInputSchema>;
export type UpdateUserDashboardInput = z.infer<typeof updateUserDashboardInputSchema>;

export type ImpactCalculator = z.infer<typeof impactCalculatorSchema>;
export type CreateImpactCalculatorInput = z.infer<typeof createImpactCalculatorInputSchema>;
export type UpdateImpactCalculatorInput = z.infer<typeof updateImpactCalculatorInputSchema>;

export type EcoCommunityForum = z.infer<typeof ecoCommunityForumSchema>;
export type CreateEcoCommunityForumInput = z.infer<typeof createEcoCommunityForumInputSchema>;
export type UpdateEcoCommunityForumInput = z.infer<typeof updateEcoCommunityForumInputSchema>;

export type Event = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventInputSchema>;
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

export type ResourceLibrary = z.infer<typeof resourceLibrarySchema>;
export type CreateResourceLibraryInput = z.infer<typeof createResourceLibraryInputSchema>;
export type UpdateResourceLibraryInput = z.infer<typeof updateResourceLibraryInputSchema>;

export type Alert = z.infer<typeof alertSchema>;
export type CreateAlertInput = z.infer<typeof createAlertInputSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertInputSchema>;

export type Authentication = z.infer<typeof authenticationSchema>;
export type CreateAuthenticationInput = z.infer<typeof createAuthenticationInputSchema>;
export type UpdateAuthenticationInput = z.infer<typeof updateAuthenticationInputSchema>;