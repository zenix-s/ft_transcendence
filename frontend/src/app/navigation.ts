import { setupRegisterForm, validateLogin, loadDashboard, loadSettings } from "@/modules/users";
import { renderButtons } from "@/app/main";
import { updateTexts } from "@/app/i18n";
import { loadChart } from "@/components/graph"
import { startGame } from "@/modules/game/game.ts";
import { Tooltip } from "@/components/tooltip";
import { loadMatchHistory } from "@/components/history";
import { redirect } from "@/components/redirect";
import { initFriendsSidebar } from "@/components/friendsSidebar/friendsSidebar"
import { getCurrentUser } from "@/modules/users";
import { ready1 } from "@/modules/game/setReady1";

// Llamada                            Efecto
// navigateTo("home")                 Carga "home" y añade al historial
// navigateTo("home", false, true)    Carga "home" y reemplaza la página actual
// navigateTo("home", true)           Carga "home" sin tocar la URL
// navigateTo("home", true, true)     Rara vez útil — no cambia URL ni historial
export async function navigateTo(page: string, skipPushState = false, replace = false) {
  // console.log("navigation"); // DB
  console.log(page); // DB

  // Para que cuando le paso parámetros a la url las cosas funcionen
  const pageBase: string = (page.split("?"))[0];
  //console.log("pageBase=", pageBase); // DB

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

  // Redirección automática si el usuario no tiene token y entra a páginas prohibidas sin token
  /* if (page === "game" && !localStorage.getItem("access_token")) {
    console.log("PRUEBAAAAA 222");
    navigateTo("login");
    return;
  } */

  // Actualizar la URL sin recargar la página
  if (!skipPushState) {
     if (replace) {
      history.replaceState({}, "", `/${page}`); // sustituye la entrada actual
    } else {
      history.pushState({}, "", `/${page}`); // añade nueva entrada
    }
  }

  // Cargar el contenido de la página
  const response = await fetch(`/src/pages/${pageBase}.html`);
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
  switch (pageBase) {
    case "home":
      renderButtons();
      break;
    case "login":
      validateLogin();
      setupRegisterForm();
      break;
    case "dashboard":
    case "settings":
    case "game":
    case "setReady1": {
      requestAnimationFrame(async () => {
        const userResponse = await getCurrentUser();
        if (!userResponse || !localStorage.getItem("access_token")) return;
        const user = userResponse.user;

        switch (pageBase) {
          case "dashboard":
            await Promise.all([
              loadDashboard(user),
              loadChart(user),
              loadMatchHistory(user),
            ]);
            renderButtons();
            requestAnimationFrame(async () => {
              initFriendsSidebar();
            });
            break;

          case "settings":
            await loadSettings();
            requestAnimationFrame(async () => {
              initFriendsSidebar();
            });
            break;

          case "game":
            startGame();
            break;

          case "setReady1":
            renderButtons();
            ready1();
            break;
        }
      });
      break;
    }
    case "404":
      renderButtons();
      redirect("home");
      break;
  }

  // Actualizar los textos al cambiar de página
  updateTexts();
}

export function handlePopState() {
  const page = location.pathname.replace("/", "") || "home";
  navigateTo(page, true);
}