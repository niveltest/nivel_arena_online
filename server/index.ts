import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Game } from './Game';
import { Player } from './Player';
import { v4 as uuidv4 } from 'uuid';
import { CPUPlayer } from './AIPlayer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            "https://nivel-arena-online.vercel.app",
            "http://localhost:3001",
            "http://localhost:3000"
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith("vercel.app")) { // Allow all Vercel previews too
            callback(null, true);
        } else {
            // For development, allow all (optional, but let's be permissive for now to debug)
            // callback(new Error('Not allowed by CORS'));
            callback(null, true);
        }
    },
    credentials: true
}));

// Serve Card Data
import cardsData from './data/cards.json';
import starterDecks from './data/starterDecks.json';
import axios from 'axios';

app.get('/api/cards', (req, res) => {
    res.json(cardsData);
});
app.get('/api/starter-decks', (req, res) => {
    res.json(starterDecks);
});

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Image Proxy to bypass SSL/Mixed Content issues
app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send('URL is required');

    // Force HTTP for nivelarena.jp to avoid SSL errors (Certificate is invalid)
    const targetUrl = imageUrl.replace(/^https:\/\/nivelarena\.jp/, 'http://nivelarena.jp');

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            timeout: 5000,
            // Only proxy allowed domains for security
            headers: {
                'referer': 'http://nivelarena.jp/'
            }
        });

        const contentType = response.headers['content-type'];
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.send(response.data);
    } catch (error) {
        console.error('Proxy Image Error:', (error as any).message);
        res.status(500).send('Error proxying image');
    }
});


// Deck Persistence API
import fs from 'fs';
import path from 'path';
const DECKS_DIR = path.join(__dirname, 'data/decks');
if (!fs.existsSync(DECKS_DIR)) fs.mkdirSync(DECKS_DIR);

app.use(express.json());

