import { DataTable } from "simple-datatables";
// import { getCurrentUser } from "@/modules/users";
// import { t } from "@/app/i18n";

interface Match {
  id: number;
  // player1: string;
  opponent: string;
  score: string;
  winner: string;
  date: string;
}

export async function loadMatchHistory() {
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
          <td class="px-4 py-2 text-gray-800 dark:text-gray-200 break-words">${match.opponent}</td>
          <td class="px-4 py-2 text-center text-gray-800 dark:text-gray-200 font-semibold">${match.score}</td>
          <td class="px-4 py-2 text-center text-green-600 dark:text-green-400 break-words">${match.winner}</td>
          <td class="px-4 py-2 text-right text-gray-500 dark:text-gray-400">
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
    new DataTable("#matchTable", {
      perPage: 5,
      perPageSelect: [5, 10, 20],
      searchable: false,
      sortable: false,
      labels: {
        placeholder: "Buscar...",
        //perPage: "{select} por página",
        perPage: "por página",
        noRows: "No hay partidas registradas",
        info: "Mostrando {start} a {end} de {rows} partidas",
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

