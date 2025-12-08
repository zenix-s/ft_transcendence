/*********************************************************************************************/
/* Login, register y validaciones → Aquí irían las funciones relacionadas con autenticación. */
/*********************************************************************************************/

import { navigateTo } from '@/app/navigation';
import { t } from '@/app/i18n';
import { showToast } from '@/components/toast';
import type { GetCurrentUserResponse } from '@/types/user';
import { createSocialSocket } from '@/modules/social/socketInstance';
import { apiUrl } from '@/api';
import {
    applySavedColors,
    migrateLegacyColorsToUser,
} from '@/components/colorPicker';
import { countInputLenght } from '@/components/inputCounter';
import { createTournamentSocket } from '../tournament/tournamentSocketInstance';
import { initialize } from '@/app/main';

//export let wsClient: SocialWebSocketClient | null = null;

/* REGISTER NEW USER */
export function setupRegisterForm() {
    setTimeout(() => {
        const forms = document.querySelectorAll('form');
        const registerForm = forms[1];
        if (!registerForm) return;

        // Char counter
        const usernameInput = registerForm.querySelector<HTMLInputElement>(
            'input[name="username"]'
        );
        countInputLenght(usernameInput);

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const username = formData.get('username') as string;
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            const repeatPassword = formData.get('repeat_password') as string;

            /* Validate all fields are filled */
            if (!username || !email || !password || !repeatPassword) {
                showToast(t('fillAllFields'), 'error');
                return;
            }

            /* Validate UserName (Regular expresion)
      3-20 characters
      Only letters, numbers, hyphens, and underscores
      */
            const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
            if (!usernameRegex.test(username)) {
                showToast(t('invalidUsername'), 'error');
                return;
            }

            /* Validate Email (Regular expresion)
      string + '@' + string + '.' + string
      */
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast(t('invalidEmail'), 'error');
                return;
            }

            /* Validate Password (Regular expresion)
      Minimum 8 characters.
      At least one capital letter.
      At least one lowercase letter.
      At least one number.
      Optional: At least one special character.
      */
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(password)) {
                showToast(t('invalidPassword'), 'error');
                return;
            }

            /* Validate if both passwords are the same */
            if (password !== repeatPassword) {
                showToast(t('passwordDoNotMatch'), 'error');
                return;
            }

            /* This block of code is handling the registration process for a new user. Here's a breakdown of
      what it does: */
            try {
                const response = await fetch(apiUrl(`/auth/register`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorcode = data.error || 'ErrorCreatingUser';
                    showToast(t(errorcode), 'error');
                    return;
                }

                // ✅ Guardar el token recibido
                const token = data.token;
                localStorage.setItem('access_token', token);

                // ✅ Guardar el userId recibido
                const userId = data.user.id;
                localStorage.setItem('userId', userId);

                // Conectar WebSocket
                //createSocialSocket(token);

                // 🔹 Conectar WebSocket Y ESPERAR a que esté autenticado
                /* const ws = createSocialSocket(token);
                await new Promise<void>((resolve) => {
                    const checkAuth = setInterval(() => {
                        if (ws.getAuthenticated()) {
                            clearInterval(checkAuth);
                            resolve();
                        }
                    }, 50);

                    // Timeout de seguridad (15s)
                    setTimeout(() => {
                        clearInterval(checkAuth);
                        resolve();
                    }, 15000);
                }); */

                await initialize();

                showToast(t('UserCreatedSuccessfully'));
                registerForm.reset();

                // Redirigir al dashboard
                navigateTo('dashboard');
            } catch {
                showToast(t('NetworkOrServerError'), 'error');
            }
        });
    }, 100); // Espera breve para asegurar que el HTML está en el DOM
}

/* LOG-IN */
export function validateLogin() {
    setTimeout(() => {
        const forms = document.querySelectorAll('form');
        const loginForm = forms[0];
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;

            if (!email || !password) {
                showToast(t('fillAllFields'), 'error');
                return;
            }

            try {
                const response = await fetch(apiUrl(`/auth/login`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorcode = data.error || 'invalidCredentialsError';
                    //const errorMsg = data.error?.message || data.message || "Credenciales incorrectas";
                    //alert(errorMsg);
                    showToast(t(errorcode), 'error');
                    return;
                }

                // ✅ Guardar el token recibido
                //console.log("Respuesta completa del login:", data); // DB
                const token = data.token;
                localStorage.setItem('access_token', token);

                // ✅ Guardar el userId recibido
                const userId = data.user.id;
                localStorage.setItem('userId', userId);

                // MIGRAR claves globales antiguas al usuario (si existen)
                migrateLegacyColorsToUser(userId);

                // Conectar WebSocket
                //createSocialSocket(token);
                /* wsClient = new SocialWebSocketClient(token);
                wsClient.connect(); */

                // Conectar websocket de torneos
                //createTournamentSocket(token);

                await initialize();

                showToast(t('welcome'));
                navigateTo('dashboard');

                // 🔹 Espera breve y luego aplica los colores del usuario logueado
                requestAnimationFrame(() => applySavedColors());
            } catch (err) {
                console.error('Login error:', err);
                showToast(t('ErrorTryingToLogIn'), 'error');
            }
        });
    }, 100);
}

/* GET USER */
let sessionHandled = false;

export async function getCurrentUser(): Promise<GetCurrentUserResponse | null> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        handleInvalidSession('NoTokenFound');
        return null;
    }

    try {
        const response = await fetch(apiUrl(`/auth/me`), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        switch (response.status) {
            case 200:
                // ✅ Usuario válido
                sessionHandled = false;
                return result as GetCurrentUserResponse;

            case 401:
                // Token inválido o caducado
                handleInvalidSession('SessionExpiredOrInvalid');
                return null;

            case 404:
                // Usuario eliminado del sistema
                handleInvalidSession('UserNotFound');
                return null;

            case 400:
                // Petición inválida (error del cliente)
                console.warn(t('badRequest'), result?.error);
                showToast(t('badRequest'), 'error');
                return null;

            case 409:
                handleInvalidSession('userConflict');
                return null;

            default:
                // Error inesperado del servidor
                console.error(t('ErrorRetrievingProfile'), result);
                showToast(t('ErrorRetrievingProfile'), 'error');
                return null;
        }
    } catch (err) {
        // Error de red o fetch fallido
        console.error(t('networkError'), err);
        if (!sessionHandled) showToast(t('networkError'), 'error');
        return null;
    }
}

function handleInvalidSession(messageKey: string) {
    if (!sessionHandled) {
        sessionHandled = true;
        console.warn(`⚠️ Invalid session: ${messageKey}`);
        showToast(t(messageKey), 'error');

        // Limpiar todo el estado de autenticación
        localStorage.removeItem('access_token');
        localStorage.removeItem('userId');

        // Resetear flag después de 2 segundos
        setTimeout(() => {
            sessionHandled = false;
        }, 2000);
    }
}

/* MATCH-HISTORY/STATS (Doughnut Graph) */
export async function getStats(userId: number) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(apiUrl(`/match-history/stats/${userId}`), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error fetching stats:', err);
        return null;
    }
}

/* MATCH-HISTORY/USER (History) */
export async function getHistory(userId: number) {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
        return await fetch(apiUrl(`/match-history/user/${userId}`), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        return null;
    }
}
