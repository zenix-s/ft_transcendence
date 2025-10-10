import { setupRegisterForm, validateLogin, loadDashboard, loadSettings } from "@/modules/users";
import { renderButtons } from "@/app/main";
import { updateTexts } from "@/app/i18n";
import { loadChart } from "@/components/graph"
import { startGame } from "@/modules/game/game.ts";
import { Tooltip } from "@/components/tooltip";
import { loadMatchHistory } from "@/components/history";
import { redirect } from "@/components/redirect";

// Llamada                            Efecto
// navigateTo("home")                 Carga "home" y añade al historial
// navigateTo("home", false, true)    Carga "home" y reemplaza la página actual
// navigateTo("home", true)           Carga "home" sin tocar la URL
// navigateTo("home", true, true)     Rara vez útil — no cambia URL ni historial
export async function navigateTo(page: string, skipPushState = false, replace = false) {
  console.log("navigation");
  console.log(page);

  // 🚨 Bloquear números SOLO cuando vienen de la SPA (clicks internos)
  if (!skipPushState && !isNaN(Number(page))) {
    console.warn(`Ignorando navegación numérica interna: ${page}`);
    return;
  }

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

  // Inicializar tooltips después de que el DOM esté listo
  const tooltip = new Tooltip();
  tooltip.init();

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
        loadMatchHistory();
        renderButtons();
      });
      break;
    case "settings":
      loadSettings();
      break;
    case "history":
      loadMatchHistory();
      break;
    case "game":
      startGame();
      break;
    case "404":
      renderButtons();
      redirect("home");
      break;
    case "setReady1":
      renderButtons();
      break;
  }

  // Actualizar los textos al cambiar de página
  updateTexts();
}

export function handlePopState() {
  const page = location.pathname.replace("/", "") || "home";
  navigateTo(page, true);
}