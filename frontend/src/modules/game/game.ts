/* USUARIOS:
ines
hola@gmail.com
Hola12345
*/


import type { Player, Score, Ball } from "./gameData.js";
import { socketAndRender } from "./conectWebSocket.js";

export function actualizeValues(posPlayerL:number, playerL:Player, posPlayerR:number, playerR:Player,
	pointsL:number, pointsR:number, scores:Score, ballX:number, ballY:number, ball:Ball)
{
	playerL.posY = posPlayerL;
	playerR.posY = posPlayerR;

	scores.pointsLeft = pointsL;
	scores.pointsRight = pointsR;

	ball.posX = ballX;
	ball.posY = ballY;
	actualizeGame(playerL, playerR, scores, ball);
}

function actualizeGame(playerLeft: Player, playerRight: Player,
	scores: Score , ball: Ball)
{
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas)
	{
		console.log("Error: no canvas");
		return ;
	}
	console.log("hight=", canvas.height);
	if (canvas.height < 500)
	{
		playerLeft.paddle.classList.replace("h-32", "h-10");
		playerLeft.paddle.classList.replace("h-32", "h-10");
	}

	/* CAMBIAR JUGADORES DE SITIO */
	if (playerLeft.posY < playerLeft.topPercentage)
		playerLeft.posY = playerLeft.topPercentage;
	if (playerLeft.posY > playerLeft.bottomPercentage)
		playerLeft.posY = playerLeft.bottomPercentage;
	if (playerRight.posY < playerRight.topPercentage)
		playerRight.posY = playerRight.topPercentage;
	if (playerRight.posY > playerRight.bottomPercentage)
		playerRight.posY = playerRight.bottomPercentage;
	playerLeft.paddle.style.top = playerLeft.posY.toString() + "%";
	playerRight.paddle.style.top = playerRight.posY.toString() + "%";

	/* CAMBIAR LA PELOTA DE SITIO */
	const prevPosX = ball.prevPosX * 2000 / 100;
	const prevPosY = ball.prevPosY * 1250 / 100;
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(prevPosX, prevPosY, 20, 0, Math.PI * 2);
	ctx.fill();
	const posX = ball.posX * 2000 / 100;
	const posY = ball.posY * 1250 / 100;
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(posX, posY, 15, 0, Math.PI * 2);
	ctx.fill();
	ball.prevPosX = ball.posX;
	ball.prevPosY = ball.posY;

	/* CAMBIAR PUNTUACIONES */
	scores.scoreLeft.textContent = scores.pointsLeft.toString();
	scores.scoreRight.textContent = scores.pointsRight.toString();
}

export function startGame()
{
	console.log("entrando en game");
	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");
	const singlePlayer = params.has("singlePlayer");
	if (!id || !singlePlayer)
	{
		console.log("no gameid o singleplayer");
		return ;
	}





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
		posY : 50,
		height : 32,
		width : 4,
		speed : 1,
		topPercentage : 5.8,
		bottomPercentage : 94.2
	};
	const playerRight : Player = {
		paddle : paddle2,
		posX : 1990,
		posY : 50,
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

	/* PELOTA */
	const ball : Ball = {
		prevPosX : 50,
		posX : 50,
		prevPosY : 50,
		posY : 50,
		speed : 1
	};
	console.log("ball=", ball);
	
	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(ball.posX * 2000 / 100, ball.posY * 1250 / 100, 15, 0, Math.PI * 2);
	ctx.fill();
	socketAndRender(playerLeft, playerRight, scores, ball);
}
