import {
    setupRegisterForm,
    validateLogin,
    loadDashboard,
    loadSettings,
} from '@/modules/users';
import { renderButtons } from '@/app/main';
import { updateTexts } from '@/app/i18n';
import { loadChart } from '@/components/graph';
import { Tooltip } from '@/components/tooltip';
import { loadMatchHistory } from '@/components/history';
import { redirect } from '@/components/redirect';
import {
    cleanupFriendsSidebar,
    initFriendsSidebar,
} from '@/components/friendsSidebar/friendsSidebar';
import { getCurrentUser } from '@/modules/users';
import { ready1 } from '@/modules/game/setReady1';
import { t } from '@/app/i18n';
import { initGame3D } from '@/modules/game/game';
import { tournament } from '@/modules/tournament/tournament';
import { loadTournamentsHistory } from '@/components/tournamentsHistory';
import { getGameSocket } from '@/modules/game/gameSocket';

// Páginas que requieren autenticación
const PRIVATE_PAGES = [
    'dashboard',
    'settings',
    'playing',
    'setReady1',
    'tournament',
];

// Llamada                            Efecto
// navigateTo("home")                 Carga "home" y añade al historial
// navigateTo("home", false, true)    Carga "home" y reemplaza la página actual
// navigateTo("home", true)           Carga "home" sin tocar la URL
// navigateTo("home", true, true)     Rara vez útil — no cambia URL ni historial
export async function navigateTo(
    page: string,
    skipPushState = false,
    replace = false
) {
    // Limpiar sidebar de amigos de la página anterior
    cleanupFriendsSidebar();

    // Para que cuando le paso parámetros a la url las cosas funcionen
    const pageBase: string = page.split('?')[0];
    //console.log('pageBase=', pageBase); // DB

    // 🚨 Bloquear números SOLO cuando vienen de la SPA (clicks internos)
    if (!skipPushState && !isNaN(Number(page))) {
        // console.warn(`Ignorando navegación numérica interna: ${page}`); // DB
        return;
    }

    // ============================================
    // 🔐 VALIDACIÓN DE AUTENTICACIÓN
    // ============================================

    // Si intenta acceder a página privada sin token válido
    if (PRIVATE_PAGES.includes(pageBase)) {
        const token = localStorage.getItem('access_token');

        if (!token) {
            console.warn('⚠️ Attempting to access private page without token');
            navigateTo('login', false, true);
            return;
        }

        // Validar que el usuario existe (solo en primera navegación a privada)
        const userResponse = await getCurrentUser();
        if (!userResponse) {
            console.warn('⚠️ Invalid token or user not found');
            // getCurrentUser ya limpia el token y muestra el toast
            navigateTo('login', false, true);
            return;
        }
    }

    // Redirección automática si el usuario ya tiene token y entra a login
    if (pageBase === 'login' && localStorage.getItem('access_token')) {
        navigateTo('dashboard', false, true);
        return;
    }

    // ============================================
    // 🧹 LIMPIEZA DE RECURSOS
    // ============================================

    // Destruir WebSocket del juego si salimos de playing
    if (pageBase !== 'playing') {
        const ws = getGameSocket();
        if (ws) ws.destroy();
    }

    // ============================================
    // 📄 CARGA DE PÁGINA
    // ============================================

    // Actualizar la URL sin recargar la página
    if (!skipPushState) {
        if (replace) {
            history.replaceState({}, '', `/${page}`);
        } else {
            history.pushState({}, '', `/${page}`);
        }
    }

    // Cargar el contenido de la página
    const response = await fetch(`/src/pages/${pageBase}.html`);
    const html = await response.text();

    // ⚠️ Detectar si el servidor devolvió el index.html en lugar de la página real
    const isFallbackIndex =
        html.includes('<!DOCTYPE html') && html.includes('<div id="app"');

    if (isFallbackIndex) {
        console.warn(`Página "${page}" no existe, mostrando 404`);
        navigateTo('404', true);
        return;
    }

    const app = document.getElementById('app')!;
    app.innerHTML = html;

    // Inicializar tooltips después de que el DOM esté listo
    const tooltip = new Tooltip();
    tooltip.init();

    // Ejecutar solo los <script> inline (sin src)
    Array.from(app.querySelectorAll('script')).forEach((s) => {
        if (!s.src) {
            const inline = document.createElement('script');
            inline.textContent = s.textContent || '';
            if (s.type) inline.type = s.type;
            document.head.appendChild(inline);
            document.head.removeChild(inline);
        }
    });

    // ============================================
    // 🎯 INICIALIZACIÓN POR PÁGINA
    // ============================================

    switch (pageBase) {
        case 'home':
            renderButtons();
            break;

        case 'login':
            validateLogin();
            setupRegisterForm();
            break;

        case 'dashboard':
        case 'settings':
        case 'playing':
        case 'setReady1':
        case 'tournament': {
            requestAnimationFrame(async () => {
                const userResponse = await getCurrentUser();
                if (!userResponse || !localStorage.getItem('access_token')) {
                    console.warn(t('UserNotFound'));
                    navigateTo('login', false, true);
                    return;
                }
                const user = userResponse.user;

                switch (pageBase) {
                    case 'dashboard':
                        await Promise.all([
                            loadDashboard(user),
                            loadChart(user),
                            loadMatchHistory(user),
                            loadTournamentsHistory(),
                        ]);
                        renderButtons();
                        requestAnimationFrame(async () => {
                            initFriendsSidebar();
                        });
                        break;

                    case 'settings':
                        await loadSettings(user);
                        requestAnimationFrame(async () => {
                            initFriendsSidebar();
                        });
                        break;

                    case 'playing':
                        initGame3D();
                        renderButtons();
                        break;

                    case 'setReady1':
                        ready1();
                        renderButtons();
                        break;

                    case 'tournament':
                        tournament();
                        break;
                }
            });
            break;
        }

        case '404':
            renderButtons();
            redirect('home');
            break;
    }

    // Actualizar los textos al cambiar de página
    updateTexts();
}

export function handlePopState() {
    const page = location.pathname.replace('/', '') || 'home';
    navigateTo(page, true);
}
