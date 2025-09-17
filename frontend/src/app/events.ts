import { navigateTo } from "@/app/navigation";
import { loadUsers } from "@/modules/users";
import { t } from "@/app/i18n";

/**
 * The `setupEventListeners` function adds event listeners for click and popstate events to handle
 * navigation and user login functionality.
 */
export function setupEventListeners() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    // 🔹 1. Caso especial: LOGOUT
    if (target.dataset.page === "logout") {
      event.preventDefault(); // Frena navegación automática
      const confirmed = confirm(t("logout_confirm"));
      if (!confirmed) return;

      localStorage.removeItem("access_token");
      console.log(t("token_removed")); // 
      navigateTo("login");
      return; // Muy importante: evita seguir ejecutando el resto del handler
    }

    // 🔹 2. Caso LOGIN
    if (target.dataset.page === "login") {
      event.preventDefault(); // Frena navegación automática
      const token = localStorage.getItem("access_token");

      if (!token) {
        loadUsers();
        navigateTo("login");
        return;
      } else {
        navigateTo("dashboard");
        return;
      }
    }

    // 🔹 3. Navegación genérica
    if (target.dataset.page) {
      event.preventDefault();
      navigateTo(target.dataset.page!);
    }

  });

 /*  window.addEventListener("popstate", () => {
    const page = location.pathname.replace("/", "") || "home";
    navigateTo(page);
  }); */
}