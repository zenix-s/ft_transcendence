import { navigateTo } from '@/app/navigation';
import { applySavedColors } from '@/components/colorPicker';
import { modal } from '@/components/modal';
import {
    handleParticipationJoinOrLeave,
    handleParticipationResults,
    handleParticipationStartTournament,
    refreshTournamentsHistory,
} from '@/components/tournamentsHistory';
import { destroySocialSocket } from '@/modules/social/socketInstance';
import { destroyTournamentSocket } from '@/modules/tournament/tournamentSocketInstance';
import type { GameOptions } from '@/types/gameOptions';

/**
 * The `setupEventListeners` function adds event listeners for click and popstate events to handle
 * navigation and user login functionality.
 */
export function setupEventListeners() {
    // Listeners de navegación
    document.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;

        // 🔹 1. Caso especial: LOGOUT
        if (target.dataset.page === 'logout') {
            event.preventDefault(); // Frena navegación automática
            const confirmed = await modal({ type: 'logout' });
            if (confirmed) {
                localStorage.removeItem('userId');
                localStorage.removeItem('color_primary');
                localStorage.removeItem('color_secondary');
                destroySocialSocket(); // Desconectar y limpiar el WebSocket
                destroyTournamentSocket(); // Desconectar y limpiar el WebSocket
                localStorage.removeItem('access_token');

                // Forzar colores por defecto
                applySavedColors();

                navigateTo('login');
            }
            return;
        }

        // 🔹 2. Caso LOGIN (redirige a dashboard si ya hay token)
        if (target.dataset.page === 'login') {
            event.preventDefault(); // Frena navegación automática
            // Si hay token, navega directo a dashboard
            if (localStorage.getItem('access_token')) {
                navigateTo('dashboard');
            } else {
                navigateTo('login');
            }
            return;
        }

        if (target.closest('.datatable-pagination a')) {
            event.preventDefault(); // evita que siga el enlace
            event.stopPropagation(); // Detiene la propagación hacia otros listeners
            event.stopImmediatePropagation(); // frena Simple-Datatables y otros listeners
            return;
        }

        // 🔹 3. Navegación genérica
        if (target.dataset.page) {
            event.preventDefault();
            navigateTo(target.dataset.page!);
            return;
        }

        // 🔹 4. Listener para el botón de refresh de torneos
        if (target.id === 'refreshTournamentsBtn') {
            await refreshTournamentsHistory();
            return;
        }

        // 🔹 5. Listener para los botones de unirse, abandonar, comenzar o ver resultados de los torneos
        if (target.classList.contains('participation-btn')) {
            event.preventDefault();

            if (!target.dataset.i18n) return;

            if (target.dataset.i18n === 'join') {
                // Caso join
                await handleParticipationJoinOrLeave(target);
                return;
            }

            if (target.dataset.i18n === 'leave') {
                // Caso admin o admin-participant: pedir confirmación
                const isAdmin: boolean =
                    target.dataset.userrole === 'admin' ||
                    target.dataset.userrole === 'admin-participant';
                let confirmLeave: boolean | GameOptions = false; //

                if (isAdmin)
                    confirmLeave = await modal({
                        type: 'confirmLeaveTournament',
                    });

                if (!isAdmin || confirmLeave)
                    await handleParticipationJoinOrLeave(target);

                return;
            }

            if (target.dataset.i18n === 'results') {
                await handleParticipationResults(target);
                return;
            }

            // Caso startTournament
            await handleParticipationStartTournament(target);
            console.log('Iniciar torneo - función no implementada aún.');
            return;
        }
    });
}
