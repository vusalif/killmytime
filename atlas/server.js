const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game state
const rooms = new Map();
const players = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const { query } = url.parse(req.url, true);
  const playerId = query.playerId;
  const roomId = query.roomId;
  
  console.log(`Player ${playerId} connected to room ${roomId}`);
  
  // Store player connection
  players.set(playerId, {
    ws,
    roomId,
    playerId,
    name: query.name || 'Anonymous'
  });
  
  // Add player to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: new Map(),
      gameState: null,
      status: 'waiting'
    });
  }
  
  const room = rooms.get(roomId);
  room.players.set(playerId, {
    id: playerId,
    name: query.name || 'Anonymous',
    status: 'online',
    isHost: room.players.size === 0,
    ws
  });
  
  // Notify other players in room
  broadcastToRoom(roomId, {
    type: 'player_joined',
    player: {
      id: playerId,
      name: query.name || 'Anonymous',
      status: 'online',
      isHost: room.players.size === 1
    }
  }, playerId);
  
  // Send room info to new player
  ws.send(JSON.stringify({
    type: 'room_info',
    room: {
      id: roomId,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        isHost: p.isHost
      })),
      status: room.status
    }
  }));
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(roomId, playerId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected from room ${roomId}`);
    
    // Remove player from room
    if (room && room.players.has(playerId)) {
      room.players.delete(playerId);
      
      // If room is empty, delete it
      if (room.players.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        // Assign new host if needed
        if (room.players.size > 0) {
          const firstPlayer = room.players.values().next().value;
          firstPlayer.isHost = true;
          
          // Notify remaining players
          broadcastToRoom(roomId, {
            type: 'new_host',
            playerId: firstPlayer.id
          });
        }
        
        // Notify other players
        broadcastToRoom(roomId, {
          type: 'player_left',
          playerId: playerId
        });
      }
    }
    
    // Remove player from players map
    players.delete(playerId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for player ${playerId}:`, error);
  });
});

// Handle different message types
function handleMessage(roomId, playerId, data) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const player = room.players.get(playerId);
  if (!player) return;
  
  switch (data.type) {
    case 'ready':
      player.status = 'ready';
      broadcastToRoom(roomId, {
        type: 'player_ready',
        playerId: playerId
      });
      break;
      
    case 'start_game':
      if (player.isHost && room.players.size >= 2) {
        room.status = 'playing';
        room.gameState = {
          currentPlayer: 'player1',
          scores: { player1: 0, player2: 0 },
          timeLeft: 60,
          completedCountries: new Set()
        };
        
        broadcastToRoom(roomId, {
          type: 'game_started',
          gameState: room.gameState
        });
      }
      break;
      
    case 'correct_guess':
      if (room.status === 'playing') {
        const playerKey = data.player;
        room.gameState.scores[playerKey]++;
        room.gameState.completedCountries.add(data.country);
        
        broadcastToRoom(roomId, {
          type: 'correct_guess',
          player: playerKey,
          country: data.country,
          score: room.gameState.scores[playerKey]
        });
      }
      break;
      
    case 'wrong_guess':
      if (room.status === 'playing') {
        broadcastToRoom(roomId, {
          type: 'wrong_guess',
          player: data.player,
          country: data.country
        });
      }
      break;
      
    case 'switch_player':
      if (room.status === 'playing') {
        room.gameState.currentPlayer = room.gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
        broadcastToRoom(roomId, {
          type: 'player_switched',
          currentPlayer: room.gameState.currentPlayer
        });
      }
      break;
      
    case 'chat_message':
      broadcastToRoom(roomId, {
        type: 'chat_message',
        playerId: playerId,
        playerName: player.name,
        message: data.message
      });
      break;
      
    case 'game_ended':
      if (room.status === 'playing') {
        room.status = 'finished';
        broadcastToRoom(roomId, {
          type: 'game_ended',
          winner: data.winner,
          scores: data.scores
        });
      }
      break;
      
    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

// Broadcast message to all players in a room
function broadcastToRoom(roomId, message, excludePlayerId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.players.forEach((player, playerId) => {
    if (playerId !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
      try {
        player.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to player ${playerId}:`, error);
      }
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Atlas Geography Games Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for multiplayer connections`);
  console.log(`🌍 Players can now create/join rooms and play together!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close();
  });
  
  // Close server
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      rooms: rooms.size,
      players: players.size,
      uptime: process.uptime()
    }));
  }
});