app.post('/api/decks', (req, res) => {
    const { username, deck } = req.body;
    if (!username || !deck) return res.status(400).json({ error: 'Missing username or deck' });

    // Validate Deck
    const leader = (cardsData as any[]).find((c: any) => c.id === deck.leaderId);
    if (!leader) return res.status(400).json({ error: 'Invalid Leader ID' });

    if (deck.deckIdList.length !== 40) return res.status(400).json({ error: 'Deck must have 40 cards' });

    const cardCounts = new Map<string, number>();
    let triggerCount = 0;

    for (const cardId of deck.deckIdList) {
        const card = (cardsData as any[]).find((c: any) => c.id === cardId);
        if (!card) return res.status(400).json({ error: `Invalid Card ID: ${cardId}` });

        // Count
        cardCounts.set(cardId, (cardCounts.get(cardId) || 0) + 1);

        // Attribute Check
        // Logic: compatible if card.attribute shares at least one attr with leader.attribute
        // Attributes are like "炎", "炎/闇", etc.
        if (card.attribute && leader.attribute) {
            const leaderAttrs = (leader.attribute || "").split('/');
            const cardAttrs = (card.attribute || "").split('/');
            const isCompatible = cardAttrs.some((ca: string) => leaderAttrs.includes(ca));
            if (!isCompatible) return res.status(400).json({ error: `Incompatible attribute for card ${card.name}` });
        }

        // Trigger Check
        if (card.effects?.some((e: any) => e.trigger === 'ON_DAMAGE_TRIGGER')) {
            triggerCount++;
        }
    }

    for (const count of cardCounts.values()) {
        if (count > 3) return res.status(400).json({ error: 'Max 3 copies per card' });
    }

    if (triggerCount > 8) return res.status(400).json({ error: 'Max 8 trigger cards' });

    const filePath = path.join(DECKS_DIR, `${username}.json`);
    let userDecks = [];
    if (fs.existsSync(filePath)) {
        userDecks = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Add or update deck (if id exists)
    const existingIndex = userDecks.findIndex((d: any) => d.name === deck.name);
    if (existingIndex !== -1) {
        userDecks[existingIndex] = deck;
    } else {
        userDecks.push(deck);
    }

    fs.writeFileSync(filePath, JSON.stringify(userDecks, null, 2));
    res.json({ success: true });
});

app.get('/api/decks/:username', (req, res) => {
    const filePath = path.join(DECKS_DIR, `${req.params.username}.json`);
    if (fs.existsSync(filePath)) {
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    } else {
        res.json([]);
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://nivel-arena-online.vercel.app", "http://localhost:3001", "http://localhost:3000"], // Explicitly allow Vercel
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Map of Room ID -> Game Instance
const games = new Map<string, Game>();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    let currentRoomId: string | null = null;

    socket.on('createGame', (username: string, deckId: string, password?: string, callback?: (roomId: string) => void) => {
        // If password is function (no password provided by client lib fallback), handle gracefully
        if (typeof password === 'function') {
            callback = password;
            password = undefined;
        }

        const roomId = uuidv4().substring(0, 6).toUpperCase(); // Short ID
        const game = new Game(roomId, io, password || null);

        // Store the creator's deck preference in the game instance or handle it via handleJoinGame
        // For now, we'll store it so the first joiner (creator) uses it.
        (game as any).creatorDeckId = deckId;

        games.set(roomId, game);

        console.log(`Game created: ${roomId} by ${username} with deck ${deckId} (Password: ${password ? 'YES' : 'NO'})`);
        if (callback) callback(roomId);

        // Do not auto-join here. The client will connect with a new socket and join.
    });

    socket.on('joinGame', (data: { username: string, roomId?: string, deckData?: { deckIdList: string[], leaderId: string }, starterDeckId?: string, password?: string, isSpectator?: boolean }) => {
        console.log(`[DEBUG] joinGame received from ${socket.id}:`, data);
        const { username, roomId, deckData, starterDeckId, password, isSpectator } = data;
        if (!roomId) {
            console.error(`[DEBUG] Room ID missing for ${socket.id}`);
            socket.emit('error', 'Room ID is required');
            return;
        }
        handleJoinGame(username, roomId, deckData, starterDeckId, password, isSpectator);
    });

    socket.on('addCPU', (data: { roomId: string, starterDeckId?: string }) => {
        const { roomId, starterDeckId } = data;
        const game = games.get(roomId);
        if (!game) return;

        const cpu = new CPUPlayer(game, "CPU (AI)", { deckIdList: [], leaderId: starterDeckId || 'ST01' });

        // Load starter deck if specified
        if (starterDeckId) {
            const starter = (starterDecks as any)[starterDeckId];
            if (starter) {
                const deckIdList: string[] = [];
                for (const [cardId, count] of Object.entries(starter.mainDeck)) {
                    for (let i = 0; i < (count as number); i++) {
                        deckIdList.push(cardId);
                    }
                }
                cpu.state.leader = { id: starter.leaderId, name: 'Leader', type: 'LEADER', cost: 0, text: '' };
                cpu.deckData = { deckIdList, leaderId: starter.leaderId };
            }
        }

        if (game.addPlayer(cpu)) {
            console.log(`CPU joined game ${roomId}.`);
            if (Object.keys(game.players).length === 2) {
                game.start();
            }
        }
    });

    const handleJoinGame = (username: string, roomId: string, deckData?: { deckIdList: string[], leaderId: string }, starterDeckId?: string, password?: string, isSpectator?: boolean) => {
        const game = games.get(roomId);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }

        // --- Password Check ---
        if (game.password && game.password !== password) {
            socket.emit('error', 'Incorrect Password');
            return;
        }
        // ----------------------

        // --- Spectator Logic ---
        if (isSpectator) {
            const player = new Player(socket, username);
            // Spectator setup (no deck needed)
            game.addSpectator(player);
            currentRoomId = roomId;
            socket.join(roomId);
            socket.emit('joined', { playerId: socket.id, roomId, isSpectator: true });
            return;
        }
        // -----------------------

        // --- Reconnect Logic ---
        // Check if this username is already in the game and disconnected/waiting
        // Note: We need to access players to check username. `game.players` is public.
        const existingPlayerId = Object.keys(game.players).find(id => game.players[id].username === username);
        if (existingPlayerId) {
            const result = game.handleReconnect(username, socket.id);
            if (result.success) {
                currentRoomId = roomId;
                socket.join(roomId);
                socket.emit('joined', { playerId: socket.id, roomId });
                // Broadcast state is done in handleReconnect
                game.broadcastState(); // Ensure state is sent
                return;
            } else {
                socket.emit('error', 'Username already taken or game finished');
                return;
            }
        }
        // -----------------------

        let finalDeckData = deckData;

        // If it's the creator and they picked a starter deck, or if the joiner picked a starter deck
        const actualStarterDeckId = starterDeckId || (Object.keys(game.players).length === 0 ? (game as any).creatorDeckId : null);

        if (actualStarterDeckId && actualStarterDeckId !== 'CUSTOM') {
            const starter = (starterDecks as any)[actualStarterDeckId];
            if (starter) {
                const deckIdList: string[] = [];
                for (const [cardId, count] of Object.entries(starter.mainDeck)) {
                    for (let i = 0; i < (count as number); i++) {
                        deckIdList.push(cardId);
                    }
                }
                finalDeckData = {
                    deckIdList,
                    leaderId: starter.leaderId
                };
            }
        }

        const player = new Player(socket, username, finalDeckData);
        if (game.addPlayer(player)) {
            currentRoomId = roomId;
            socket.join(roomId); // Socket.io room support
            console.log(`${username} joined game ${roomId}.`);
            socket.emit('joined', { playerId: socket.id, roomId });

            if (Object.keys(game.players).length === 2) {
                game.start();
            }
        } else {
            socket.emit('error', 'Game full');
        }
    };

    socket.on('nextPhase', () => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game && game.turnPlayerId === socket.id) {
            game.nextPhase();
        }
    });

    socket.on('playCard', (data: { cardIndex: number, targetInfo?: any }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.playCard(socket.id, data.cardIndex, data.targetInfo);
    });

    socket.on('attack', (data: { attackerIndex: number, targetIndex: number }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.attack(socket.id, data.attackerIndex, data.targetIndex);
    });

    socket.on('resolveDefense', (data: { action: 'BLOCK' | 'TAKE' }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.resolveDefense(socket.id, data.action);
    });

    socket.on('resolveGuardianIntercept', (data: { interceptSlot: number | 'NONE' }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.resolveGuardianIntercept(socket.id, data.interceptSlot);
    });

    socket.on('selectCard', (data: { selectedIds: string[] }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.resolveSelection(socket.id, data.selectedIds);
    });

    socket.on('mulligan', (data: { selectedIds: string[] }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.resolveMulligan(socket.id, data.selectedIds);
    });

    socket.on('useActiveAbility', (data: { slotIndex: number }) => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) game.useActiveAbility(socket.id, data.slotIndex);
    });

    socket.on('debugForceLevelUp', () => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) {
            game.handleLevelUpPhase();
            game.broadcastState();
        }
    });

    socket.on('debugForceWin', () => {
        if (!currentRoomId) return;
        const game = games.get(currentRoomId);
        if (game) {
            // Force current player to win -> set opponent HP to 10
            // Force current player to win directly
            game.finishGame(socket.id, "DEBUG_FORCE_WIN");
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (currentRoomId) {
            const game = games.get(currentRoomId);
            if (game) {
                // Use handleDisconnect instead of removePlayer
                game.handleDisconnect(socket.id);
                // We do NOT delete the game immediately unless checking for stale games (optional cleanup logic)
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
