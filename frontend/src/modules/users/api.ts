/**********************************************************************************/
/* Comunicación con el backend → Todo lo relacionado con fetch y peticiones HTTP. */
/**********************************************************************************/

import { loadAndRender, getNested } from "@/modules/users";

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

/** Fetch robusto: admite backend que devuelva un array directamente o { value: { users: [...] } } */
export async function fetchUsersFromBackend(): Promise<any[]> {
  const res = await fetch("/api/users"); // Vite proxy → https://backend:3000/users
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