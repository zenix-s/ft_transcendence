interface PlayerState {
    position: number;
    score: number;
}

export class pongPlayer {
    private playerId: string;
    private state: PlayerState;

    constructor(playerId: string) {
        this.playerId = playerId;
        this.state = {
            position: 0,
            score: 0,
        };
    }

    public moveUp() {
        this.state.position -= 1;
    }

    public moveDown() {
        this.state.position += 1;
    }

    public getState(): PlayerState {
        return this.state;
    }
}
