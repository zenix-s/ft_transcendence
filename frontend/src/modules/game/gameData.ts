import type { Mesh } from "@babylonjs/core";

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
	ball : Mesh;
}
