import { Socket } from 'socket.io';
import { Player as PlayerState, Card, Deck } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

export class Player {
    public id: string;
    public socket: Socket;
    public username: string;
    public state: PlayerState;
    public deckData?: { deckIdList: string[], leaderId: string };

    // Connection State
    public isCPU: boolean = false;
    public connected: boolean = true;
    public disconnectTimeout: NodeJS.Timeout | null = null;

    constructor(socket: Socket, username: string, deckData?: { deckIdList: string[], leaderId: string }) {
        this.id = socket.id;
        this.socket = socket;
        this.username = username;
        this.deckData = deckData;

        // Initial dummy state
        this.state = {
            id: this.id,
            username: this.username,
            hp: 0,
            maxHp: 10,
            leader: { id: 'l001', name: 'Leader', type: 'LEADER', cost: 0, text: 'Default Leader' },
            leaderLevel: 1,
            hand: [],
            deck: [],
            discard: [],
            field: [null, null, null],
            damageZone: [],
            skillZone: [],
            resources: 0,
            unitsPlaced: [false, false, false],
            mulliganDone: false
        };
    }

    // Helper methods to modify state
    drawCard(card: Card) {
        this.state.hand.push(card);
    }

    playCard(cardIndex: number) {
        // Logic to move card from hand to field
    }
}
