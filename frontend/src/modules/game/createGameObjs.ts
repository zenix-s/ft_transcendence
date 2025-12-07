import { ArcRotateCamera, Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import type { Ball, Player, Score } from "./gameData";
import { showToast } from "@/components/toast";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { getColor, setColors } from "./getColors";

export function createBall(playerView: string | null, scene:Scene)
{
	const ball_html : Mesh = MeshBuilder.CreateSphere("ball", { diameter: 0.3 , segments : 32 }, scene);
	const ball : Ball = {
		ball : ball_html,
	}
	if (playerView === "2d")
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
	if (playerView === "2d")
		paddle2 = MeshBuilder.CreateBox("paddle2", { width: 0.2, height: 0.01, depth: 1.5 }, scene);
	else
		paddle2 = MeshBuilder.CreateBox("paddle2", { width: 0.2, height: 0.5, depth: 1.5 }, scene);
	paddle2.position.set(3.8, 0.2, 0);
	const paddle2Mat = new StandardMaterial("paddle2Mat", scene);
	if (playerView === "2d")
	{
		paddle2Mat.disableLighting = true;
		paddle2Mat.emissiveColor = new Color3(0.8, 0.2, 0.2);  // Red
	}
	else
		paddle2Mat.diffuseColor = new Color3(0.8, 0.2, 0.2);  // Red
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
	if (playerView === "2d")
		paddle1 = MeshBuilder.CreateBox("paddle1", { width: 0.2, height: 0.01, depth: 1.5 }, scene);
	else
		paddle1 = MeshBuilder.CreateBox("paddle1", { width: 0.2, height: 0.5, depth: 1.5 }, scene);
	paddle1.position.set(-3.8, 0.2, 0);
	const paddle1Mat = new StandardMaterial("paddle1Mat", scene);
	if (playerView === "2d")
	{
		paddle1Mat.disableLighting = true;
		paddle1Mat.emissiveColor = new Color3(0.2, 0.4, 0.8); // Blue
	}
	else
		paddle1Mat.diffuseColor = new Color3(0.2, 0.4, 0.8); // Blue
	paddle1.material = paddle1Mat;

	const playerLeft : Player = {
		paddle : paddle1,
	};
	console.log("playerL", playerLeft);
	return (playerLeft);
}

export function createTable(scene:Scene)
{
	const table : Mesh = MeshBuilder.CreateBox("table", { width: 8.8, depth: 8.2, height: 0.2 }, scene);
	table.position.y = 0.1;
	const tableMat = new StandardMaterial("tableMat", scene);
	tableMat.emissiveColor = new Color3(0.2, 0.2, 0.2);
	tableMat.disableLighting = true;
	table.material = tableMat;

	if (localStorage.getItem("theme") === "dark")
	{
		const borderColor = getColor("--color-primary");
		const bgColor = getColor("--color-secondary");
		setColors(scene, bgColor, borderColor);
	}
	else
	{
		const borderColor = getColor("--color-secondary");
		const bgColor = getColor("--color-primary");
		setColors(scene, bgColor, borderColor);
	}
}

export function createCamera(playerView: string | null, scene:Scene, canvas:HTMLCanvasElement)
{
	let camera;
	if (playerView === "3d")
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
