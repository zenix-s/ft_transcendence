/* USUARIOS:
ines
hola@gmail.com
Hola12345
*/


import type { Player, Score, Ball } from "./gameData.js";
import { fetchGameId, toJoinGame, fetchGameState } from "./getData.js";

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

async function look()
{
	const gameId = await fetchGameId();
	if (!gameId)
	{
		console.log("No game ID");
		return ;
	}
	console.log("si gameId=", gameId);

	const gameJoin = await toJoinGame(gameId);
	if (!gameJoin)
	{
		console.log("No join game");
		return ;
	}
	console.log("si gameJoin=", gameJoin);

	const gameState = await fetchGameState(gameId);
	if (!gameState)
	{
		console.log("no gameState");
		return ;
	}
	console.log("si gameState");
}

function actualizeValues(posPlayerL:number, playerL:Player, posPlayerR:number, playerR:Player,
	pointsL:number, pointsR:number, scores:Score, ballX:number, ballY:number, ball:Ball)
{
	look();
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
	console.log("hight=", canvas.height);
	if (canvas.height < 500)
	{
		playerLeft.paddle.classList.replace("h-32", "h-10");
		playerLeft.paddle.classList.replace("h-32", "h-10");
	}

	/* CAMBIAR JUGADORES DE SITIO */
	playerLeft.paddle.style.top = playerLeft.posY.toString() + "%";
	playerRight.paddle.style.top = playerRight.posY.toString() + "%";

	/* CAMBIAR LA PELOTA DE SITIO */
	const prevPosX = ball.prevPosX * 1250 / 100;
	const prevPosY = ball.prevPosY * 1250 / 100;
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(prevPosX, prevPosY, 15, 0, Math.PI * 2);
	ctx.fill();
	const posX = ball.posX * 1250 / 100;
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

	/* PELOTA*/
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
	ctx.arc(ball.posX * 1250 / 100, ball.posY * 1250 / 100, 15, 0, Math.PI * 2);
	ctx.fill();
	actualizeValues(30, playerLeft, 1000, playerRight, 5, 100, scores, 10, 10, ball);
	actualizeGame(canvas, playerLeft, playerRight, scores, ball);
}



//fetch