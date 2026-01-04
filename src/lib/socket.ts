import { io, Socket } from 'socket.io-client';
import { getVenueSlug } from './venue';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket can only be created in browser');
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      // Join venue room with dynamic venue slug
      const venueSlug = getVenueSlug();
      socket?.emit('join:venue', { venue_slug: venueSlug });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('error', (data: { message?: string }) => {
      console.error('Socket error:', data.message);
      // If venue not found error, disconnect socket to prevent further attempts
      if (data.message?.includes('Venue not found')) {
        console.error('Venue not found via socket - disconnecting');
        if (socket) {
          socket.disconnect();
        }
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

