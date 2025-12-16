import type { Mesh, Engine, Scene } from '@babylonjs/core';

export interface Player {
    paddle: Mesh;
}

export interface Score {
    scoreLeft: HTMLElement;
    pointsLeft: number;
    scoreRight: HTMLElement;
    pointsRight: number;
}

export interface Ball {
    ball: Mesh;
}

export interface BabylonElements {
    engine: Engine;
    scene: Scene;
    playerLeft: Player;
    playerRight: Player;
    scores: Score;
    ball: Ball;
}
