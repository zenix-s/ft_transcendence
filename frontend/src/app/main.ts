import '@/app/styles/global.css';

import { navigateTo, handlePopState } from '@/app/navigation';
import { setupEventListeners } from '@/app/events';
import { applySavedColors } from '@/components/colorPicker';
import { GlitchButton } from '@/components/GlitchButton';
import { loadChart } from '@/components/graph';
import { matchTable, loadMatchHistory } from '@/components/history';
import {
    tournamentTable,
    loadTournamentsHistory,
} from '@/components/tournamentsHistory';
import { updateSliders } from '@/components/updateSliders';
import { getGameSocket } from '@/modules/game/gameSocket';
import { setLanguage, t, currentLang } from '@/app/i18n';
import {
    createSocialSocket,
    getSocialSocket,
} from '@/modules/social/socketInstance';
import { SocialWebSocketClient } from '@/modules/social/socialSocket';
import { getColor, setButtonsColors, setColors } from '@/modules/game/getColors';
import {
    createTournamentSocket,
    getTournamentSocket,
} from '@/modules/tournament/tournamentSocketInstance';
import { TournamentWebSocketClient } from '@/modules/tournament/tournamentSocket';
import { getCurrentUser } from '@/modules/users';
import { showToast } from '@/components/toast';

// Exponer utilidades al ámbito global
declare global {
    interface Window {
        GlitchButton: typeof GlitchButton;
    }
}
window.GlitchButton = GlitchButton;

// Al cargar toda la SPA, aplica los colores guardados
applySavedColors();

// ====================
// 🔐 VALIDACIÓN DE TOKEN
// ====================
// Páginas que NO requieren autenticación
const PUBLIC_PAGES = ['home', 'login', '404'];

// ====================
// 🌐 INICIALIZACIÓN DE WEBSOCKETS
// ====================
async function initSocialSocket(): Promise<SocialWebSocketClient | null> {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    let ws: SocialWebSocketClient | null = getSocialSocket();

    if (!ws) {
        console.log(`🌐 ${t('InitializingSocialWs')}`);
        ws = createSocialSocket(token);
    }

    // 🔹 Esperar autenticación
    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            if (ws?.getAuthenticated()) {
                clearInterval(interval);
                resolve();
            }
        }, 50);

        // Timeout de 15s
        setTimeout(() => {
            clearInterval(interval);
            resolve();
        }, 15000);
    });

    return ws;
}

async function initTournamentSocket(): Promise<TournamentWebSocketClient | null> {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    let ws: TournamentWebSocketClient | null = getTournamentSocket();

    if (!ws) {
        console.log(`🏆 ${t('InitializingTournamentWs')}`);
        ws = createTournamentSocket(token);
        // Esperar a que el socket se conecte y autentique antes de continuar
        await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (ws?.getAuthenticated()) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        });
    }

    return ws;
}

// ====================
// 🌐 Languajes
// ====================
const savedLang = localStorage.getItem('lang') as 'en' | 'es' | 'fr' | null;
if (savedLang) {
    setLanguage(savedLang);
} else {
    setLanguage('en');
}

// Render inicial de botones
renderButtons();

// Conectar selector del DOM
const langSelector = document.getElementById(
    'lang_selector'
) as HTMLSelectElement | null;
if (langSelector) {
    langSelector.value = savedLang || currentLang;
    langSelector.addEventListener('change', (event: Event) => {
        const select = event.target as HTMLSelectElement;
        setLanguage(select.value as 'en' | 'es' | 'fr');
    });
}

// ====================
// 🌙 Toggle dark mode
// ====================
const toggle = document.getElementById('dark_mode_toggle');

if (toggle) {
    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');

        // Guardar preferencia
        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }

        //cambiar colores del juego
        const canvas = document.getElementById(
            'gameCanvas'
        ) as HTMLCanvasElement;
        if (canvas) {
            const ws = getGameSocket();
            if (!ws)
                return;
            if (localStorage.getItem('theme') === 'dark') {
                const borderColor = getColor('--color-primary');
                const bgColor = getColor('--color-secondary');
                setColors(ws.getScene(), bgColor, borderColor);
            } else {
                const borderColor = getColor('--color-secondary');
                const bgColor = getColor('--color-primary');
                setColors(ws?.getScene(), bgColor, borderColor);
            }
            setButtonsColors(ws.getButtons());
        }
        //Reload doughnut
        // Obtener el canvas
        const ctx = document.getElementById(
            'donutChart'
        ) as HTMLCanvasElement | null;
        if (ctx) {
            loadChart();
        }
    });
}

// Aplicar preferencia previa al cargar
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

