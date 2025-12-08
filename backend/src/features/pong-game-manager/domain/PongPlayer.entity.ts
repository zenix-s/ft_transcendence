import { User } from '@shared/domain/Entities/User.entity';

export interface PlayerState {
    position: number;
    score: number;
    isReady: boolean;
}

export class PongPlayer {
    private playerId: number;
    private userData: User | null;
    private state: PlayerState;

    constructor(playerId: number, userData?: User) {
        this.playerId = playerId;
        this.userData = userData || null;
        this.state = {
            position: 50,
            score: 0,
            isReady: false,
        };
    }

    public moveUp(): void {
        if (this.state.position > 10) {
            this.state.position -= 1;
        }
    }

    public moveDown(): void {
        if (this.state.position < 90) {
            this.state.position += 1;
        }
    }

    public getState(): PlayerState {
        return this.state;
    }

    public getId(): number {
        return this.playerId;
    }

    public incrementScore(): void {
        this.state.score += 1;
    }

    public setReady(ready: boolean): void {
        this.state.isReady = ready;
    }

    public isReady(): boolean {
        return this.state.isReady;
    }

    public getUsername(): string {
        return this.userData?.username || `Player ${this.playerId}`;
    }

    public resetPosition(): void {
        this.state.position = 50;
    }
}
