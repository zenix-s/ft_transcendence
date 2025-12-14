import { getSocialSocket  } from '@/modules/social/socketInstance';
import { activeGameModal } from '@/components/modal';
import { createGameSocket } from '@/modules/game/gameSocket';
import { navigateTo } from '@/app/navigation';
import { showToast } from './toast';
import { t } from '@/app/i18n';

export function resumeMatchBtn() {
    const btn = document.getElementById("resume-game-btn") as HTMLButtonElement;
    if (!btn) return;

    btn.style.display = 'none';

    const ws = getSocialSocket();
    if (!ws) return;

    // Pedimos el estado activo de la partida
    ws.requestCheckActiveGame();

    ws.onActiveGameUpdate(async (state) => {
        if (!state.hasActiveGame) {
            btn.style.display = 'none';
            return;
        }

        btn.style.display = 'block';

        btn.onclick = async () => {
            const confirmed = await activeGameModal({
                opponentUsername: state.opponentUsername ?? undefined,
            });

            if (confirmed === true && state.gameId) {
                const token = localStorage.getItem('access_token');
                createGameSocket(token, state.gameId);
                navigateTo(`playing?id=${state.gameId}`);
            }
			else if (confirmed === 'leave' && state.gameId) {
				// Leave game
				const token = localStorage.getItem('access_token');
				const gameSocket = createGameSocket(token, state.gameId);
				await gameSocket.authenticate(state.gameId);
				gameSocket.leaveGame();
				gameSocket.destroy();
				showToast(t('GameLeft'), 'success');
			}
			else {
				// do nothing;
			}
		};
	});
}