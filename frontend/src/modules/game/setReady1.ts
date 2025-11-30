import { navigateTo } from "@/app/navigation";
import { fetchSinglePlayerGameId } from "./getData";
import { showToast } from "@/components/toast.js";
import { t } from "@/app/i18n";
import { GameDifficulty } from "@/types/gameOptions"
import { createGameSocket } from "./gameSocket";
import { updateSliders } from "@/components/updateSliders";

export function ready1()
{
	updateSliders();
	const readyButton = document.getElementById("ready-button");

	readyButton?.addEventListener("click", async (event) => {
		event.preventDefault();

		const difficulty = (document.querySelector("input[name='diff-radio']:checked") as HTMLInputElement)?.value;
		const maxPoints = (document.getElementById("points-range") as HTMLInputElement)?.value;
		const maxTime = (document.getElementById("time-range") as HTMLInputElement)?.value;
		const playerView = (document.querySelector("input[name='mode-radio']:checked") as HTMLInputElement)?.value;

		if (!difficulty || !maxPoints || !playerView)
		{
			showToast(t("DiffAndMax"), "error");
			console.warn("DiffAndMax");
			navigateTo("dashboard", false, true);
			return ;
		}
		let AIdiff = GameDifficulty.NORMAL;
		if (difficulty === "easy")
			AIdiff = GameDifficulty.EASY;
		else if (difficulty === "hard")
			AIdiff = GameDifficulty.HARD;
		const id = await fetchSinglePlayerGameId(Number(maxPoints), AIdiff, Number(maxTime));
		if (!id)
		{
			showToast(t("NoGameId"), "error");
			console.warn("NoGameId");
			navigateTo("dashboard", false, true);
			return ;
		}
		const token = localStorage.getItem("access_token");
		createGameSocket(token, id);

		console.log("single player id =", id);
		navigateTo(`playing?id=${id}&singleplayer&view=${playerView}`);
	});
}
