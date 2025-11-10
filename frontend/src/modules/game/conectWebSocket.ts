import { showToast } from "@/components/toast";
import type { Ball, Player, Score } from "./gameData";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { getWsUrl } from "@/api";
import { renderValues } from "./playing";
import type { Engine, Scene } from "@babylonjs/core";
import { endGameAuthAndErrors } from "./authAndErrors";

interface message {
	action: number,
	gameId: number,
	token: string | null
}

export function conectWebSocket(gameId: number, player1: Player, player2: Player, scores: Score, ball: Ball, engine:Engine, scene:Scene)
{
	const token = localStorage.getItem("access_token");
	const socket = new WebSocket(getWsUrl("/game/pong"));
	let up = 0;
	let down = 0;
	let ready = 0;
	
	socket.addEventListener("open", () => {
		console.log("conectado websockket");
		const obj : message = {
			action: 1,
			gameId:gameId,
			token: token
		};
		socket.send(JSON.stringify(obj));
		obj.action = 1;
		//if (ready == 1)
		//{
			engine.runRenderLoop(() => {
				obj.action = 1;
				socket.send(JSON.stringify(obj));
				
				if (up == 1 && down == 0)
				{
					obj.action = 3;
					socket.send(JSON.stringify(obj));
				}
				if (down == 1 && up == 0)
				{
					obj.action = 2;
					socket.send(JSON.stringify(obj));
				}
				scene.render();
			});
		//}
	})

	socket.addEventListener("message", async (msg) => {
		console.log("mensaje recibido=", msg.data);
		const data = JSON.parse(msg.data);
		if (data.type ==  "gameState")
		{
			renderValues(data.state.player1.position, player1, data.state.player2.position, player2,
				data.state.player1.score, data.state.player2.score, scores,
				data.state.ball.position.x, data.state.ball.position.y, ball);

			if (data.state.isRunning == false && data.state.arePlayersReady == true)
			{
				engine.stopRenderLoop();
				showToast(t("noActiveGame"), "error");
				console.warn(t("noActiveGame"));
				navigateTo("dashboard");
			}
		}
		else if (data.type == "error") {
			if (data.error == "GameAlreadyFinished" || (data.error != "UnauthorizedAccess" && data.error != "GameNotFound"))
				engine.stopRenderLoop();
			if (data.error == "UnauthorizedAccess" && ready == 1)
				return ;
			else if (data.error == "UnauthorizedAccess" && ready == 0)
					ready = 1;
			endGameAuthAndErrors(data.error, gameId, socket, player1, player2, scores, ball);
		}
		return ;
	});

	socket.addEventListener("close", () => {
		console.log("Cerrar conexion con websocket");
	});

	socket.addEventListener("error", (error) => {
		console.log("hay un error en el websocket=", error);
	});

	document.addEventListener("keydown", (event) => {
		const key = event.key;
		if (key === "ArrowUp")
		{
			up = 1;
			console.log("up");
		}
		if (key === "ArrowDown")
		{
			down = 1;
			console.log("down");
		}
		if (key === "w")
		{
			up = 1;
			console.log("w");
		}
		if (key === "s")
		{
			down = 1;
			console.log("s");
		}
	});
	document.addEventListener("keyup", (event) => {
		const key = event.key;
		if (key === "ArrowUp")
		{
			up = 0;
			console.log("up");
		}
		if (key === "ArrowDown")
		{
			down = 0;
			console.log("down");
		}
		if (key === "w")
		{
			up = 0;
			console.log("w");
		}
		if (key === "s")
		{
			down = 0;
			console.log("s");
		}
	})
}


export async function socketAndRender(player1: Player, player2: Player, scores: Score, ball: Ball, engine : Engine, scene : Scene)
{
	const params = new URLSearchParams(window.location.search);

	const id = params.get("id");
	if (!id)
	{
		showToast(t("NoGameId"), "error");
		console.warn(t("NoGameId"));
		navigateTo("dashboard", false, true);
	}
	conectWebSocket(Number(id), player1, player2, scores, ball, engine, scene);
}