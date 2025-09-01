import {loadUsers, setupRegisterForm, validateLogin } from "./users";
import { renderButtons } from "./main";

export async function navigateTo(page: string) {
  console.log("navigation");
  console.log(page);
  // Actualizar la URL sin recargar la página
  history.pushState({}, "", `/${page}`);

  // Cargar el contenido de la página
  const response = await fetch(`/src/pages/${page}.html`);
  const html = await response.text();

  const app = document.getElementById('app')!;
  app.innerHTML = html;

  // Ejecutar solo los <script> inline (sin src) que vinieron en la página cargada.
  // Evitamos volver a cargar scripts type="module" con src (como /src/main.ts).
  const scripts = Array.from(app.querySelectorAll('script'));
  for (const s of scripts) {
    if (!s.src) {
      const inline = document.createElement('script');
      inline.textContent = s.textContent || '';
      // opcional: transferir type si existe (por ejemplo text/javascript)
      if (s.type) inline.type = s.type;
      document.head.appendChild(inline);
      document.head.removeChild(inline);
    }
  }
	if (page === "home") {
	  loadUsers();
    renderButtons();
	}
  if (page === "login") {
    validateLogin();
    setupRegisterForm();
  }

  // Cada vez que la página en la que estemos sea game, se ejecuta el script
  if (page === "game") {
    import("./game").then(module => {
      requestAnimationFrame(() => {
        module.startGame();
      });
    });
  }
}

export function handlePopState() {
  const page = location.pathname.replace("/", "") || "home";
  navigateTo(page);
}