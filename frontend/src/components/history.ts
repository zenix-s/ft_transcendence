import { DataTable } from "simple-datatables";
// import { getCurrentUser } from "@/modules/users";
import { t } from "@/app/i18n";

interface Match {
  id: number;
  // player1: string;
  opponent: string;
  score: string;
  winner: string;
  date: string;
}

export let matchTable: DataTable; // Variable global o de módulo

export async function loadMatchHistory(perPage: number = 5) {
  try {
    /* const resp = await getCurrentUser();
    if (!resp) {
      console.warn(t("UserNotFound"));
      return;
    } */

    // 1. Fetch al backend
    const response = await fetch("/history.json");
    if (!response.ok) throw new Error("Error al cargar el historial");

    const data: Match[] = await response.json();

    // 2. Insertar datos en el tbody
    const tbody = document.querySelector<HTMLTableSectionElement>("#matchTable tbody")!;
    tbody.innerHTML = data
      .map(
        (match) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
          <!-- <td class="px-4 py-2 text-gray-800 dark:text-gray-200">${match.player1}</td> -->
          <td data-label="Opponent" class="px-4 py-2 text-center text-primary sm:text-gray-800 sm:dark:text-gray-200 font-light whitespace-nowrap">${match.opponent}</td>
          <td data-label="Resultado" class="px-4 py-2 text-center text-primary sm:text-gray-800 sm:dark:text-gray-200 font-light whitespace-nowrap">${match.score}</td>
          <td data-label="Ganador" class="px-4 py-2 text-center text-green-600 dark:text-green-400 whitespace-nowrap">${match.winner}</td>
          <td data-label="Fecha" class="px-4 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">
            ${new Date(match.date).toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </td>
        </tr>
      `
      )
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

  } catch (error) {
    console.error(error);
  }
}

