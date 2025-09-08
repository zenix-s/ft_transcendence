
/*to remove*/
async function sleep(ms: number): Promise<void> {
    return new Promise(
        (resolve) => setTimeout(resolve, ms));
}

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
	
	// const paddle1 = document.getElementById("player1") as HTMLElement;
	// const paddle2 = document.getElementById("player2") as HTMLElement;
	// const player1 = new Player(paddle1);
	// const player2 = new Player(paddle2);
	// console.log(player1);
	// console.log(player2);
	
	/*to remove*/
	/* Optional: handle device pixel ratio */
	const cssW = canvas.clientWidth;
	const cssH = canvas.clientHeight;

	console.log(cssW);
	console.log(cssH);
	
	// Center of the canvas (CSS pixels)
	const centerX = cssW / 2;
	const centerY = cssH / 2;
	
	console.log("patataassss");
	
	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(centerX, centerY, 5, 0, Math.PI * 2); // radius = 5
	ctx.fill();
	
	for (let index = 5; index < 15; index++) {
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.arc(centerX, centerY, index, 0, Math.PI * 2); // radius = 15 -> OK
		ctx.fill();
		await sleep(2000);
		console.log("wait");
	}
}
