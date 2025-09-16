import { navigateTo } from "@/app/navigation";
import { loadUsers } from "@/modules/users";

/**
 * The `setupEventListeners` function adds event listeners for click and popstate events to handle
 * navigation and user login functionality.
 */
export function setupEventListeners() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.dataset.page) {
      event.preventDefault();
      navigateTo(target.dataset.page!);
    }

    if (target.dataset.page === "login") {
      loadUsers();
    }

    if (target.dataset.page === "logout") {
      localStorage.removeItem("access_token");
      console.log("Token eliminado");
      navigateTo("login");
    }
  });

 /*  window.addEventListener("popstate", () => {
    const page = location.pathname.replace("/", "") || "home";
    navigateTo(page);
  }); */
}