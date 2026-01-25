/**
 * Socket.io Handler for Video Consultations
 *
 * Handles WebRTC signaling for peer-to-peer video connections.
 * This is the "phone exchange" that helps two browsers find each other.
 */

import { joinVideoRoom, leaveVideoRoom, endVideoRoom, canAccessRoom } from './video.service.js';

/**
 * Initialize socket handlers for video consultations
 *
 * @param {Object} io - Socket.io server instance
 */
export const initializeVideoSocket = (io) => {
  // Video consultation namespace
  const videoNamespace = io.of('/video');

  videoNamespace.on('connection', (socket) => {
    console.log(`[Video Socket] Client connected: ${socket.id}`);

    // Store user info on socket
    socket.userData = null;
    socket.currentRoom = null;

    /**
     * Authenticate and join a video room
     *
     * Client sends: { roomId, userId, userType, userName }
     */
    socket.on('join-room', async (data) => {
      try {
        const { roomId, userId, userType, userName } = data;

        // Validate access
        const hasAccess = await canAccessRoom(roomId, userId, userType);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this video room' });
          return;
        }

        // Import repository to check room status before joining
        const { videoRoomRepository } = await import('../../repositories/index.js');
        const room = await videoRoomRepository.findByRoomId(roomId);

        if (!room) {
          socket.emit('error', { message: 'Video room not found' });
          return;
        }

        if (room.status === 'ended') {
          socket.emit('error', { message: 'This video consultation has already ended' });
          return;
        }

        // Store user data
        socket.userData = { userId, userType, userName };
        socket.currentRoom = roomId;

        // Join the socket room
        socket.join(roomId);

        // Add participant to database
        await joinVideoRoom(roomId, {
          userId,
          userType,
          socketId: socket.id
        });

        // Notify others in the room that a new user joined
        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          userId,
          userType,
          userName
        });

        // Get list of other participants in the room
        const roomSockets = await videoNamespace.in(roomId).fetchSockets();
        const otherParticipants = roomSockets
          .filter(s => s.id !== socket.id && s.userData)
          .map(s => ({
            socketId: s.id,
            userId: s.userData.userId,
            userType: s.userData.userType,
            userName: s.userData.userName
          }));

        // Send room info back to the joining user
        socket.emit('room-joined', {
          roomId,
          participants: otherParticipants
        });

        console.log(`[Video Socket] User ${userName} (${userType}) joined room ${roomId}`);
      } catch (error) {
        console.error('[Video Socket] Error joining room:', error);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * WebRTC Signaling: Offer
     *
     * When a peer wants to initiate a connection, they send an offer
     * containing their media capabilities.
     */
    socket.on('offer', (data) => {
      const { targetSocketId, offer } = data;
      console.log(`[Video Socket] Relaying offer from ${socket.id} to ${targetSocketId}`);

      socket.to(targetSocketId).emit('offer', {
        offer,
        senderSocketId: socket.id,
        senderUserType: socket.userData?.userType,
        senderUserName: socket.userData?.userName
      });
    });

    /**
     * WebRTC Signaling: Answer
     *
     * The receiving peer responds with an answer containing
     * their media capabilities.
     */
    socket.on('answer', (data) => {
      const { targetSocketId, answer } = data;
      console.log(`[Video Socket] Relaying answer from ${socket.id} to ${targetSocketId}`);

      socket.to(targetSocketId).emit('answer', {
        answer,
        senderSocketId: socket.id
      });
    });

    /**
     * WebRTC Signaling: ICE Candidate
     *
     * ICE candidates are network endpoints that peers can use
     * to establish a direct connection.
     */
    socket.on('ice-candidate', (data) => {
      const { targetSocketId, candidate } = data;

      socket.to(targetSocketId).emit('ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    });

    /**
     * Toggle media state (mute/unmute, camera on/off)
     */
    socket.on('media-state-change', (data) => {
      const { roomId, audioEnabled, videoEnabled } = data;

      socket.to(roomId).emit('peer-media-state-changed', {
        socketId: socket.id,
        userType: socket.userData?.userType,
        audioEnabled,
        videoEnabled
      });
    });

    /**
     * End the call
     */
    socket.on('end-call', async (data) => {
      try {
        const { roomId } = data;
        const userType = socket.userData?.userType;

        if (roomId && userType) {
          await endVideoRoom(roomId, userType);

          // Notify all participants that the call has ended
          socket.to(roomId).emit('call-ended', {
            endedBy: userType,
            userName: socket.userData?.userName
          });

          // Make everyone leave the socket room
          const roomSockets = await videoNamespace.in(roomId).fetchSockets();
          roomSockets.forEach(s => s.leave(roomId));

          console.log(`[Video Socket] Call ended in room ${roomId} by ${userType}`);
        }
      } catch (error) {
        console.error('[Video Socket] Error ending call:', error);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`[Video Socket] Client disconnected: ${socket.id}`);

      if (socket.currentRoom) {
        try {
          // Remove from database
          await leaveVideoRoom(socket.currentRoom, socket.id);

          // Notify others
          socket.to(socket.currentRoom).emit('user-left', {
            socketId: socket.id,
            userType: socket.userData?.userType,
            userName: socket.userData?.userName
          });
        } catch (error) {
          console.error('[Video Socket] Error handling disconnect:', error);
        }
      }
    });
  });

  console.log('[Video Socket] Video consultation socket handler initialized');
  return videoNamespace;
};

export default initializeVideoSocket;
