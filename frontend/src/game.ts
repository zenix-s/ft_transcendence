const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

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
