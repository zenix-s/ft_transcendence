import { showToast } from "@/components/toast";
import { fetchGameAlreadyFinished } from "./getData";
import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { renderValues } from "./playing";
import type { Ball, Player, Score } from "./gameData";
import { modal } from "@/components/modal";

interface message {
	action: number,
	gameId: number,
	token: string | null
}

// function startCountdown(seconds: number): Promise<void> {
// 	return new Promise((resolve) => {
// 		let counter = seconds;
// 		const interval = setInterval(() => {
// 			console.log(`Starting in ${counter}...`);
// 			counter--;
// 			if (counter < 0) {
// 				clearInterval(interval);
// 				resolve();
// 			}
// 		}, 1000);
// 	});
// }

async function authorization(gameId: number, socket:WebSocket)
{
	const token = localStorage.getItem("access_token");
	const userConfirmed = await modal({
			type: "gameFinished"});

	// If user canceled, stop everything
	if (!userConfirmed)
	{
		console.log("User canceled");
		navigateTo("dashboard", false, true);
		return;
	}
	const obj : message = {
		action: 0,
		gameId:gameId,
		token: token
		};
		socket.send(JSON.stringify(obj));
		// METER AQUI LA CUENTA ATRÁS
		//await startCountdown(3); // wait 3 seconds before continuing
		obj.action = 1;
		socket.send(JSON.stringify(obj));
		obj.action = 4;
		socket.send(JSON.stringify(obj));
}

async function endGame(finBool:number, gameId:number,
	player1:Player, player2:Player, scores:Score, ball:Ball)
{
	if (finBool == 0 && document.getElementById("gameCanvas") as HTMLCanvasElement)
	{
		const finished = await fetchGameAlreadyFinished(gameId);
		if (!finished)
		{
			showToast(t("GameError"));
			console.warn(t("GameError"));
			navigateTo("dashboard", false, true);
		}
		const score1 = finished.match.players[0].score;
		const score2 = finished.match.players[1].score;
		renderValues(50, player1, 50, player2, score1, score2, scores, 50, 50, ball);
		console.log("game = ", JSON.stringify(finished));
		const playerL = finished.match.players[0].userId;
		const playerR = finished.match.players[1].userId;
		let winner = 1;
		if (finished.match.players[1].isWinner == true)
			winner = 2;
		console.log("1=", playerL, " 2=", playerR, " 1=", score1, " 2=", score2, " winner=", winner);
		navigateTo("dashboard", false, true);
		await modal({
			type: "gameFinished",
			player1Score: finished.match.players[0].score,
			player2Score: finished.match.players[1].score,
			winner: finished.match.winner.username});
	}
}

export async function endGameAuthAndErrors(data: string, gameId:number, socket:WebSocket,
	player1:Player, player2:Player, scores:Score, ball:Ball)
{
	let finBool = 0;

	if (data == "GameAlreadyFinished")
	{
		endGame(finBool, gameId, player1, player2, scores, ball);
		finBool = 1;
		return;
	}
	if (data == "GameNotFound")
		return ;
	if (data == "noActiveGame")
	{
		showToast(t("noActiveGame"), "error");
		console.warn(t("noActiveGame"));
	}
	if (data == "UnauthorizedAccess")
	{
		authorization(gameId, socket);
	}
	else {
		console.warn(t("GameError"));
		navigateTo("dashboard", false, true);
	}
}