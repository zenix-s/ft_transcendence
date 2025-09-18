import { navigateTo } from "@/app/navigation";
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
      if (confirm(t("logout_confirm"))) {
        localStorage.removeItem("access_token");
        console.log(t("token_removed"));
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

    // 🔹 3. Navegación genérica
    if (target.dataset.page) {
      event.preventDefault();
      navigateTo(target.dataset.page!);
      return;
    }

  });

  /* window.addEventListener("popstate", () => {
    const page = location.pathname.replace("/", "") || "home";
    navigateTo(page);
  }); */
}