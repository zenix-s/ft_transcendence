import { navigateTo } from "@/app/navigation";
import { fetchGameState, fetchSinglePlayerGameId } from "./getData";
import { showToast } from "@/components/toast.js";

export function ready1()
{
	const readyButton = document.getElementById("ready-button");

	readyButton?.addEventListener("click", async (event) => {
		event.preventDefault();

		const difficulty = (document.getElementById("difficultyAI") as HTMLSelectElement)?.value;
		const maxPoints = (document.getElementById("puntosMax") as HTMLSelectElement)?.value;
		if (!difficulty || !maxPoints)
		{
			showToast(t("DiffAndMax"), "error");
			console.warn("DiffAndMax");
			navigateTo("dashboard");
			return ;
		}
		const id = await fetchSinglePlayerGameId(Number(maxPoints), Number(difficulty));
		if (!id)
		{
			showToast(t("NoGameId"), "error");
			console.warn("NoGameId");
			navigateTo("dashboard");
			return ;
		}
		console.log("single player id =", id);
		const gameState = await fetchGameState(id);
		if (!gameState)
		{
			showToast(t("GameState"), "error");
			console.warn("GameState");
			navigateTo("dashboard");
			return ;
		}
		console.log("si gameState");
		navigateTo(`game?id=${id}&singlePlayer=true&mutiPlayer=false`);
	});
}
