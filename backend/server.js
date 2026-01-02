import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import queueRoutes from './routes/queue.js';
import songsRoutes from './routes/songs.js';
import votesRoutes from './routes/votes.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import feedbackRoutes from './routes/feedback.js';
import sentimentRoutes from './routes/sentiment.js';
import venueRoutes from './routes/venue.js';

// Import middleware
import { venueMiddleware } from './middleware/venue.js';

// Import database and Redis
import { initDatabase } from './db/index.js';
import { initRedis } from './db/redis.js';

// Import Socket.io handlers
import { setupSocketIO } from './socket/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (with venue middleware)
app.use('/api/queue', venueMiddleware, queueRoutes);
app.use('/api/songs', venueMiddleware, songsRoutes);
app.use('/api/votes', venueMiddleware, votesRoutes);
app.use('/api/user', venueMiddleware, userRoutes);
app.use('/api/admin', venueMiddleware, adminRoutes);
app.use('/api/feedback', venueMiddleware, feedbackRoutes);
app.use('/api/admin/sentiment', venueMiddleware, sentimentRoutes);
app.use('/api/venue', venueRoutes); // No venue middleware - uses slug from path

// Setup Socket.io
setupSocketIO(io);

// Store io instance for use in routes
app.set('io', io);

// Initialize database and Redis, then start server
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database connected');
    
    await initRedis();
    console.log('✅ Redis connected');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`🎵 Venue: ${process.env.VENUE_NAME || 'Rand Dining Hall'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

