import { navigateTo } from "@/app/navigation";
import { fetchSinglePlayerGameId } from "./getData";
import { showToast } from "@/components/toast.js";
import { t } from "@/app/i18n";

export function ready1()
{
	const readyButton = document.getElementById("ready-button");

	readyButton?.addEventListener("click", async (event) => {
		event.preventDefault();

		const difficulty = (document.getElementById("difficultyAI") as HTMLSelectElement)?.value;
		const maxPoints = (document.getElementById("puntosMax") as HTMLSelectElement)?.value;
		const playerView = (document.getElementById("playerView") as HTMLSelectElement)?.value;
		if (!difficulty || !maxPoints || !playerView)
		{
			showToast(t("DiffAndMax"), "error");
			console.warn("DiffAndMax");
			navigateTo("dashboard", false, true);
			return ;
		}
		let AIdiff = 8;
		if (difficulty === "low")
			AIdiff = 6;
		else if (difficulty === "high")
			AIdiff = 10;
		const id = await fetchSinglePlayerGameId(Number(maxPoints), AIdiff);
		if (!id)
		{
			showToast(t("NoGameId"), "error");
			console.warn("NoGameId");
			navigateTo("dashboard", false, true);
			return ;
		}
		console.log("single player id =", id);
		navigateTo(`playing?id=${id}&singleplayer&view=${playerView}`);
	});
}
