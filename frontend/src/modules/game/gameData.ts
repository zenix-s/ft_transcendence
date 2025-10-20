export interface Player {
	paddle: HTMLElement;
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
	prevPosX: number;
	posX: number;
	prevPosY: number;
	posY: number;
	speed: number;
}