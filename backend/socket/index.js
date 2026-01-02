import { getVenueId, getQueue, getCurrentSong } from '../utils/queue.js';

/**
 * Setup Socket.io event handlers
 */
export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join venue room
    socket.on('join:venue', async (data) => {
      const venueSlug = data.venue_slug || process.env.VENUE_SLUG || 'rand';
      
      try {
        const venueId = await getVenueId(venueSlug);
        const room = `venue:${venueSlug}`;
        socket.join(room);
        
        // Store venue context on socket
        socket.data.venueId = venueId;
        socket.data.venueSlug = venueSlug;
        
        console.log(`📍 Client ${socket.id} joined ${room}`);

        // Send current queue state
        const [queue, currentSong] = await Promise.all([
          getQueue(venueId),
          getCurrentSong(venueId),
        ]);

        socket.emit('queue:updated', {
          queue,
          current_song: currentSong,
        });
      } catch (error) {
        console.error('Error joining venue room:', error);
        socket.emit('error', { message: `Venue not found: ${venueSlug}` });
      }
    });

    // Join admin room
    socket.on('join:admin', async (data) => {
      const venueSlug = data.venue_slug || process.env.VENUE_SLUG || 'rand';
      
      try {
        const venueId = await getVenueId(venueSlug);
        const room = `admin:${venueSlug}`;
        socket.join(room);
        
        // Store venue context on socket
        socket.data.venueId = venueId;
        socket.data.venueSlug = venueSlug;
        
        console.log(`🔐 Admin client ${socket.id} joined ${room}`);
      } catch (error) {
        console.error('Error joining admin room:', error);
        socket.emit('error', { message: `Venue not found: ${venueSlug}` });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Store io instance for use in routes
  return io;
}

