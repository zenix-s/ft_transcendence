import { navigateTo } from "@/app/navigation";
import { modal } from "@/components/modal";
import { wsClient } from "@/modules/users";

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
      const confirmed = await modal("logout");
      if (confirmed)
      {
        if (wsClient) {
          wsClient.disconnect();
      }
        localStorage.removeItem("access_token");
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
}