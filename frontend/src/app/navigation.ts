import { setupRegisterForm, validateLogin, loadDashboard } from "@/modules/users";
import { renderButtons } from "@/app/main";
import { updateTexts } from "@/app/i18n";
import { loadChart } from "@/components/graph"
import { startGame } from "@/modules/game/game.ts";

export async function navigateTo(page: string, skipPushState = false, replace = false) {
  console.log("navigation");
  console.log(page);

  // Redirección automática si el usuario ya tiene token y entra a login
  if (page === "login" && localStorage.getItem("access_token")) {
    navigateTo("dashboard", false, true);
    return;
  }

  // Actualizar la URL sin recargar la página
  if (!skipPushState) {
     if (replace) {
      history.replaceState({}, "", `/${page}`); // sustituye la entrada actual
    } else {
      history.pushState({}, "", `/${page}`); // añade nueva entrada
    }
  }

  // Cargar el contenido de la página
  const response = await fetch(`/src/pages/${page}.html`);
  const html = await response.text();

    // ⚠️ Detectar si el servidor devolvió el index.html en lugar de la página real
  // Normalmente index.html contiene <!doctype html> y un <div id="app">
  const isFallbackIndex = html.includes("<!DOCTYPE html") && html.includes('<div id="app"');

  if (isFallbackIndex) {
    console.warn(`Página "${page}" no existe, mostrando 404`);
    navigateTo("404", true);
    return ;
  }

  const app = document.getElementById('app')!;
  app.innerHTML = html;

  // Ejecutar solo los <script> inline (sin src)
  Array.from(app.querySelectorAll('script')).forEach(s => {
    if (!s.src) {
      const inline = document.createElement('script');
      inline.textContent = s.textContent || '';
      // opcional: transferir type si existe (por ejemplo text/javascript)
      if (s.type) inline.type = s.type;
      document.head.appendChild(inline);
      document.head.removeChild(inline);
    }
  });

  // Inicialización por página
  switch (page) {
    case "home":
      renderButtons();
      break;
    case "login":
      validateLogin();
      setupRegisterForm();
      break;
    case "dashboard":
      requestAnimationFrame(() => {
        loadDashboard();
        loadChart();
        renderButtons();
      });
      break;
    case "game":
      startGame();
      break;
    case "404":
      renderButtons();
      break;
  }
	/* if (page === "home") {
	  //loadUsers();
    renderButtons();
	}
  else if (page === "login") {
    const token = localStorage.getItem("access_token");

      if (!token) {
        // El usuario NO está logueado → cargar el login normalmente
        validateLogin();
        setupRegisterForm();
      }
  }
  else if (page === "dashboard") {
    // Esperar al siguiente ciclo para asegurar que el DOM ya está disponible
    requestAnimationFrame(() => {
      loadDashboard();
      loadChart();
      renderButtons();
    });
  }
  // Cada vez que la página en la que estemos sea game, se ejecuta el script
  else if (page === "game") {
    startGame();
  }
  else if (page === "404") {
    renderButtons();
	}  */

  // Actualizar los textos al cambiar de página
  updateTexts();
}

export function handlePopState() {
  const page = location.pathname.replace("/", "") || "home";
  navigateTo(page, true);
}