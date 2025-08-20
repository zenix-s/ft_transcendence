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
  const res = await fetch("http://localhost:3000/users");
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