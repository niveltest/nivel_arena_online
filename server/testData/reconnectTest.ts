
import { io } from 'socket.io-client';
import { assert } from 'console';

const SERVER_URL = 'http://localhost:3001';
const USERNAME = 'TestReconnectUser';

async function runTest() {
    console.log('--- Starting Reconnect Test ---');

    // 1. Connect Client A
    const clientA = io(SERVER_URL, { transports: ['websocket'] });

    let roomId = '';

    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject('Timeout waiting for game start'), 10000);

        clientA.on('connect', () => {
            console.log('Client A connected:', clientA.id);
            // Create Game
            clientA.emit('createGame', USERNAME, 'ST01', null, (id: string) => {
                roomId = id;
                console.log('Game Created. Room ID:', roomId);
                // Join Game
                clientA.emit('joinGame', { username: USERNAME, roomId, starterDeckId: 'ST01' });
            });
        });

        clientA.on('joined', () => {
            console.log('Client A joined room.');
            // Add CPU
            clientA.emit('addCPU', { roomId, starterDeckId: 'ST01' });
        });

        clientA.on('gameState', (state: any) => {
            console.log(`Client A received State. Phase: ${state.phase}, Players: ${Object.keys(state.players).length}`);
            if (Object.keys(state.players).length === 2 && state.phase === 'SELECT_CARD') {
                console.log('Game Started with CPU. Phase:', state.phase);
                clearTimeout(timeout);
                resolve();
            }
        });

        clientA.on('connect_error', (err) => console.error('Client A Connect Error:', err));
    });

    // 2. Disconnect Client A (Simulate Reload)
    console.log('Disconnecting Client A...');
    clientA.disconnect();

    await new Promise(r => setTimeout(r, 2000)); // Wait a bit

    // 3. Connect Client B (Same User)
    console.log('Connecting Client B (Rejoining)...');
    const clientB = io(SERVER_URL, { transports: ['websocket'] });

    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject('Timeout waiting for rejoin'), 10000);

        clientB.on('connect', () => {
            console.log('Client B connected:', clientB.id);
            // Rejoin
            clientB.emit('joinGame', { username: USERNAME, roomId });
        });

        clientB.on('joined', (data) => {
            console.log('Client B re-joined successfully:', data);
        });

        clientB.on('error', (msg) => {
            console.log('Client B received Error:', msg);
        });

        clientB.on('gameState', (state: any) => {
            console.log('Client B received GameState. My ID in/not in list.');
            if (state.players[clientB.id]) {
                console.log('SUCCESS: Client B is in the player list.');
                clearTimeout(timeout);
                resolve();
            } else {
                console.log('Client B ID not found yet. Current players:', Object.keys(state.players));
            }
        });
    });

    console.log('--- Test Passed ---');
    clientB.disconnect();
    process.exit(0);
}

runTest().catch(err => {
    console.error('--- Test Failed ---', err);
    process.exit(1);
});
