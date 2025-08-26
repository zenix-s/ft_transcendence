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

export function setupRegisterForm() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const registerForm = forms[1];
    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const username = formData.get("user");
      const email = formData.get("email");
      const password = formData.get("password");
      const repeatPassword = formData.get("repeat_password");

      if (!username || !email || !password || !repeatPassword) {
        alert("Por favor, rellena todos los campos.");
        return;
      }
      if (password !== repeatPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          alert(data.error?.message || "Error al crear usuario");
        } else {
          alert("Usuario creado correctamente");
          registerForm.reset();
        }
      } catch (err) {
        alert("Error de red o servidor");
      }
    });
  }, 100); // Espera breve para asegurar que el HTML está en el DOM
}