// ====================
// 🚀 INICIALIZACIÓN
// ====================
export async function initialize() {
    // 1. Detectar página inicial
    const initialPage = location.pathname.replace('/', '') || 'home';

    // 2. Verificar si existe token y validarlo ANTES de cualquier inicialización de WebSocket
    const token = localStorage.getItem('access_token');

    if (token) {
        // 3. Validar token independientemente del tipo de página
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            // Token inválido - getCurrentUser ya limpió via performLogout()
            if (!PUBLIC_PAGES.includes(initialPage)) {
                // Página privada con token inválido -> redirigir a login
                navigateTo('login', false, true);
            } else {
                // Página pública con token inválido -> quedarse en la página (token ya limpiado)
                navigateTo(initialPage, true);
            }
            return;
        }

        // 4. Token válido - ahora es seguro inicializar WebSockets
        await Promise.all([initSocialSocket(), initTournamentSocket()]);
    } else if (!PUBLIC_PAGES.includes(initialPage)) {
        // 5. Sin token e intentando acceder a página privada -> redirigir a login
        showToast(`${t('NoTokenFound')}`, 'error');
        navigateTo('login', false, true);
        return;
    }

    // 6. Navegar a la página inicial
    navigateTo(initialPage, true);
}

// Ejecutar inicialización
initialize();

// Configurar los eventos
setupEventListeners();
window.addEventListener('popstate', handlePopState);

// ====================
// 🕹️ Translated buttons
// ====================
export function renderButtons() {
    document
        .querySelectorAll<HTMLElement>('[data-button]')
        .forEach((container) => {
            const key = container.dataset.button!; // ejemplo: "start", "game"
            const page = container.dataset.page || '';

            container.innerHTML = '';
            container.appendChild(GlitchButton(t(key), '', page));
        });
}

// Render inicial
renderButtons();

// Cuando cambie idioma, vuelve a renderizar
document.addEventListener('i18n-updated', async () => {
    renderButtons();
    //Reload doughnut
    // Obtener el canvas
    const ctx = document.getElementById(
        'donutChart'
    ) as HTMLCanvasElement | null;
    if (ctx) {
        loadChart();
    }

    const token = localStorage.getItem('access_token');

    // Reload Game History solo si existe tabla y hay token
    await reloadGameHistory(token);

    // Reload Tournaments History solo si existe tabla y hay token
    await reloadTournamentsHistory();

    updateSliders();
});

export async function reloadGameHistory(token: string | null) {
    const matchTableEl = document.getElementById('matchTable');
    if (matchTable && token && matchTableEl) {
        const matchTableEl = matchTable.dom;
        const matchHeader =
            matchTableEl.parentElement?.querySelector<HTMLDivElement>(
                '.datatable-header'
            );
        const matchPerPageSelect =
            matchHeader?.querySelector<HTMLSelectElement>(
                'select.datatable-selector'
            );

        // 1. Guardar página actual
        const currentPage = matchTable._currentPage ?? 0;

        // 2 Guardar items por página
        const currentPerPage = matchPerPageSelect
            ? parseInt(matchPerPageSelect.value, 10)
            : matchTable.options.perPage; // usa el valor actual de la tabla

        // 3. Destruir tabla
        matchTable.destroy();

        // 4. Volver a cargar historial
        await loadMatchHistory(undefined, currentPerPage);

        // 5. Restaurar página en la que estabas
        if (currentPage > 0) matchTable.page(currentPage);
    }
}

export async function reloadTournamentsHistory() {
    const tournamentTableEl = document.getElementById('tournamentsTable');
    if (tournamentTable && tournamentTableEl) {
        const tableEl = tournamentTable.dom;
        const headerDiv =
            tableEl.parentElement?.querySelector<HTMLDivElement>(
                '.datatable-header'
            );
        const tournamentPerPageSelect =
            headerDiv?.querySelector<HTMLSelectElement>(
                'select.datatable-selector'
            );

        // 1. Guardar página actual
        const currentPage = tournamentTable._currentPage ?? 0;

        // 2 Guardar items por página
        const currentPerPage = tournamentPerPageSelect
            ? parseInt(tournamentPerPageSelect.value, 10)
            : tournamentTable.options.perPage; // usa el valor actual de la tabla

        // 3. Clear tbody BEFORE destroying to prevent visual glitch
        const tbody = document.querySelector<HTMLTableSectionElement>(
            '#tournamentsTable tbody'
        );
        if (tbody) tbody.innerHTML = '';

        // 4. Destruir tabla
        tournamentTable.destroy();

        // 5. Volver a cargar historial
        await loadTournamentsHistory(currentPerPage);

        // 6. Restaurar página en la que estabas
        if (currentPage > 0) tournamentTable.page(currentPage);
    }
}
