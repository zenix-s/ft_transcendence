import type { Mesh } from "@babylonjs/core";

export interface Player {
	paddle: Mesh;
	posX: number;
	posY: number;
	height: number;
	width: number;
	speed: number;
	topPercentage: number;
	bottomPercentage: number;
}

export interface Score {
	scoreLeft: HTMLElement;
	pointsLeft: number;
	scoreRight: HTMLElement;
	pointsRight: number;
	maxScore: number;
}

export interface Ball {
	ball : Mesh;
	posX: number;
	posY: number;
	speed: number;
}

// export interface Ball {
// 	prevPosX: number;
// 	posX: number;
// 	prevPosY: number;
// 	posY: number;
// 	speed: number;
// }