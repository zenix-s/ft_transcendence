import { DataTable } from "simple-datatables";
import { t, updateTexts } from "@/app/i18n";
import { getCurrentUser } from "@/modules/users";
import type { User } from "@/types/user";
import { apiUrl } from "@/api";

// Configuración de las partidas dentro de un torneo
interface MatchSettings {
  maxScore: number;
  maxGameTime: number;
}

// Cada Torneo
interface Tournament {
  id: number;
  name: string;
  matchTypeId: number;
  status: string;
  createdAt: string;
  participantCount: number;
  matchSettings: MatchSettings;
}

// Respuesta completa del backend
interface TournamentsResponse {
  tournaments: Tournament[];
  total: number;
}

export let tournamentTable: DataTable; // Variable global o de módulo

export async function loadTournamentsHistory(user?: User, perPage: number = 5) {
  try {
    // Si no recibo un user se lo solicito a getCurrentUser()
    if (!user) {
      const userResponse = await getCurrentUser();
      if (!userResponse) return;
      user = userResponse.user;
    }

    // Obtener el jugador actual
    //const currentUser: User = user;

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
        const game = (tournament.matchTypeId === 3) ? "Pong" : t("rps");
        const points = tournament.matchSettings.maxScore ?? "-";
        const time = tournament.matchSettings.maxGameTime ?? "-";
        const registered = tournament.participantCount;
        const participation = tournament.participantCount; // Temporalmente
        

        return `
          <tr class="${rowClass}">
            <td data-label="" data-i18n="name" class="sm:truncate sm:max-w-[130px] px-4 py-2 text-center font-light whitespace-nowrap">${name}</td>
            <td data-label="" data-i18n="game" class="px-4 py-2 text-center font-light whitespace-nowrap">${game}</td>
            <td data-label="" data-i18n="points" class="px-4 py-2 text-center font-light whitespace-nowrap">${points}</td>
            <td data-label="" data-i18n="time" class="px-4 py-2 text-center font-light whitespace-nowrap">${time}</td>
            <td data-label="" data-i18n="registered" class="px-4 py-2 text-center font-light whitespace-nowrap">${registered}</td>
            <td data-label="" data-i18n="participation" class="px-4 py-2 text-center font-light whitespace-nowrap">${participation}</td>
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
    return await fetch(apiUrl(`/tournaments/pong/active`), {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error("Error fetching tournaments:", err);
    return null;
  }
}

