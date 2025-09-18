
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

interface Score {
	scoreLeft: HTMLElement | null,
	pointsLeft: number,
	scoreRight: HTMLElement | null,
	pointsRight: number,
	maxScore: number,
}

interface Ball {
	prevPosX: number,
	posX: number,
	prevPosY: number,
	posY: number,
	speed: number,
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
	ctx.arc(ball.prevPosX, ball.prevPosY, 15, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(ball.posX, ball.posY, 15, 0, Math.PI * 2);
	ctx.fill();
	ball.prevPosX = ball.posX;
	ball.prevPosY = ball.posY;

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

	console.log("hola");

	paddle1.style.top = "50%"; //"500px";
	paddle2.style.top = "50%"; //"1000px";

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

	/* PELOTA GOOD */
	const ball : Ball = {
		prevPosX : 1000,
		posX : 1000,
		prevPosY : 625,
		posY : 625,
		speed : 1
	};
	console.log("ball=", ball);

	console.log("patataassss");
	
	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(ball.posX, ball.posY, 15, 0, Math.PI * 2);
	ctx.fill();
	loopGame(canvas, playerLeft, playerRight, scores, ball);
}
