import { DataTable } from "simple-datatables";
// import { getCurrentUser } from "@/modules/users";
import { t, updateTexts } from "@/app/i18n";
import { getCurrentUser, getHistory } from "@/modules/users";

// Jugador dentro de un Match
interface Player {
  userId: number;
  username: string;
  score: number;
  isWinner: boolean;
}

// Cada Match
interface Match {
  id: number;
  gameTypeId: number;
  status: string;
  startedAt: string; // o Date si luego lo parseas
  createdAt: string;
  players: Player[];
}

// Respuesta completa del backend
interface MatchesResponse {
  matches: Match[];
  total: number;
}

export let matchTable: DataTable; // Variable global o de módulo

export async function loadMatchHistory(perPage: number = 5) {
  try {
    // 1. Fetch al backend
    const response = await getHistory();
    if (!response || !response.ok) throw new Error("Error al cargar el historial");

    const data: MatchesResponse = await response.json();

    // Obtener el jugador actual
    const currentUser = await getCurrentUser();

    // 2. Insertar datos en el tbody
    const tbody = document.querySelector<HTMLTableSectionElement>("#matchTable tbody")!;
    tbody.innerHTML = data.matches
      .map((match) => {
        // El oponente es "el otro" jugador
        const opponent = match.players.find(p => p.userId !== currentUser.user.id)?.username ?? "N/A";
        const score = match.players.map(p => p.score).join(" - ");
        const winner = match.players.find(p => p.isWinner)?.username ?? "-";

        return `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td data-label="" data-i18n="opponent" class="px-4 py-2 text-center text-primary sm:text-gray-800 sm:dark:text-gray-200 font-light whitespace-nowrap">${opponent}</td>
            <td data-label="" data-i18n="result" class="px-4 py-2 text-center text-primary sm:text-gray-800 sm:dark:text-gray-200 font-light whitespace-nowrap">${score}</td>
            <td data-label="" data-i18n="winner" class="px-4 py-2 text-center text-green-600 dark:text-green-400 whitespace-nowrap">${winner}</td>
            <td data-label="" data-i18n="date" class="px-4 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">
              ${new Date(match.startedAt).toLocaleString("es-ES", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </td>
          </tr>
        `;
      })
      .join("");

    // 3. Inicializar la tabla con paginación
    matchTable  = new DataTable("#matchTable", {
      perPage: perPage,
      perPageSelect: [5, 10, 20],
      searchable: false,
      sortable: false,
      labels: {
        placeholder: t("search"),
        //perPage: "{select} por página",
        perPage: t("perPage"),
        noRows: t("noGames"),
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
    console.log("Updating history language");
    updateTexts();

  } catch (error) {
    console.error(error);
  }
}

