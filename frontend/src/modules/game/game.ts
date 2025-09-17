
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

// interface Player {
// 	paddle: HTMLElement,
// 	position: number,
// 	colisions: number,
// }

// class Player {
// 	paddle: HTMLElement;
// 	position: number;
// 	colisions: number;
// 	constructor(paddle : HTMLElement) {
// 		this.paddle = paddle;
// 		this.position = 0;
// 		this.colisions = 100;
// 	}
// }

/* top: 5.6 bottom: 94.5 */
function loopGame(canvas:HTMLCanvasElement, paddle1:HTMLElement, paddle2:HTMLElement)
{
	if (canvas.height < 500)
	{
		paddle1.classList.replace("h-32", "h-10");
		paddle2.classList.replace("h-32", "h-10");
	}
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
	const paddle1 = document.getElementById("player1") as HTMLElement;
	const paddle2 = document.getElementById("player2") as HTMLElement;

	console.log(paddle1);
	console.log(paddle2);
	console.log("hola");

	paddle1.style.top = "50%"; //"500px";
	paddle2.style.top = "50%"; //"1000px";

	console.log(paddle1);
	console.log(paddle2);

	// const player1 = new Player(paddle1);
	// const player2 = new Player(paddle2);
	// console.log(player1);
	// console.log(player2);


	/* PUNTUACIONES */
	if (!document.getElementById("score1")?.innerHTML)
	{
		return ;
	}
	let score1 = document.getElementById("score1").innerHTML = "10";
	console.log("score1=", score1);
	score1 = "10";


	/* PELOTA */
	const cssW = 2000;
	const cssH = 1250;
	
	// Center of the canvas (CSS pixels)
	let posX = cssW / 2;
	let posY = cssH / 2;

	console.log("patataassss");
	
	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(posX, posY, 15, 0, Math.PI * 2);
	ctx.fill();
	loopGame(canvas, paddle1, paddle2);
}
