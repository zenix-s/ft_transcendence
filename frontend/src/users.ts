import { navigateTo } from "./navigation";

/**
 * Utilities to fetch users and render arbitrary fields into arbitrary DOM selectors/elements.
 * - fetchUserById(userId): returns user object or null
 * - loadAndRender(userId, mapping): renders fields into selectors/elements
 * - loadUserForCode(userId): convenience to get the user object for custom rendering
 * - loadUsers(...) : compatibility helper (used elsewhere in your code) — flexible:
 *     - loadUsers() -> returns array of users
 *     - loadUsers(id) -> returns user object or null
 *     - loadUsers(id, ["name","address.city"]) -> renders these fields into body
 *     - loadUsers(id, mapping) -> delegates to loadAndRender
 */

/** Obtener valor anidado por path tipo "address.city" */
function getNested(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Asigna texto a un selector CSS o a un Element pasado directamente */
function setContent(target: string | Element, text: string) {
  if (typeof target === 'string') {
    const el = document.querySelector<HTMLElement>(target);
    if (el) {
      el.textContent = text;
    } else {
      console.warn(`setContent: selector no encontrado "${target}"`);
    }
    return;
  }
  (target as HTMLElement).textContent = text;
}

/** Muestra un mensaje (error/info) en todas las entradas del mapping; si mapping vacío, lo añade al body */
function renderMessageToSelectors(mapping: Record<string, string | Element>, msg: string) {
  const entries = Object.entries(mapping);
  if (entries.length === 0) {
    const el = document.createElement('div');
    el.textContent = msg;
    document.body.appendChild(el);
    return;
  }
  for (const [, selectorOrEl] of entries) {
    setContent(selectorOrEl, msg);
  }
}

/** Fetch robusto: admite backend que devuelva un array directamente o { value: { users: [...] } } */
async function fetchUsersFromBackend(): Promise<any[]> {
  const res = await fetch("https://localhost:3000/users"); // https://localhost:3000/users
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Si el backend devuelve { value: { users: [...] } }
  if (data && data.value && Array.isArray(data.value.users)) return data.value.users;
  // Si devuelve directamente un array
  if (Array.isArray(data)) return data;
  // Si devuelve { users: [...] }
  if (data && Array.isArray(data.users)) return data.users;
  // No es el formato esperado
  throw new Error("Respuesta de backend con formato inesperado");
}

/** Devuelve el usuario con el id indicado o null */
export async function fetchUserById(userId: number) {
  if (typeof userId !== 'number' || Number.isNaN(userId)) return null;
  try {
    const users = await fetchUsersFromBackend();
    return users.find((u: { id: number }) => u.id === userId) ?? null;
  } catch (err) {
    console.error("fetchUserById error:", err);
    throw err;
  }
}

/**
 * Carga un usuario por id y renderiza los campos indicados en mapping.
 * mapping: { "name": "#user-name", "address.city": "#user-city", "website": ".site" }
 */
export async function loadAndRender(userId: number, mapping: Record<string, string | Element>) {
  if (typeof userId !== 'number' || Number.isNaN(userId)) {
    console.warn('loadAndRender ignorado: userId inválido', userId);
    return;
  }

  try {
    const users = await fetchUsersFromBackend();
    if (!Array.isArray(users) || users.length === 0) {
      renderMessageToSelectors(mapping, "No hay usuarios disponibles.");
      return;
    }

    const user = users.find((u: { id: number }) => u.id === userId);
    if (!user) {
      renderMessageToSelectors(mapping, `Usuario con ID ${userId} no encontrado.`);
      return;
    }

    for (const [fieldPath, selectorOrEl] of Object.entries(mapping)) {
      const value = getNested(user, fieldPath);
      setContent(selectorOrEl, value == null ? 'Información no disponible' : String(value));
    }
  } catch (err) {
    console.error('loadAndRender error:', err);
    renderMessageToSelectors(mapping, 'Error al cargar usuario.');
  }
}

/** Conveniencia: obtener el objeto usuario para manipularlo en código */
export async function loadUserForCode(userId: number) {
  return await fetchUserById(userId);
}

/**
 * Compatibilidad: exportar loadUsers para quien lo importe.
 * Flexible:
 * - loadUsers() => Promise<any[]> (lista completa)
 * - loadUsers(id) => Promise<any|null> (objeto usuario)
 * - loadUsers(id, fieldsArray) => renders into document.body (legacy simple rendering)
 * - loadUsers(id, mapping) => delegates to loadAndRender
 */
export async function loadUsers(userId?: number, fieldsOrMapping?: string[] | Record<string, string | Element>) {
  // Sin argumentos: devolver array de usuarios
  if (typeof userId === 'undefined') {
    return await fetchUsersFromBackend();
  }

  // Si se pasa mapping (objeto), delegar
  if (fieldsOrMapping && typeof fieldsOrMapping === 'object' && !Array.isArray(fieldsOrMapping)) {
    // fieldsOrMapping es mapping: call loadAndRender
    return await loadAndRender(userId as number, fieldsOrMapping as Record<string, string | Element>);
  }

  // Si se pasa array de campos => simple render en body (mantener compatibilidad con código legacy)
  if (Array.isArray(fieldsOrMapping)) {
    try {
      const users = await fetchUsersFromBackend();
      const user = users.find((u: { id: number }) => u.id === userId);
      const wrapper = document.createElement('div');

      if (!user) {
        wrapper.textContent = `Usuario con ID ${userId} no encontrado.`;
        document.body.appendChild(wrapper);
        return null;
      }

      const html = `
        <h2>Información del usuario:</h2>
        ${fieldsOrMapping.map(field => {
          const value = getNested(user, field);
          return `<p>${field}: ${value == null ? 'Información no disponible' : String(value)}</p>`;
        }).join('')}
      `;
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);
      return user;
    } catch (err) {
      const el = document.createElement('div');
      el.textContent = 'Error al cargar usuarios.';
      document.body.appendChild(el);
      console.error('loadUsers (legacy) error:', err);
      return null;
    }
  }

  // Si solo se pasa userId: devolver objeto usuario
  return await fetchUserById(userId as number);
}

