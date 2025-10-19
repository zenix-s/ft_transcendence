import { updateTexts } from "@/app/i18n";

export async function initFriendsSidebar() {
  const container = document.getElementById("friends-sidebar-container");
  if (!container) return console.warn("⚠️ No se encontró #friends-sidebar-container");

  // 🔹 Cargar el HTML del componente
  const response = await fetch("/src/components/friendsSidebar/friendsSidebar.html");
  const html = await response.text();
  container.innerHTML = html;

  // 🔹 Esperar un pequeño tick para que el DOM se renderice
  await new Promise((r) => requestAnimationFrame(r));

  // 🔹 Ahora sí, obtener referencias
  const toggleBtn = document.getElementById("friends-toggle-btn")!;
  const panel = document.getElementById("friends-panel")!;
  const addFriendBtn = document.getElementById("add-friend-btn")!;
  const friendInput = document.getElementById("friend-input") as HTMLInputElement;
  const onlineList = document.getElementById("online-friends")!;
  const offlineList = document.getElementById("offline-friends")!;

  // Ejemplo de datos simulados
  const onlineFriends = ["María", "Carlos"];
  const offlineFriends = ["Lucía", "Javi"];

  // 🔹 Renderizado dinámico
  function renderLists() {
    onlineList.innerHTML = onlineFriends
      .map(
        (name) => `
        <li class="flex justify-between items-center bg-white/20 rounded-md px-3 py-2">
          <span>${name}</span>
          <button class="invite-btn bg-white text-fuchsia-600 px-2 py-1 rounded-md hover:bg-fuchsia-100" data-name="${name}">
            Invitar
          </button>
        </li>`
      )
      .join("");

    offlineList.innerHTML = offlineFriends
      .map(
        (name) => `
        <li class="flex justify-between items-center bg-white/10 rounded-md px-3 py-2">
          <span>${name}</span>
        </li>`
      )
      .join("");
  }

  renderLists();

  // 🔹 Mostrar / ocultar panel
  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.contains("translate-x-0");
    panel.classList.toggle("translate-x-0", !isOpen);
    panel.classList.toggle("-translate-x-full", isOpen);
  });

  // 🔹 Agregar amigo
  addFriendBtn.addEventListener("click", () => {
    const name = friendInput.value.trim();
    if (!name) return;
    if (onlineFriends.includes(name) || offlineFriends.includes(name)) {
      alert("Ese amigo ya está en la lista");
      return;
    }
    offlineFriends.push(name);
    renderLists();
    friendInput.value = "";
  });

  // 🔹 Invitar a jugar
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains("invite-btn")) {
      const name = target.dataset.name!;
      alert(`Invitación enviada a ${name}`);
    }
  });

  updateTexts();
}
