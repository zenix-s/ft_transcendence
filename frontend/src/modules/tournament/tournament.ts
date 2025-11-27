import { apiUrl } from "@/api";
import { t } from "@/app/i18n";
import { renderButtons } from "@/app/main";
import { navigateTo } from "@/app/navigation";
import { countInputLenght } from "@/components/inputCounter";
import { showToast } from "@/components/toast";
import { updateSliders } from "@/components/updateSliders";

export async function tournament() {
	renderButtons();
	updateSliders();

	// Si no hay formulario, createTournament devuelve null/rechaza
	const tournamentId = await createTournament();
	console.log("ID:", tournamentId); // DB
	if (tournamentId === null)
		console.warn(t("ErrorCreatingTournament"));
	else {
		//showToast(t("JoinedTournamentSuccessfully")); // DB
		console.log(`Unido al torneo con id ${tournamentId}`); // DB
		//await joinTournament(tournamentId); // En principio no es necesario porque ya se une automáticamente
	}
}

/* CREATE NEW TOURNAMENT */
export async function createTournament(): Promise<number> {
	return new Promise((resolve, reject) => {
		const tournamentForm = document.getElementById("tournamentForm") as HTMLFormElement;
		if (!tournamentForm) {
			console.warn("Tournament creation form not found"); // DB
			reject("Form not found");
			return;
		}

		// Char counter
		const tournamentInput = tournamentForm.querySelector<HTMLInputElement>('input[name="tournament-name"]');
		countInputLenght(tournamentInput);

		tournamentForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const formData = new FormData(tournamentForm);
			const tournamentname = formData.get("tournament-name") as string;
			const points = Number(formData.get("points-range")) as number;
			const time = Number(formData.get("time-range")) as number;
			const mode = (formData.get("mode-radio") as string).toLowerCase();

			/* Validate all fields are filled */
			if (!tournamentname || isNaN(points) || isNaN(time) || !mode) {
				showToast(t("fillAllFields"), "error");
				return;
			}

			/* Validate Tournament Name (Regular expresion)
			3-40 characters
			Only letters, numbers, hyphens, and underscores
			*/
			const usernameRegex = /^[a-zA-Z0-9_-]{3,40}$/;
			if (!usernameRegex.test(tournamentname)) {
				showToast(t("invalidTournamentName"), "error");
				return;
			}

			/* This block of code is handling the registration process for a new user. Here's a breakdown of
			what it does: */
			try {
				const response = await fetch(apiUrl(`/tournaments/pong`), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
					},
					body: JSON.stringify({
						name: tournamentname,
						matchSettings: {
							maxScore: points,
							maxGameTime: time,
							visualStyle: mode,
						},
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					const errorcode = data.error || "ErrorCreatingTournament";
					showToast(t(errorcode), "error");
					return;
				}

				// Conectar WebSocket ??
				/* const token = localStorage.getItem("access_token") || "";
				createTournamentSocket(token); */

				showToast(t("TournamentCreatedSuccessfully"));
				console.log(`Torneo creado con nombre ${tournamentname}, a ${points} puntos, ${time}s y en ${mode}.`); // DB
				tournamentForm.reset();

				// Redirigir al dashboard
				navigateTo("dashboard");

				// ✅ Devolver el id del torneo recibido
				const tournamentId = data.tournamentId;
				resolve(tournamentId);

			} catch (err) {
				showToast(t("NetworkOrServerError"), "error");
				reject(err);
			}
		});
	});
}

export async function joinTournament(tournamentId: number) {
	console.log(tournamentId);
	try {
		const response = await fetch(apiUrl(`/tournaments/pong/tournaments/${tournamentId}/join`), {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			const errorcode = data.error || "ErrorJoiningTournament";
			showToast(t(errorcode), "error");
			return;
		}

		// Conectar al WebSocket del torneo
		/* const token = localStorage.getItem("access_token") || "";
		createTournamentSocket(token); */

		showToast(t("JoinedTournamentSuccessfully"));
		console.log(`Unido al torneo con id ${tournamentId}`); // DB

		return;
	} catch {
		showToast(t("ErrorJoiningTournament"), "error");
		return;
	}
}
