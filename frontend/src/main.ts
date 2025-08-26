// import "./styles/style.css";
/* import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./components/counter.ts"; */

import "./styles/global.css";

import { navigateTo, handlePopState } from "./navigation";
import { setupEventListeners } from "./events";
import { loadAndRender, loadUserForCode, setupRegisterForm } from "./users";
//import { startGame } from "./game";

// Components
import { GlitchButton } from "./components/GlitchButton";

// Exponer utilidades al ámbito global
(window as any).loadAndRender = loadAndRender;
(window as any).loadUserForCode = loadUserForCode;
(window as any).GlitchButton = GlitchButton;

console.log("✅ main.ts cargado");

// Detectar la página inicial según la URL actual
const initialPage = location.pathname.replace("/", "") || "home";
navigateTo(initialPage);

if (initialPage === "game") {
  import("./game").then(module => {
    requestAnimationFrame(() => {
      module.startGame();
    });
  });
}

// Configurar los eventos
setupEventListeners();
window.addEventListener("popstate", handlePopState);

// Ejecutar el setup del registro tras cada navegación
window.addEventListener("DOMContentLoaded", () => {
  if (location.pathname.includes("login")) {
    setupRegisterForm();
  }
});


// Toggle dark mode
const toggle = document.getElementById("dark_mode_toggle");


console.log("🔍 toggle encontrado:", toggle);


if (toggle) {
  toggle.addEventListener("click", () => {
    console.log("👉 Botón clicado!");
    document.documentElement.classList.toggle("dark");

    // Guardar preferencia
    if (document.documentElement.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

// Aplicar preferencia previa al cargar
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}


// function navigateTo(page: string) {
//   // Actualizar la URL sin recargar la página
//   history.pushState({}, "", `/${page}`);

//   // Cargar el contenido de la página
//   fetch(`/src/pages/${page}.html`)
//     .then((response) => response.text())
//     .then((html) => {
//       document.getElementById('app')!.innerHTML = html;
//       if (page === "home") {
//         loadUsers();
//       }
//     });
// }

// Detectar la página inicial según la URL actual
// const initialPage = location.pathname.replace("/", "") || "home";
// fetch(`/src/pages/${initialPage}.html`)
//   .then((response) => response.text())
//   .then((html) => {
//     document.getElementById('app')!.innerHTML = html;
//     if (initialPage === "home") {
//       loadUsers();
//     }
//   });

// Manejar el evento popstate para la navegación con el botón "Atrás"
// window.addEventListener("popstate", () => {
//   const page = location.pathname.replace("/", "") || "home";
//   navigateTo(page);
// });

// document.addEventListener('click', (event) => {
//   const target = event.target as HTMLElement;
//   if (target.dataset.page) {
//     event.preventDefault();
//     navigateTo(target.dataset.page!);
//   }
// });

// async function loadUsers() {
//   fetch("http://localhost:3000/users") // http://localhost:3000/users
//   .then(data => data.json())
//   .then(data => {
//     console.log(data);
//   })
//   .catch(error => {
//     console.error(error)
//   });
//   /* const users = await response.json();

//   const userList = users.map((user: { id: number; name: string }) => {
//     return `<li>${user.name}</li>`;
//   }).join("");

//   const userSection = document.createElement("div");
//   userSection.innerHTML = `
//     <h2>Usuarios registrados:</h2>
//     <ul>${userList}</ul>
//   `;
//   document.getElementById("app")!.appendChild(userSection); */
// }

// Llamar a la función cuando se navegue a login
// document.addEventListener("click", (event) => {
//   const target = event.target as HTMLElement;
//   if (target.dataset.page === "login") {
//     loadUsers();
//   }
// });

// Cargar la página inicial
//navigateTo('home');

/* document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!); */
