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

// ====================
// TYPE DECLARATIONS
// ====================
declare global {
    interface Window {
        GlitchButton: typeof GlitchButton;
    }
}
window.GlitchButton = GlitchButton;

// ====================
// CONSTANTS
// ====================
const PUBLIC_PAGES = ['home', 'login', '404'];

// ====================
// WEBSOCKET INITIALIZATION
// ====================
async function initSocialSocket(): Promise<SocialWebSocketClient | null> {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    let ws: SocialWebSocketClient | null = getSocialSocket();

    if (!ws) {
        // console.log(`🌐 ${t('InitializingSocialWs')}`); // DB
        ws = createSocialSocket(token);
    }

    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            if (ws?.getAuthenticated()) {
                clearInterval(interval);
                resolve();
            }
        }, 50);

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
        // console.log(`🏆 ${t('InitializingTournamentWs')}`); // DB
        ws = createTournamentSocket(token);
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
// HELPER FUNCTIONS
// ====================
export function renderButtons() {
    document
        .querySelectorAll<HTMLElement>('[data-button]')
        .forEach((container) => {
            const key = container.dataset.button!;
            const page = container.dataset.page || '';

            container.innerHTML = '';
            container.appendChild(GlitchButton(t(key), '', page));
        });
}

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

        const currentPage = matchTable._currentPage ?? 0;

        const currentPerPage = matchPerPageSelect
            ? parseInt(matchPerPageSelect.value, 10)
            : matchTable.options.perPage;

        matchTable.destroy();

        await loadMatchHistory(undefined, currentPerPage);

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

        const currentPage = tournamentTable._currentPage ?? 0;

        const currentPerPage = tournamentPerPageSelect
            ? parseInt(tournamentPerPageSelect.value, 10)
            : tournamentTable.options.perPage;

        const tbody = document.querySelector<HTMLTableSectionElement>(
            '#tournamentsTable tbody'
        );
        if (tbody) tbody.innerHTML = '';

        tournamentTable.destroy();

        await loadTournamentsHistory(currentPerPage);

        if (currentPage > 0) tournamentTable.page(currentPage);
    }
}

// ====================
// SETUP FUNCTIONS
// ====================
function setupLanguage() {
    const savedLang = localStorage.getItem('lang') as 'en' | 'es' | 'fr' | null;
    if (savedLang) {
        setLanguage(savedLang);
    } else {
        setLanguage('en');
    }

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
}

function setupDarkModeToggle() {
    // Apply saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    const toggle = document.getElementById('dark_mode_toggle');

    if (toggle) {
        toggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');

            if (document.documentElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }

            // Update game colors
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

            // Reload doughnut chart
            const ctx = document.getElementById(
                'donutChart'
            ) as HTMLCanvasElement | null;
            if (ctx) {
                loadChart();
            }
        });
    }
}

function setupI18nListener() {
    document.addEventListener('i18n-updated', async () => {
        renderButtons();

        const ctx = document.getElementById(
            'donutChart'
        ) as HTMLCanvasElement | null;
        if (ctx) {
            loadChart();
        }

        const token = localStorage.getItem('access_token');

        await reloadGameHistory(token);

        await reloadTournamentsHistory();

        updateSliders();
    });
}

// ====================
// MAIN INITIALIZATION
// ====================
export async function initialize() {
    // 1. Apply saved visual preferences
    applySavedColors();

    // 2. Setup language
    setupLanguage();

    // 3. Setup dark mode
    setupDarkModeToggle();

    // 4. Render translated buttons
    renderButtons();

    // 5. Detect initial page
    const initialPage = location.pathname.replace('/', '') || 'home';

    // 6. Token validation and WebSocket initialization
    const token = localStorage.getItem('access_token');

    if (token) {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            if (!PUBLIC_PAGES.includes(initialPage)) {
                navigateTo('login', false, true);
            } else {
                navigateTo(initialPage, true);
            }
            return;
        }

        await Promise.all([initSocialSocket(), initTournamentSocket()]);
    } else if (!PUBLIC_PAGES.includes(initialPage)) {
        showToast(`${t('NoTokenFound')}`, 'error');
        navigateTo('login', false, true);
        return;
    }

    // 7. Navigate to initial page
    navigateTo(initialPage, true);

    // 8. Setup event listeners
    setupEventListeners();
    window.addEventListener('popstate', handlePopState);

    // 9. Setup i18n listener
    setupI18nListener();
}

// ====================
// ENTRY POINT
// ====================
initialize();
