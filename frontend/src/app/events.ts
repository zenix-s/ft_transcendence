import { navigateTo } from "@/app/navigation";
import { t } from "@/app/i18n";

/**
 * The `setupEventListeners` function adds event listeners for click and popstate events to handle
 * navigation and user login functionality.
 */

let avatarNumber = 1;

export function setupEventListeners() {
  // Listeners de navegación
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

    // Avatar selection
    const avatarSelector = document.getElementById("avatarSelector") as HTMLImageElement;
    //const leftArrow = document.getElementById("leftArrow");
    //const rightArrow = document.getElementById("rightArrow");
    //const updateAvatar = document.getElementById("updateAvatar");

    if (target.closest("#leftArrow"))
    {
      if (avatarNumber === 1)
        avatarNumber = 10;
      else
        avatarNumber--;
      avatarSelector.src = "/images/avatar" + avatarNumber + ".jpg";
      return;
    }
    if (target.closest("#rightArrow"))
    {
      if (avatarNumber === 10)
        avatarNumber = 1;
      else
        avatarNumber++;
      avatarSelector.src = "/images/avatar" + avatarNumber + ".jpg";
      return;
    }
    if (target.closest("#updateAvatar"))
    {
      event.preventDefault();
      console.log("Avatar SRC to send: ");
      console.log("/images/avatar" + avatarNumber + ".jpg");
    }

  });

  /* window.addEventListener("popstate", () => {
    const page = location.pathname.replace("/", "") || "home";
    navigateTo(page);
  }); */
}