export interface BallState {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
}

export class PongBall {
    private position: { x: number; y: number };
    private velocity: { x: number; y: number };

    constructor() {
        this.position = { x: 50, y: 50 };
        this.velocity = this.generateInitialVelocity();
    }

    public update(deltaTime: number): void {
        this.applyAirResistance();
        this.move(deltaTime);
        this.handleWallBounce();
    }

    private applyAirResistance(): void {
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);

        if (currentSpeed > 1.8) {
            const airResistance = 0.9975;
            this.velocity.x *= airResistance;
            this.velocity.y *= airResistance;
        }
    }

    private move(deltaTime: number): void {
        this.position.x += this.velocity.x * deltaTime * 60;
        this.position.y += this.velocity.y * deltaTime * 60;
    }

    private handleWallBounce(): void {
        if (this.position.y <= 0 || this.position.y >= 100) {
            this.velocity.y = -this.velocity.y;
            this.position.y = Math.max(0, Math.min(100, this.position.y));
        }
    }

    public reflectFromPaddle(contactPoint: number, isLeftPaddle: boolean): void {
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const speedMultiplier = Math.min(2.2, currentSpeed * 1.06);
        const maxAngleModifier = 0.4;

        if (isLeftPaddle) {
            this.velocity.x = speedMultiplier * Math.cos(contactPoint * 0.3);
            this.position.x = 5;
        } else {
            this.velocity.x = -speedMultiplier * Math.cos(contactPoint * 0.3);
            this.position.x = 95;
        }

        this.velocity.y = this.velocity.y * 0.8 + contactPoint * maxAngleModifier;
        this.velocity.y = Math.max(-0.6, Math.min(0.6, this.velocity.y));
    }

    public reset(): void {
        this.position = { x: 50, y: 50 };
        this.velocity = this.generateInitialVelocity();
    }

    private generateInitialVelocity(): { x: number; y: number } {
        const MAX_ANGLE_DEG = 20;
        const angleDeg = (Math.random() * 2 - 1) * MAX_ANGLE_DEG;
        const angleRad = (angleDeg * Math.PI) / 180;
        const speed = 0.8;

        const lateralDirection = Math.random() > 0.5 ? 1 : -1;

        const vx = lateralDirection * Math.cos(angleRad) * speed;
        const vy = Math.sin(angleRad) * speed;

        return { x: vx, y: vy };
    }

    public getState(): BallState {
        return {
            position: { ...this.position },
            velocity: { ...this.velocity },
        };
    }

    public getPosition(): { x: number; y: number } {
        return { ...this.position };
    }

    public getVelocity(): { x: number; y: number } {
        return { ...this.velocity };
    }
}
