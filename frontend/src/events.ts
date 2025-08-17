import { navigateTo } from "./navigation";
import { loadUsers } from "./users";

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
  });

  window.addEventListener("popstate", () => {
    const page = location.pathname.replace("/", "") || "home";
    navigateTo(page);
  });
}