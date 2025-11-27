import { DataTable } from "simple-datatables";
import { t, updateTexts } from "@/app/i18n";
import { apiUrl } from "@/api";
import { showToast } from "./toast";

// Configuración de las partidas dentro de un torneo
interface MatchSettings {
  maxScore: number;
  maxGameTime: number;
  visualStyle: string;
}

// Cada Torneo
interface Tournament {
  id: number;
  name: string;
  matchTypeId: number;
  status: string;
  createdAt: string;
  participantCount: number;
  isRegistered: boolean;
  matchSettings: MatchSettings;
}

// Respuesta completa del backend
interface TournamentsResponse {
  tournaments: Tournament[];
  total: number;
}

export let tournamentTable: DataTable; // Variable global o de módulo

export async function loadTournamentsHistory(perPage:number = 5) {
  try {
    // 1. Fetch al backend
    const activeTournaments = await getActiveTournaments();
    if (!activeTournaments || !activeTournaments.ok) throw new Error(t("errorLoadingHistory"));

    const activeTournamentsData: TournamentsResponse = await activeTournaments.json();
    console.log(activeTournamentsData); // DB
    //return; // DB

    // 2. Insertar datos en el tbody
    const tbody = document.querySelector<HTMLTableSectionElement>("#tournamentsTable tbody")!;
    console.log("TORNEOS RECIBIDOS:", activeTournamentsData.tournaments); // DB

    // DB
    activeTournamentsData.tournaments.forEach(t => {
      console.log("matchSettings de torneo", t.id, ":", t.matchSettings);
    });

    tbody.innerHTML = activeTournamentsData.tournaments
      .map((tournament, i) => {
        const rowClass = i % 2 === 0 ? "bg-gray-900 text-primary sm:hover:bg-gray-700 transition-all duration-300 ease-in-out" : "text-primary sm:text-secondary dark:text-primary sm:hover:bg-gray-200 dark:sm:hover:bg-gray-800 transition-all duration-300 ease-in-out";
        const name = tournament.name;
        const game = (tournament.matchTypeId >= 1 && tournament.matchTypeId <= 3) ? "Pong" : t("rps");
        const points = tournament.matchSettings.maxScore ?? "-";
        const time = tournament.matchSettings.maxGameTime ?? "-";
        const registered = tournament.participantCount;
        //const participation = tournament.participantCount; // Temporalmente
        

        return `
          <tr class="${rowClass}">
            <td data-label="" data-i18n="name" class="sm:truncate sm:max-w-[130px] px-4 py-2 text-center font-light whitespace-nowrap">${name}</td>
            <td data-label="" data-i18n="game" class="px-4 py-2 text-center font-light whitespace-nowrap">${game}</td>
            <td data-label="" data-i18n="points" class="px-4 py-2 text-center font-light whitespace-nowrap">${points}</td>
            <td data-label="" data-i18n="time" class="px-4 py-2 text-center font-light whitespace-nowrap">${time}</td>
            <td data-label="" data-i18n="registered" class="px-4 py-2 text-center font-light whitespace-nowrap">${registered}</td>
            <td data-label="" data-i18n="participation" class="px-4 py-2 text-center font-light whitespace-nowrap">${getParticipationButton(tournament.isRegistered, tournament.id)}</td>
          </tr>
        `;
      })
      .join("");

    // 3. Inicializar la tabla con paginación
    tournamentTable  = new DataTable("#tournamentsTable", {
      perPage: perPage,
      perPageSelect: [5, 10, 20],
      searchable: false,
      sortable: false,
      labels: {
        placeholder: t("search"),
        //perPage: "{select} por página",
        perPage: t("perPage"),
        noRows: t("noTournaments"),
        //info: "Mostrando {start} a {end} de {rows} partidas",
        //info: "t('showing')" + " {start} " + "t('to')" + " {end} " + "t('of')" + " {rows} " + "t('games')",
        //info: `t('showing')` + {start} + "t('to')" + " {end} " + "t('of')" + " {rows} " + t('games')`,
        //info: "{start} - {end} (total: {rows})",
        info: t("showing") + " {start} " + t("to") + " {end} " + t("of") + " {rows} " + t("games")
      }
    });

    // ⏳ Dejamos que DataTable genere sus elementos
    setTimeout(() => {
        const top = document.querySelector(".dataTable-top");
        if (top && !document.getElementById("refreshTournamentsBtn")) {
            const btn = document.createElement("button");
            btn.id = "refreshTournamentsBtn";
            btn.textContent = "Refresh";
            btn.className =
                "bg-blue-600 hover:bg-blue-800 text-white font-bold py-1 px-3 rounded ml-3";

            btn.addEventListener("click", () => refreshTournamentsHistory());

            top.appendChild(btn);
        }
    }, 50); // 50ms es suficiente

    // 4. Ajustar enlaces de paginación (AHORA que existen)
    document.querySelectorAll(".datatable-pagination a").forEach(link => {
      link.setAttribute("href", "#");
    });

    // 5. Traducir las celdas recién insertadas
    updateTexts();

  } catch (error) {
    console.error(error);
  }
}

