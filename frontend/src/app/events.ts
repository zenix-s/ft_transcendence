import { navigateTo } from "@/app/navigation";
import { applySavedColors } from "@/components/colorPicker";
import { modal } from "@/components/modal";
import { refreshTournamentsHistory } from "@/components/tournamentsHistory";
import { destroySocialSocket } from "@/modules/social/socketInstance";

/**
 * The `setupEventListeners` function adds event listeners for click and popstate events to handle
 * navigation and user login functionality.
 */
export function setupEventListeners() {
  // Listeners de navegación
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    // 🔹 1. Caso especial: LOGOUT
    if (target.dataset.page === "logout") {
      event.preventDefault(); // Frena navegación automática
      const confirmed = await modal({type: "logout"});
      if (confirmed)
      {
        localStorage.removeItem("userId");
        localStorage.removeItem("color_primary");
        localStorage.removeItem("color_secondary");
        destroySocialSocket(); // Desconectar y limpiar el WebSocket
        localStorage.removeItem("access_token");

        // Forzar colores por defecto
        applySavedColors();

        navigateTo("login");
      }
      return;
    }

    // 🔹 2. Caso LOGIN (redirige a dashboard si ya hay token)
    if (target.dataset.page === "login") {
      event.preventDefault(); // Frena navegación automática
      // Si hay token, navega directo a dashboard
      if (localStorage.getItem("access_token")) {
        navigateTo("dashboard");
      } else {
        navigateTo("login");
      }
      return;
    }

    if (target.closest(".datatable-pagination a")) {
      event.preventDefault();            // evita que siga el enlace
      event.stopPropagation();           // Detiene la propagación hacia otros listeners
      event.stopImmediatePropagation();  // frena Simple-Datatables y otros listeners
      return;
    }

    // 🔹 3. Navegación genérica
    if (target.dataset.page) {
      event.preventDefault();
      navigateTo(target.dataset.page!);
      return;
    }
  });

  // Listener para el botón de refresh de torneos
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.id === "refreshTournamentsBtn") {
      refreshTournamentsHistory();
    }
  });
}

