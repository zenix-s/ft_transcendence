import { ArcRotateCamera, Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { Ball, Player, Score } from "./gameData";
import { showToast } from "@/components/toast";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";

export function createBall(playerView: string | null, scene:Scene)
{
	const ball_html : Mesh = MeshBuilder.CreateSphere("ball", { diameter: 0.3 , segments : 32 }, scene);
	const ball : Ball = {
		ball : ball_html,
	}
	if (playerView === "2D")
	{
		ball.ball.position.y = 0.2;
		const mat = new StandardMaterial("ballMat", scene);
		mat.disableLighting = true;
		mat.emissiveColor = new Color3(1, 1, 1);
		ball_html.material = mat;
	}
	else
		ball.ball.position.y = 0.5;
	console.log("Ball=", ball);
	return (ball);
}

export function createScores()
{
	const left = document.getElementById("scoreLeft");
	const right = document.getElementById("scoreRight");
	if (!left || !right)
	{
		showToast(t("ScoresNotFound"), "error");
		console.warn(t("ScoresNotFound"));
		navigateTo("dashboard", false, true);
		return (null);
	}
	const scores : Score = {
		scoreLeft : left,
		pointsLeft : 0,
		scoreRight : right,
		pointsRight : 0,
	};
	console.log("Scores=", scores);
	return (scores);
}

export function createPlayerRight(playerView: string | null, scene:Scene)
{
	let paddle2;
	if (playerView === "2D")
		paddle2 = MeshBuilder.CreateBox("paddle2", { width: 0.2, height: 0.01, depth: 1.5 }, scene);
	else
		paddle2 = MeshBuilder.CreateBox("paddle2", { width: 0.2, height: 0.5, depth: 1.5 }, scene);
	paddle2.position.set(3.8, 0.2, 0);
	const paddle2Mat = new StandardMaterial("paddle2Mat", scene);
	if (playerView === "2D")
	{
		paddle2Mat.disableLighting = true;
		paddle2Mat.emissiveColor = new Color3(1, 0, 0);  // Red
	}
	else
		paddle2Mat.diffuseColor = new Color3(1, 0, 0);  // Red
	paddle2.material = paddle2Mat;

	const	playerRight : Player = {
		paddle : paddle2,
	};
	console.log("playerR", playerRight);
	return (playerRight);
}

export function createPlayerLeft(playerView: string | null, scene:Scene)
{
	let paddle1 : Mesh;
	if (playerView === "2D")
		paddle1 = MeshBuilder.CreateBox("paddle1", { width: 0.2, height: 0.01, depth: 1.5 }, scene);
	else
		paddle1 = MeshBuilder.CreateBox("paddle1", { width: 0.2, height: 0.5, depth: 1.5 }, scene);
	paddle1.position.set(-3.8, 0.2, 0);
	const paddle1Mat = new StandardMaterial("paddle1Mat", scene);
	if (playerView === "2D")
	{
		paddle1Mat.disableLighting = true;
		paddle1Mat.emissiveColor = new Color3(0, 0, 1); // Blue
	}
	else
		paddle1Mat.diffuseColor = new Color3(0, 0, 1); // Blue
	paddle1.material = paddle1Mat;

	const playerLeft : Player = {
		paddle : paddle1,
	};
	console.log("playerL", playerLeft);
	return (playerLeft);
}

export function createTable(scene:Scene)
{
	const table : Mesh = MeshBuilder.CreateBox("table", { width: 8.8, depth: 8, height: 0.2 }, scene);
	table.position.y = 0.1;
	const tableMat = new StandardMaterial("tableMat", scene);
	tableMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
	tableMat.disableLighting = true;
	table.material = tableMat;

	const borders = new StandardMaterial("lineMat");
	borders.disableLighting = true;
	borders.emissiveColor = new Color3(1, 1, 1);
	const thickness = 0.08;
	
	// BORDE SUPERIOR
	const top = MeshBuilder.CreateBox("lineTop", { width: 8.8, depth: thickness, height: 0.21 }, scene);
	top.position.set(0, 0.105, 4 - thickness / 2);
	top.material = borders;

	// BORDE INFERIOR
	const bottom = MeshBuilder.CreateBox("lineBottom", { width: 8.8, depth: thickness, height: 0.21 }, scene);
	bottom.position.set(0, 0.105, -4 + thickness / 2);
	bottom.material = borders;

	// BORDE IZQUIERDO
	const left = MeshBuilder.CreateBox("lineLeft", { width: thickness, depth: 8, height: 0.21 }, scene);
	left.position.set(-4.4 + thickness / 2, 0.105, 0);
	left.material = borders;

	// BORDE DERECHO
	const right = MeshBuilder.CreateBox("lineRight", { width: thickness, depth: 8, height: 0.21 }, scene);
	right.position.set(4.4 - thickness / 2, 0.105, 0);
	right.material = borders;

	// LÍNEA DEL CENTRO
	const midline = MeshBuilder.CreateBox("midline", { width: 0.1, depth: 8, height: 0.21 }, scene);
	midline.position.set(0, 0.105, 0);
	midline.material = borders;
}

export function createCamera(playerView: string | null, scene:Scene, canvas:HTMLCanvasElement)
{
	let camera;
	if (playerView === "3D")
		camera = new ArcRotateCamera("camera", Math.PI / 2 + Math.PI, Math.PI / 6, 12, Vector3.Zero(), scene);
	else
		camera = new ArcRotateCamera("camera", Math.PI / 2 + Math.PI, 0 , 12, Vector3.Zero(), scene);

	//girar con el ratón
	camera.inputs.removeByType("ArcRotateCameraPointersInput");
	camera.attachControl(canvas, true);

	//girar con el teclado
	camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
	// zoom (rueda del ratón sigue funcionando)
	camera.lowerRadiusLimit = 13;
}
