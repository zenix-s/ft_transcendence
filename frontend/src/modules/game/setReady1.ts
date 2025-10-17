import { navigateTo } from "@/app/navigation";
import { fetchGameState, fetchSinglePlayerGameId } from "./getData";

export function ready1()
{
	const readyButton = document.getElementById("ready-button");

	readyButton?.addEventListener("click", async (event) => {
		event.preventDefault();

		const difficulty = (document.getElementById("difficultyAI") as HTMLSelectElement)?.value;
		const maxPoints = (document.getElementById("puntosMax") as HTMLSelectElement)?.value;
		if (!difficulty || !maxPoints)
		{
			console.log("problemas");
			return ;
		}
		const id = await fetchSinglePlayerGameId(Number(maxPoints), Number(difficulty));
		if (!id)
		{
			console.log("No single-player id");
			return ;
		}
		console.log("single player id =", id);
		const gameState = await fetchGameState(id);
		if (!gameState)
		{
			console.log("no gameState");
			return ;
		}
		console.log("si gameState");
		navigateTo(`game?id=${id}&singlePlayer`);
	});
}