/* REGISTER NEW USER */
export function setupRegisterForm() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const registerForm = forms[1];
    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const username = formData.get("username") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const repeatPassword = formData.get("repeat_password") as string;

      if (!username || !email || !password || !repeatPassword) {
        alert("Por favor, rellena todos los campos.");
        return;
      }
      if (password !== repeatPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      try {
        const response = await fetch("https://localhost:3000/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          alert(data.error?.message || "Error al crear usuario");
        } else {
          alert("Usuario creado correctamente");
          console.log(`password send = "${password}"`); // DB
          registerForm.reset();
        }
      } catch (err) {
        alert("Error de red o servidor");
      }
    });
  }, 100); // Espera breve para asegurar que el HTML está en el DOM
}

/* LOG-IN */
/** Devuelve el usuario con el username indicado o null */
export async function fetchUserByUsername(username: string) {
  if (!username) return null;
  try {
    const users = await fetchUsersFromBackend();
    return users.find((u: { username: string }) => u.username === username) ?? null;
  } catch (err) {
    console.error("fetchUserByUsername error:", err);
    throw err;
  }
}

/** Devuelve el usuario con el email indicado o null */
export async function fetchUserByEmail(email: string) {
  if (!email) return null;
  try {
    const users = await fetchUsersFromBackend();
    return users.find((u: { email: string }) => u.email === email) ?? null;
  } catch (err) {
    console.error("fetchUserByEmail error:", err);
    throw err;
  }
}

/** Igual que loadAndRender pero buscando por username */
export async function loadAndRenderByUsername(username: string, mapping: Record<string, string | Element>) {
  try {
    const users = await fetchUsersFromBackend();
    if (!Array.isArray(users) || users.length === 0) {
      renderMessageToSelectors(mapping, "No hay usuarios disponibles.");
      return;
    }

    const user = users.find((u: { username: string }) => u.username === username);
    if (!user) {
      renderMessageToSelectors(mapping, `Usuario con username "${username}" no encontrado.`);
      return;
    }

    for (const [fieldPath, selectorOrEl] of Object.entries(mapping)) {
      const value = getNested(user, fieldPath);
      setContent(selectorOrEl, value == null ? 'Información no disponible' : String(value));
    }
  } catch (err) {
    console.error('loadAndRenderByUsername error:', err);
    renderMessageToSelectors(mapping, 'Error al cargar usuario.');
  }
}

/** Igual que loadAndRender pero buscando por email */
export async function loadAndRenderByEmail(email: string, mapping: Record<string, string | Element>) {
  try {
    const users = await fetchUsersFromBackend();
    if (!Array.isArray(users) || users.length === 0) {
      renderMessageToSelectors(mapping, "No hay usuarios disponibles.");
      return;
    }

    const user = users.find((u: { email: string }) => u.email === email);
    if (!user) {
      renderMessageToSelectors(mapping, `Usuario con email "${email}" no encontrado.`);
      return;
    }

    for (const [fieldPath, selectorOrEl] of Object.entries(mapping)) {
      const value = getNested(user, fieldPath);
      setContent(selectorOrEl, value == null ? 'Información no disponible' : String(value));
    }
  } catch (err) {
    console.error('loadAndRenderByEmail error:', err);
    renderMessageToSelectors(mapping, 'Error al cargar usuario.');
  }
}

export function validateLogin() {
  setTimeout(() => {
    const forms = document.querySelectorAll("form");
    const loginForm = forms[0];
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const name_email = formData.get("user-email") as string;
      const password = formData.get("password") as string;

      if (!name_email || !password) {
        alert("Por favor, rellena todos los campos.");
        return;
      }

      try {
        // Primero intentamos buscar por username
        let user = await fetchUserByUsername(name_email);

         // Si no existe por username, probamos por email
        if (!user) {
          user = await fetchUserByEmail(name_email);
        }

        if (!user) {
          alert("Usuario o email no encontrado.");
          return;
        }

         // ⚠️ Ojo: esto es provisional (password en claro)
        if (user.password !== password) {
          alert("Contraseña incorrecta.");
          return;
        }

         // Si pasa todo → login OK
        alert(`Bienvenido ${user.username}!`);

        // Aquí podrías guardar en localStorage, redirigir, etc.
        // localStorage.setItem("user", JSON.stringify(user));
        navigateTo("dashboard");

      } catch (err) {
        console.error("Error en login:", err);
        alert("Error al intentar iniciar sesión.");
      }
    });
  }, 100);
}