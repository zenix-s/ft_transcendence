import type { Player, Score, Ball } from "./gameData.js";

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

function actualizeValues(posPlayerL:number, playerL:Player, posPlayerR:number, playerR:Player,
	pointsL:number, pointsR:number, scores:Score, ballX:number, ballY:number, ball:Ball)
{
	playerL.posX = posPlayerL;
	playerR.posX = posPlayerR;

	scores.pointsLeft = pointsL;
	scores.pointsRight = pointsR;

	ball.posX = ballX;
	ball.posY = ballY;
}

function actualizeGame(canvas:HTMLCanvasElement, playerLeft: Player, playerRight: Player,
	scores: Score , ball: Ball)
{
	console.log(canvas.height);
	if (canvas.height < 500)
	{
		playerLeft.paddle.classList.replace("h-32", "h-10");
		playerLeft.paddle.classList.replace("h-32", "h-10");
	}

	/* CAMBIAR JUGADORES DE SITIO */
	playerLeft.paddle.style.top = "5.8%";
	playerRight.paddle.style.top = "94.2%";

	/* CAMBIAR LA PELOTA DE SITIO */
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(ball.prevPosX, ball.prevPosY, 15, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(ball.posX, ball.posY, 15, 0, Math.PI * 2);
	ctx.fill();
	ball.prevPosX = ball.posX;
	ball.prevPosY = ball.posY;

	/* CAMBIAR PUNTUACIONES */
	scores.scoreLeft.textContent = scores.pointsLeft.toString();
	scores.scoreRight.textContent = scores.pointsRight.toString();
}

export function startGame()
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

	const playerLeft : Player = {
		paddle : paddle1,
		posX : 10,
		posY : 625,
		height : 32,
		width : 4,
		speed : 1,
		topPercentage : 5.8,
		bottomPercentage : 94.2
	};
	const playerRight : Player = {
		paddle : paddle2,
		posX : 1990,
		posY : 625,
		height : 32,
		width : 4,
		speed : 1,
		topPercentage : 5.8,
		bottomPercentage : 94.2

	};
	console.log(playerLeft);
	console.log(playerRight);

	paddle1.style.top = "50%";
	paddle2.style.top = "50%";

	/* SCORE */
	const scores : Score = {
		scoreLeft : document.getElementById("scoreLeft"),
		pointsLeft : 0,
		scoreRight : document.getElementById("scoreRight"),
		pointsRight : 0,
		maxScore : 5
	};
	if (!scores.scoreLeft || !scores.scoreRight)
	{
		console.log("Error: no scores");
		return ;
	}
	console.log("Scores=", scores);

	/* PELOTA*/
	const ball : Ball = {
		prevPosX : 1000,
		posX : 1000,
		prevPosY : 625,
		posY : 625,
		speed : 1
	};
	console.log("ball=", ball);
	
	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(ball.posX, ball.posY, 15, 0, Math.PI * 2);
	ctx.fill();
	actualizeValues(30, playerLeft, 1000, playerRight, 5, 100, scores, 200, 200, ball);
	actualizeGame(canvas, playerLeft, playerRight, scores, ball);
}
