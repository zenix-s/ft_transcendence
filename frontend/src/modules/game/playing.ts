import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { showToast } from "@/components/toast";
import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3, Mesh } from "@babylonjs/core";
import type { Ball, Player, Score } from "./gameData";
import { socketAndRender } from "./conectWebSocket";

export function renderValues(posPlayerL:number, playerL:Player, posPlayerR:number, playerR:Player,
	pointsL:number, pointsR:number, scores:Score, ballX:number, ballY:number, ball:Ball, engine:Engine, scene:Scene)
{
	ball.ball.position.x = (ballX / 100) *  8 - 4;
	ball.ball.position.z = (ballY / 100) * 2 - 2;
	playerL.paddle.position.z = (posPlayerL / 100) * 4 - 2;
	playerR.paddle.position.z = (posPlayerR / 100) * 4 - 2;
	engine.runRenderLoop(() => {
		const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
		if (!canvas)
		{
			console.warn("no canvas");
			return ;
		}
		console.log("hola");
		scene.render();
	});
}


export function initGame3D() {
	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");
	const singlePlayer = params.get("singlePlayer");
	const multiPlayer = params.get("mutiPlayer");
	if (!id || !(!singlePlayer && !multiPlayer) || (singlePlayer && multiPlayer))
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

	console.log(canvas);

	// Motor y escena
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);

	// Cámara
	const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, Vector3.Zero(), scene);
	camera.attachControl(canvas, true);

	// Luz
	const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
	light.intensity = 1;

	// Mesa
	const table : Mesh = MeshBuilder.CreateBox("table", { width: 8, depth: 4, height: 0.2 }, scene);
	table.position.y = -0.1;

	// JUGADORES
	const paddle1 : Mesh = MeshBuilder.CreateBox("paddle1", { width: 0.2, height: 0.5, depth: 1 }, scene);
	paddle1.position.set(-3.5, 0.25, 0);
	const paddle2 : Mesh = MeshBuilder.CreateBox("paddle2", { width: 0.2, height: 0.5, depth: 1 }, scene);
	paddle2.position.set(3.5, 0.25, 0);

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
	const	playerRight : Player = {
		paddle : paddle2,
		posX : 1990,
		posY : 50,
		height : 32,
		width : 4,
		speed : 1,
		topPercentage : 5.8,
		bottomPercentage : 94.2
	};
	console.log("playerL", playerLeft);
	console.log("playerR", playerRight);

	//SCORE
	const left = document.getElementById("scoreLeft");
	const right = document.getElementById("scoreRight");
	if (!left || !right)
	{
		showToast(t("ScoresNotFound"), "error");
		console.warn(t("ScoresNotFound"));
		navigateTo("dashboard", false, true);
		return ;
	}
	const scores : Score = {
		scoreLeft : left,
		pointsLeft : 0,
		scoreRight : right,
		pointsRight : 0,
		maxScore : 5
	};
	console.log("Scores=", scores);

	// PELOTA
	const ball_html : Mesh = MeshBuilder.CreateSphere("ball", { diameter: 0.3 , segments : 32 }, scene);
	const ball : Ball = {
		ball : ball_html,
		posX : 50,
		posY : 0.15,
		speed : 1,
	}
	ball.ball.position.y = 0.15;
	console.log("Ball=", ball);

	socketAndRender(playerLeft, playerRight, scores, ball, engine, scene);

	// Loop
	// engine.runRenderLoop(() => {
	// 	const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	// 	if (!canvas)
	// 	{
	// 		console.warn("no canvas");
	// 		return ;
	// 	}
	// 	console.log("hola");
	// 	scene.render();
	// });
		
	window.addEventListener("resize", () => {
		const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
		if (!canvas)
		{
			console.warn("no canvas");
			return ;
		}
		console.log("adios");
		engine.resize();
	});
}
