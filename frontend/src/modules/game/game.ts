import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { showToast } from "@/components/toast";
import { Engine, Scene, HemisphericLight, Vector3 } from "@babylonjs/core";
import type { Ball, Player, Score } from "./gameData";
import { createBall, createCamera, createPlayerLeft, createPlayerRight, createScores, createTable } from "./createGameObjs";
import { createGameSocket, getGameSocket } from "./gameSocket";

export function renderValues(posPlayerL:number, playerL:Player | undefined, posPlayerR:number, playerR:Player | undefined,
	pointsL:number, pointsR:number, scores:Score | undefined, ballX:number, ballY:number, ball:Ball | undefined)
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
	const singlePlayer = params.get("singlePlayer");
	const multiPlayer = params.get("mutiPlayer");
	const playerView = params.get("view");
	if (!id || !playerView || (playerView != "2D" && playerView != "3D") || !(!singlePlayer && !multiPlayer) || (singlePlayer && multiPlayer))
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

	// Motor y escena
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);

	// Cámara
	createCamera(playerView, scene, canvas);

	// Luz
	const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 1.2;

	// Mesa
	createTable(scene);

	// JUGADORES
	const playerLeft = createPlayerLeft(playerView, scene);
	const playerRight = createPlayerRight(playerView, scene);

	//SCORE
	const scores = createScores();
	if (!scores)
		return ;

	// PELOTA
	const ball = createBall(playerView, scene);



	const token = localStorage.getItem("access_token");
	const ws = createGameSocket(token);
	
	
	
	
	const socket = getGameSocket();
	if (!socket)
	{
		showToast("Internal error", "error");
		console.warn("Internal error");
		navigateTo("dashboard", false, true);
		return ;
	}
	ws.authenticate(Number(id));
	socket.initializeGame(Number(id), playerLeft, playerRight, scores, ball, engine, scene);
	socket.play();
		
	window.addEventListener("resize", () => {
		const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
		if (!canvas)
		{
			console.warn(t("CanvasNotFound"));
			return ;
		}
		engine.resize();
	});
}
