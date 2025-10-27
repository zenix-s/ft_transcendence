import { showToast } from "@/components/toast";
import { actualizeValues } from "./game"
import type { Ball, Player, Score } from "./gameData";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { fetchGameAlreadyFinished } from "./getData";
import { modal } from "@/components/modal";
import { getWsUrl } from "@/api";

//import { fetchGameId, fetchSinglePlayerGameId, toJoinGame, fetchGameState } from "./getData.js";

interface message {
	action: number,
	gameId: number,
	token: string | null
}

// export function setAsReady(gameId: number)
// {
// 	const token = localStorage.getItem("access_token");
// 	let obj: message = {
// 		action: 4,
// 		gameId: gameId,
// 		token: token
// 	};
// 	socket.send(JSON.stringify(obj));
// }


export function conectWebSocket(gameId: number, player1: Player, player2: Player, scores: Score, ball: Ball)
{
	const token = localStorage.getItem("access_token");
	// const socket = new WebSocket("wss://localhost:3000/game/pong");
	console.log("ws=", getWsUrl("/game/pong"));
	const socket = new WebSocket(getWsUrl("/game/pong"));
	let pingInterval: ReturnType<typeof setInterval> | undefined;
	let up = 0;
	let down = 0;
	let	finBool = 0;
	
	socket.addEventListener("open", () => {
		console.log("conectado websockket");
		let obj : message = {
			action: 1,
			gameId:gameId,
			token: token
		};
		socket.send(JSON.stringify(obj));
		obj.action = 1;
		pingInterval = setInterval(() => {
			obj.action = 1;
		 	socket.send(JSON.stringify(obj));

			if (up == 1 && down == 0)
			{
				obj.action = 2;
				socket.send(JSON.stringify(obj));
			}
			if (down == 1 && up == 0)
			{
				obj.action = 3;
				socket.send(JSON.stringify(obj));
			}
  		}, 10);
	})

	socket.addEventListener("message", async (msg) => {
		console.log("mensaje recibido=", msg.data);
		let data = JSON.parse(msg.data);
		if (data.type ==  "gameState")
		{
			actualizeValues(data.state.player1.position, player1, data.state.player2.position, player2,
				data.state.player1.score, data.state.player2.score, scores,
				data.state.ball.position.x, data.state.ball.position.y, ball);

			if (data.state.isRunning == false && data.state.arePlayersReady == true)
			{
				clearInterval(pingInterval);
				pingInterval = undefined;
				showToast(t("noActiveGame"), "error");
				console.warn(t("noActiveGame"));
				navigateTo("dashboard");
			}
		}
		else if (data.type == "error") {
			if (data.error == "GameAlreadyFinished")
			{
				clearInterval(pingInterval);
				pingInterval = undefined;
				if (finBool == 0 && document.getElementById("gameCanvas") as HTMLCanvasElement)
				{
					let finished = await fetchGameAlreadyFinished(gameId);
					if (!finished)
					{
						showToast(t("GameError"));
						console.warn(t("GameError"));
						navigateTo("dashboard", false, true);
					}
					const score1 = finished.match.players[0].score;
					const score2 = finished.match.players[1].score;
					actualizeValues(50, player1, 50, player2, score1, score2, scores, 50, 50, ball);
					console.log("game = ", JSON.stringify(finished));
					const playerL = finished.match.players[0].userId;
					const playerR = finished.match.players[1].userId;
					let winner = 1;
					if (finished.match.players[1].isWinner == true)
						winner = 2;
					console.log("1=", playerL, " 2=", playerR, " 1=", score1, " 2=", score2, " winner=", winner);
					//navigateTo("dashboard", false, true);
					//await modal("gameFinished", finished.match.players[0], finished.match.players[1], "patata");
				}	
				finBool = 1;
				return ;
			}
			if (data.error == "GameNotFound")
			{
				showToast(t("GameNotFound"), "error");
				console.warn(t("GameNotFound"));
			}
			if (data.error == "noActiveGame")
			{
				showToast(t("noActiveGame"), "error");
				console.warn(t("noActiveGame"));
			}
			if (data.error == "notAuthenticated")
			{
				let obj : message = {
				action: 0,
				gameId:gameId,
				token: token
				};
				socket.send(JSON.stringify(obj));
				obj.action = 1;
				socket.send(JSON.stringify(obj));
				obj.action = 4;
				socket.send(JSON.stringify(obj));
			}
			else {
				clearInterval(pingInterval);
				pingInterval = undefined;
				console.warn(t("GameError"));
				//navigateTo("dashboard", false, true);
			}
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


export async function socketAndRender(player1: Player, player2: Player, scores: Score, ball: Ball)
{
	// const gameId = await fetchGameId();
	// if (!gameId)
	// {
	// 	console.log("No game ID");
	// 	return ;
	// }
	// console.log("si gameId=", gameId);

	// const gameJoin = await toJoinGame(gameSiglePlayerId);
	// if (!gameJoin)
	// {
	// 	console.log("No join game");
	// 	return ;
	// }
	// console.log("si gameJoin=", gameJoin);

	// const gameState = await fetchGameState(gameSiglePlayerId);
	// if (!gameState)
	// {
	// 	console.log("no gameState");
	// 	return ;
	// }
	// console.log("si gameState");

	const params = new URLSearchParams(window.location.search);
	const id = params.get("id");
	if (!id)
	{
		showToast(t("NoGameId"), "error");
		console.warn(t("NoGameId"));
		navigateTo("dashboard", false, true);
	}
	conectWebSocket(Number(id), player1, player2, scores, ball);
}