import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// Import Zod schemas
import {
  userSchema,
  createUserInputSchema,
  updateUserInputSchema,
  searchUserInputSchema,
  userDashboardSchema,
  createUserDashboardInputSchema,
  updateUserDashboardInputSchema,
  impactCalculatorSchema,
  createImpactCalculatorInputSchema,
  updateImpactCalculatorInputSchema,
  ecoCommunityForumSchema,
  createEcoCommunityForumInputSchema,
  updateEcoCommunityForumInputSchema,
  eventSchema,
  createEventInputSchema,
  updateEventInputSchema,
  resourceLibrarySchema,
  createResourceLibraryInputSchema,
  updateResourceLibraryInputSchema,
  alertSchema,
  createAlertInputSchema,
  updateAlertInputSchema
} from './schema.ts';

// Load environment variables
dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Express app setup
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'eco5-secret-key';

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error && process.env.NODE_ENV === 'development') {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

/*
 * Authentication middleware for protecting routes
 * Verifies JWT token and attaches user info to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [decoded.user_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('User not found', null, 'AUTH_USER_NOT_FOUND'));
      }

      req.user = result.rows[0];
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
 * User Registration Endpoint
 * Creates a new user account and returns user data with JWT token
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    // Validate request body
    const validatedData = createUserInputSchema.parse(req.body);
    const { email, name, password_hash } = validatedData;

    // Check if user already exists
    const client = await pool.connect();
    
    try {
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
      }

      // Create new user
      const userId = randomUUID();
      const createdAt = new Date().toISOString();
      
      const result = await client.query(
        'INSERT INTO users (id, email, name, created_at, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, email.toLowerCase().trim(), name.trim(), createdAt, password_hash]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { user_id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Create initial dashboard for user
      await client.query(
        'INSERT INTO user_dashboards (user_id, carbon_footprint, historical_data, daily_tips, challenges) VALUES ($1, $2, $3, $4, $5)',
        [userId, 0.0, null, null, null]
      );

      // Return user data with token
      res.status(201).json({
        ...user,
        created_at: user.created_at,
        token
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * User Login Endpoint
 * Authenticates user credentials and returns JWT token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    if (!email || !password_hash) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_CREDENTIALS'));
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1 AND password_hash = $2',
        [email.toLowerCase().trim(), password_hash]
      );

      if (result.rows.length === 0) {
        return res.status(401).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
      }

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { user_id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        auth_token: token,
        user_id: user.id
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get User Details
 * Retrieves user information by user ID
 */
app.get('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [user_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
      }

      const user = result.rows[0];
      res.json({
        ...user,
        created_at: user.created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update User Details
 * Updates user information
 */
app.put('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const validatedData = updateUserInputSchema.parse(req.body);

    // Check if user can update this profile (basic authorization)
    if (req.user.id !== user_id) {
      return res.status(403).json(createErrorResponse('Forbidden: Cannot update another user\'s profile', null, 'FORBIDDEN'));
    }

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.email) {
        updateFields.push(`email = $${paramCount++}`);
        updateValues.push(validatedData.email.toLowerCase().trim());
      }
      if (validatedData.name) {
        updateFields.push(`name = $${paramCount++}`);
        updateValues.push(validatedData.name.trim());
      }
      if (validatedData.password_hash) {
        updateFields.push(`password_hash = $${paramCount++}`);
        updateValues.push(validatedData.password_hash);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(user_id);
      
      const result = await client.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, created_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
      }

      const user = result.rows[0];
      res.json({
        ...user,
        created_at: user.created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update user error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Search Users
 * Searches for users based on query parameters
 */
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const validatedQuery = searchUserInputSchema.parse(req.query);
    const { query, limit, offset, sort_by, sort_order } = validatedQuery;

    const client = await pool.connect();
    
    try {
      let sql = 'SELECT id, email, name, created_at FROM users';
      const queryParams = [];
      let paramCount = 1;

      if (query) {
        sql += ` WHERE (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${query}%`);
        paramCount++;
      }

      sql += ` ORDER BY ${sort_by} ${sort_order}`;
      sql += ` LIMIT $${paramCount++} OFFSET $${paramCount}`;
      queryParams.push(limit, offset);

      const result = await client.query(sql, queryParams);
      
      const users = result.rows.map(user => ({
        ...user,
        created_at: user.created_at
      }));

      res.json(users);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid query parameters', error, 'VALIDATION_ERROR'));
    }
    console.error('Search users error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get User Dashboard
 * Retrieves dashboard data for a specific user
 */
app.get('/api/dashboard/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM user_dashboards WHERE user_id = $1',
        [user_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Dashboard not found', null, 'DASHBOARD_NOT_FOUND'));
      }

      const dashboard = result.rows[0];
      res.json({
        user_id: dashboard.user_id,
        carbon_footprint: parseFloat(dashboard.carbon_footprint),
        historical_data: dashboard.historical_data,
        daily_tips: dashboard.daily_tips,
        challenges: dashboard.challenges
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update User Dashboard
 * Updates dashboard configuration and metrics
 */
app.patch('/api/dashboard/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const validatedData = updateUserDashboardInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.carbon_footprint !== undefined) {
        updateFields.push(`carbon_footprint = $${paramCount++}`);
        updateValues.push(validatedData.carbon_footprint);
      }
      if (validatedData.historical_data !== undefined) {
        updateFields.push(`historical_data = $${paramCount++}`);
        updateValues.push(validatedData.historical_data);
      }
      if (validatedData.daily_tips !== undefined) {
        updateFields.push(`daily_tips = $${paramCount++}`);
        updateValues.push(validatedData.daily_tips);
      }
      if (validatedData.challenges !== undefined) {
        updateFields.push(`challenges = $${paramCount++}`);
        updateValues.push(validatedData.challenges);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(user_id);
      
      const result = await client.query(
        `UPDATE user_dashboards SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Dashboard not found', null, 'DASHBOARD_NOT_FOUND'));
      }

      const dashboard = result.rows[0];
      res.json({
        user_id: dashboard.user_id,
        carbon_footprint: parseFloat(dashboard.carbon_footprint),
        historical_data: dashboard.historical_data,
        daily_tips: dashboard.daily_tips,
        challenges: dashboard.challenges
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update dashboard error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Impact Calculator Data
 * Retrieves impact calculator data for a user
 */
app.get('/api/impact-calculator/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM impact_calculators WHERE user_id = $1',
        [user_id]
      );

      if (result.rows.length === 0) {
        // Create default calculator if none exists
        const calculatorId = randomUUID();
        await client.query(
          'INSERT INTO impact_calculators (id, user_id, travel_habits, energy_consumption, waste_management) VALUES ($1, $2, $3, $4, $5)',
          [calculatorId, user_id, null, null, null]
        );
        
        return res.json({
          id: calculatorId,
          user_id: user_id,
          travel_habits: null,
          energy_consumption: null,
          waste_management: null
        });
      }

      const calculator = result.rows[0];
      res.json(calculator);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get impact calculator error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Impact Calculator Data
 * Updates user's impact calculation parameters
 */
app.patch('/api/impact-calculator/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const validatedData = updateImpactCalculatorInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.travel_habits !== undefined) {
        updateFields.push(`travel_habits = $${paramCount++}`);
        updateValues.push(validatedData.travel_habits);
      }
      if (validatedData.energy_consumption !== undefined) {
        updateFields.push(`energy_consumption = $${paramCount++}`);
        updateValues.push(validatedData.energy_consumption);
      }
      if (validatedData.waste_management !== undefined) {
        updateFields.push(`waste_management = $${paramCount++}`);
        updateValues.push(validatedData.waste_management);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(user_id);
      
      const result = await client.query(
        `UPDATE impact_calculators SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Impact calculator not found', null, 'CALCULATOR_NOT_FOUND'));
      }

      const calculator = result.rows[0];
      res.json(calculator);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update impact calculator error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get Community Forum Threads
 * Retrieves all forum threads for community discussions
 */
app.get('/api/community-forum', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM eco_community_forum ORDER BY created_at DESC'
      );

      const threads = result.rows.map(thread => ({
        ...thread,
        created_at: thread.created_at
      }));

      res.json(threads);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get forum threads error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create Community Forum Thread
 * Creates a new discussion thread in the community forum
 */
app.post('/api/community-forum', authenticateToken, async (req, res) => {
  try {
    const validatedData = createEcoCommunityForumInputSchema.parse(req.body);
    const { user_id, thread_title, content, created_at } = validatedData;

    const client = await pool.connect();
    
    try {
      const threadId = randomUUID();
      const timestamp = created_at ? created_at.toISOString() : new Date().toISOString();
      
      const result = await client.query(
        'INSERT INTO eco_community_forum (id, user_id, thread_title, content, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [threadId, user_id, thread_title, content, timestamp]
      );

      const thread = result.rows[0];
      res.status(201).json({
        ...thread,
        created_at: thread.created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Create forum thread error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Community Forum Thread
 * Updates an existing forum thread
 */
app.patch('/api/community-forum/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateEcoCommunityForumInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.thread_title) {
        updateFields.push(`thread_title = $${paramCount++}`);
        updateValues.push(validatedData.thread_title);
      }
      if (validatedData.content) {
        updateFields.push(`content = $${paramCount++}`);
        updateValues.push(validatedData.content);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(id);
      
      const result = await client.query(
        `UPDATE eco_community_forum SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Forum thread not found', null, 'THREAD_NOT_FOUND'));
      }

      const thread = result.rows[0];
      res.json({
        ...thread,
        created_at: thread.created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update forum thread error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * List All Events
 * Retrieves all community events
 */
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM events ORDER BY event_date ASC'
      );

      const events = result.rows.map(event => ({
        ...event,
        event_date: event.event_date
      }));

      res.json(events);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create New Event
 * Creates a new community event
 */
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const validatedData = createEventInputSchema.parse(req.body);
    const { event_name, event_date, location, organizer_id } = validatedData;

    const client = await pool.connect();
    
    try {
      const eventId = randomUUID();
      const eventDateString = event_date.toISOString();
      
      const result = await client.query(
        'INSERT INTO events (id, event_name, event_date, location, organizer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [eventId, event_name, eventDateString, location, organizer_id]
      );

      const event = result.rows[0];
      res.status(201).json({
        ...event,
        event_date: event.event_date
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Create event error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Event
 * Updates an existing community event
 */
app.patch('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateEventInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.event_name) {
        updateFields.push(`event_name = $${paramCount++}`);
        updateValues.push(validatedData.event_name);
      }
      if (validatedData.event_date) {
        updateFields.push(`event_date = $${paramCount++}`);
        updateValues.push(validatedData.event_date.toISOString());
      }
      if (validatedData.location !== undefined) {
        updateFields.push(`location = $${paramCount++}`);
        updateValues.push(validatedData.location);
      }
      if (validatedData.organizer_id) {
        updateFields.push(`organizer_id = $${paramCount++}`);
        updateValues.push(validatedData.organizer_id);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(id);
      
      const result = await client.query(
        `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Event not found', null, 'EVENT_NOT_FOUND'));
      }

      const event = result.rows[0];
      res.json({
        ...event,
        event_date: event.event_date
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update event error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * List All Resources
 * Retrieves all educational resources from the library
 */
app.get('/api/resource-library', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM resource_library ORDER BY title ASC'
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create New Resource
 * Adds a new educational resource to the library
 */
app.post('/api/resource-library', authenticateToken, async (req, res) => {
  try {
    const validatedData = createResourceLibraryInputSchema.parse(req.body);
    const { content_type, title, description, content_url, author_id } = validatedData;

    const client = await pool.connect();
    
    try {
      const resourceId = randomUUID();
      
      const result = await client.query(
        'INSERT INTO resource_library (id, content_type, title, description, content_url, author_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [resourceId, content_type, title, description, content_url, author_id]
      );

      const resource = result.rows[0];
      res.status(201).json(resource);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Create resource error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Resource
 * Updates an existing educational resource
 */
app.patch('/api/resource-library/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateResourceLibraryInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.content_type) {
        updateFields.push(`content_type = $${paramCount++}`);
        updateValues.push(validatedData.content_type);
      }
      if (validatedData.title) {
        updateFields.push(`title = $${paramCount++}`);
        updateValues.push(validatedData.title);
      }
      if (validatedData.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(validatedData.description);
      }
      if (validatedData.content_url !== undefined) {
        updateFields.push(`content_url = $${paramCount++}`);
        updateValues.push(validatedData.content_url);
      }
      if (validatedData.author_id) {
        updateFields.push(`author_id = $${paramCount++}`);
        updateValues.push(validatedData.author_id);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(id);
      
      const result = await client.query(
        `UPDATE resource_library SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Resource not found', null, 'RESOURCE_NOT_FOUND'));
      }

      const resource = result.rows[0];
      res.json(resource);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update resource error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Get User Alerts
 * Retrieves all alerts for a specific user
 */
app.get('/api/alerts/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC',
        [user_id]
      );

      const alerts = result.rows.map(alert => ({
        ...alert,
        created_at: alert.created_at
      }));

      res.json(alerts);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Create User Alert
 * Creates a new alert/notification for a user
 */
app.post('/api/alerts/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const validatedData = createAlertInputSchema.parse(req.body);
    const { alert_type, message, created_at } = validatedData;

    const client = await pool.connect();
    
    try {
      const alertId = randomUUID();
      const timestamp = created_at ? created_at.toISOString() : new Date().toISOString();
      
      const result = await client.query(
        'INSERT INTO alerts (id, user_id, alert_type, message, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [alertId, user_id, alert_type, message, timestamp]
      );

      const alert = result.rows[0];
      res.status(201).json({
        ...alert,
        created_at: alert.created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Create alert error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
 * Update Alert
 * Updates an existing alert/notification
 */
app.patch('/api/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateAlertInputSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (validatedData.alert_type) {
        updateFields.push(`alert_type = $${paramCount++}`);
        updateValues.push(validatedData.alert_type);
      }
      if (validatedData.message) {
        updateFields.push(`message = $${paramCount++}`);
        updateValues.push(validatedData.message);
      }

      if (updateFields.length === 0) {
        return res.status(400).json(createErrorResponse('No valid fields to update', null, 'NO_UPDATE_FIELDS'));
      }

      updateValues.push(id);
      
      const result = await client.query(
        `UPDATE alerts SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json(createErrorResponse('Alert not found', null, 'ALERT_NOT_FOUND'));
      }

      const alert = result.rows[0];
      res.json({
        ...alert,
        created_at: alert.created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json(createErrorResponse('Invalid input data', error, 'VALIDATION_ERROR'));
    }
    console.error('Update alert error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route for SPA routing (excluding API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for external use
export { app, pool };

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Eco5 server running on port ${port} and listening on 0.0.0.0`);
  console.log(`Health check available at: http://localhost:${port}/api/health`);
});