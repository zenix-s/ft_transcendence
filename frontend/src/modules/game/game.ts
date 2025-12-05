import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { showToast } from "@/components/toast";
import { Engine, Scene, HemisphericLight, Vector3 } from "@babylonjs/core";
import type { Ball, Player, Score } from "./gameData";
import { createBall, createCamera, createPlayerLeft, createPlayerRight, createScores, createTable } from "./createGameObjs";
import { createGameSocket, getGameSocket } from "./gameSocket";

export function renderValues(posPlayerL:number, playerL:Player | undefined,
	posPlayerR:number, playerR:Player | undefined,
	pointsL:number, pointsR:number, scores:Score | undefined,
	ballX:number, ballY:number, ball:Ball | undefined)
{
	if (!ball || !playerL || !playerR || !scores)
		return;
	ball.ball.position.x = (ballX / 100) * 8 - 4;
	ball.ball.position.z = (ballY / 100) * 7.8 - 3.9;

	playerL.paddle.position.z = (posPlayerL / 100) * 8 - 4;
	playerR.paddle.position.z = (posPlayerR / 100) * 8 - 4;

	scores.pointsLeft = pointsL;
	scores.pointsRight = pointsR;
	scores.scoreLeft.textContent = scores.pointsLeft.toString();
	scores.scoreRight.textContent = scores.pointsRight.toString();
}

export function initGame3D() {
	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");
	if (!id)
	{
		showToast(t("URLNotCorrect"), "error");
		console.warn(t("URLNotCorrect"));
		navigateTo("dashboard", false, true);
		return ;
	}
	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!canvas)
	{
		showToast(t("CanvasNotFound"), "error");
		console.warn(t("CanvasNotFound"));
		navigateTo("dashboard", false, true);
		return ;
	}
	const buttonUp = document.getElementById("button-up") as HTMLButtonElement;
	const buttonDown = document.getElementById("button-down") as HTMLButtonElement;
	if (!buttonUp || !buttonDown)
	{
		showToast(t("ButtonsNotFound"), "error");
		console.warn(t("ButtonsNotFound"));
		navigateTo("dashboard", false, true);
		return ;
	}

	const timer = document.getElementById("timer") as HTMLElement;
	if (!timer)
	{
		showToast(t("TimerNotFound"), "error");
		console.warn(t("TimerNotFound"));
		navigateTo("dashboard", false, true);
		return ;
	}

	let ws = getGameSocket();
	if (!ws)
	{
		const token = localStorage.getItem("access_token");
		ws = createGameSocket(token, Number(id));
		ws.setAuth();
	}

	// Motor y escena
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);

	ws.setScene(scene);

	// Ajustar tamaño del canvas
	adjustCanvasSize(canvas, engine);

	// Cámara
	createCamera(ws.getGameView(), scene, canvas);

	// Luz
	const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 1.2;

	// Mesa
	createTable(scene);

	// JUGADORES
	const playerLeft = createPlayerLeft(ws.getGameView(), scene);
	const playerRight = createPlayerRight(ws.getGameView(), scene);

	//SCORE
	const scores = createScores();
	if (!scores)
		return ;

	// PELOTA
	const ball = createBall(ws.getGameView(), scene);

	ws.authenticate(Number(id));
	ws.initializeGame(Number(id), playerLeft, playerRight, scores, ball, engine, scene, buttonUp, buttonDown, timer);
	ws.play();
		
	window.addEventListener("resize", () => {
		const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
		if (!canvas)
		{
			console.warn(t("CanvasNotFound"));
			return ;
		}
		adjustCanvasSize(canvas, engine);
	});
}

function adjustCanvasSize(canvas: HTMLCanvasElement, engine: Engine) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width < height) {
        // Pantalla vertical → el ancho manda
        canvas.style.width = "100vw";
        canvas.style.height = `${width * 0.9}px`; // evita barras
    } else {
        // Pantalla horizontal → el alto manda
        canvas.style.height = "100vh";
        canvas.style.width = `${height * 1.1}px`; // ajusta proporción
    }

    engine.resize();
}
