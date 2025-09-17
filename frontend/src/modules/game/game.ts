
document.addEventListener("keydown", (event) => {
	const key = event.key;
	console.log(key);
	if (key === "ArrowUp")
		console.log("up");
	if (key === "ArrowDown")
		console.log("down");
	if (key === "w")
		console.log("w");
	if (key === "s")
		console.log("s");
});

interface Player {
	paddle: HTMLElement,
	posX: number,
	posY: number,
	height: number,
	width: number,
	speed: number,
	topPercentage: number,
	bottomPercentage: number,
}

class Player{
	paddle: HTMLElement;
	posX: number;
	posY: number;
	height: number;
	width: number;
	speed: number;
	topPercentage: number;
	bottomPercentage: number;

	constructor(padddle: HTMLElement, posX: number){
		this.paddle = padddle;
		this.posX = posX;
		this.posY = 625;
		this.height = 32;
		this.width = 4;
		this.speed = 1;
		this.topPercentage = 5.8;
		this.bottomPercentage = 94.2;
	}
}

interface Score {
	scoreLeft: HTMLElement | null,
	pointsLeft: number,
	scoreRight: HTMLElement | null,
	pointsRight: number,
	maxScore: number,
}

class Score {
	scoreLeft: HTMLElement | null;
	pointsLeft: number;
	scoreRight: HTMLElement | null;
	pointsRight: number;
	maxScore: number;

	constructor(maxScore: number) {
		this.scoreLeft = document.getElementById("scoreLeft");
		this.pointsLeft = 0;
		this.scoreRight = document.getElementById("scoreRight");
		this.pointsRight = 0;
		this.maxScore = maxScore;
	}
}

interface Ball {
	posX: number,
	posY: number,
	speed: number,
}

class Ball {
	posX: number;
	posY: number;
	speed: number;

	constructor() {
		this.posX = 1000;
		this.posY = 625;
		this.speed = 1;
	}
}

function loopGame(canvas:HTMLCanvasElement, playerLeft: Player, playerRight: Player,
	scores: Score , ball: Ball)
{
	console.log(canvas.height);
	if (canvas.height < 500)
	{
		playerLeft.paddle.classList.replace("h-32", "h-10");
		playerLeft.paddle.classList.replace("h-32", "h-10");
	}

	/* CAMBIAR JUGADORES DE SITIO */
	playerLeft.paddle.style.top = "5.8%"; //"500px";
	playerRight.paddle.style.top = "94.2%"; //"1000px";

	/* CAMBIAR LA PELOTA DE SITIO */
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(2000/2, 1250/2, 15, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(200, 200, 15, 0, Math.PI * 2);
	ctx.fill();

	/* CAMBIAR PUNTUACIONES */
	scores.pointsLeft = 10;
	scores.scoreLeft.textContent = scores.pointsLeft.toString();
	scores.scoreRight.textContent = scores.pointsRight.toString();
}

export async function startGame()
{
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	const ctx = canvas.getContext("2d")!; // as CanvasRenderingContext2D
	console.log(canvas);
	if (!canvas)
	{
		console.log("Error: no canvas");
		return ;
	}
	
	/* JUGADORES */
	const paddle1 = document.getElementById("playerLeft") as HTMLElement;
	const paddle2 = document.getElementById("playerRight") as HTMLElement;
	if (!paddle1 || !paddle2)
	{
		console.log("Error: no paddles");
		return ;
	}

	const playerLeft = new Player(paddle1, 10);
	const playerRight = new Player(paddle2, 1990);
	console.log(playerLeft);
	console.log(playerRight);

	console.log("hola");

	paddle1.style.top = "50%"; //"500px";
	paddle2.style.top = "50%"; //"1000px";

	/* SCORE */
	const scores = new Score(5);
	if (!scores.scoreLeft || !scores.scoreRight)
	{
		console.log("Error: no scores");
		return ;
	}
	console.log("Scores=", scores);

	/* PELOTA GOOD */
	const ball = new Ball();
	console.log("ball=", ball);

	console.log("patataassss");
	
	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(ball.posX, ball.posY, 15, 0, Math.PI * 2);
	ctx.fill();
	loopGame(canvas, playerLeft, playerRight, scores, ball);
}
