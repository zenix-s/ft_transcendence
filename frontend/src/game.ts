
export function startGame()
{
	console.log("hola");
	// document.addEventListener("DOMContentLoaded", () => {
	// 	const canv = document.getElementById("#gameCanvas") as HTMLCanvasElement;
	// 	console.log(canv); // ✅ ya no es null
	//   });
	  

	console.log(document.getElementById("app"));
	const div = document.getElementById("app");
	console.log(div?.children);
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	console.log(canvas);
	//const patata = document.getElementById("patata");
	//patata.style.color = newColor;
	if (!canvas)
	{
		console.log("Error: no canvassss");
		return ;
	}
	const ctx = canvas.getContext("2d")!; // as CanvasRenderingContext2D

	/* Optional: handle device pixel ratio */
	const dpr = Math.max(1, window.devicePixelRatio || 1);
	const cssW = canvas.clientWidth;
	const cssH = canvas.clientHeight;
	canvas.width = Math.round(cssW * dpr);
	canvas.height = Math.round(cssH * dpr);
	ctx.scale(dpr, dpr);

	// Center of the canvas (CSS pixels)
	const centerX = cssW / 2;
	const centerY = cssH / 2;

	console.log("patataassss");

	// Draw a white dot in the center
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(centerX, centerY, 5, 0, Math.PI * 2); // radius = 5
	ctx.fill();
}