/* TOURNAMENTS-HISTORY */
export async function getActiveTournaments() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    return await fetch(apiUrl(`/tournaments/pong/active?limit=50&offset=0`), {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    return null;
  }
}

// Bóton de unir o abandonar para la columna participation de la tabla de torneos dependiendo de isRegistered
export function getParticipationButton(isRegistered: boolean, tournamentId: number): string {
  console.log(`Tournament ID: ${tournamentId}, isRegistered: ${isRegistered}`); // DB
  if (isRegistered) {
    return `<button data-tournamentId="${tournamentId}" class="bg-red-600 hover:bg-red-800 text-white font-bold py-1 px-2 rounded transition-all duration-300 ease-in-out participation-btn" data-i18n="leave">Leave</button>`;
  } else {
    return `<button data-tournamentId="${tournamentId}" class="bg-green-600 hover:bg-green-800 text-white font-bold py-1 px-2 rounded transition-all duration-300 ease-in-out participation-btn" data-i18n="join">Join</button>`;
  }
}

export async function handleParticipationAction(target: HTMLElement) {
  const tournamentId = target.dataset.tournamentid;
  const action = target.dataset.i18n; // "join" o "leave"

  if (!tournamentId || !action) return;

  console.log("Tournament ID:", tournamentId, "action:", action); // DB

  try {
    const response = await fetch(apiUrl(`/tournaments/pong/tournaments/${tournamentId}/${action}`), {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const errorcode = data.error;
        if (errorcode === "InvalidRequest")
            showToast(t("ParticipantAdditionError"), "error");
        else
            showToast(t(errorcode), "error");
        return;
    }

    // Mensaje de éxito dinámico (Join/Leave)
    if (action === "join") {
          showToast(t("ParticipationSuccess")); // Asumo que tienes una clave para 'Se ha unido al torneo'
    } else if (action === "leave") {
          showToast(t("LeaveSuccess")); // Asumo que tienes una clave para 'Ha abandonado el torneo'
    } else {
          showToast(t("InvitationSentSuccessfully")); // Mensaje genérico de éxito
    }

    // Recargar tabla
    await refreshTournamentsHistory();

  } catch {
      showToast(t("NetworkOrServerError"), "error");
  }
}

export async function refreshTournamentsHistory(perPage: number = 5) {
  try {
    // Destruir la tabla existente si ya fue inicializada
    if (tournamentTable) {
      tournamentTable.destroy();
    }
    else {
      console.warn("tournamentTable no estaba inicializada al refrescar."); // DB
      return;
    }
    // Recargar la historia de torneos
    await loadTournamentsHistory(perPage);
  } catch (error) {
    console.error(error);
  }
}

