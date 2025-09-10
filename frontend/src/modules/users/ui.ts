/*******************************************************************************************************************/
/* Renderizado y helpers DOM → Todo lo relacionado con manipulación del DOM y helpers como getNested y setContent. */
/*******************************************************************************************************************/

import { fetchUsersFromBackend } from "@/modules/users";

/** Obtener valor anidado por path tipo "address.city" */
export function getNested(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** Asigna texto a un selector CSS o a un Element pasado directamente */
export function setContent(target: string | Element, text: string) {
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
export function renderMessageToSelectors(mapping: Record<string, string | Element>, msg: string) {
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