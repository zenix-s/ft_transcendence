import { showToast } from '@/components/toast';
import { fetchGameAlreadyFinished } from './getData';
import { t } from '@/app/i18n';
import { navigateTo } from '@/app/navigation';
import { renderValues } from './game';
import type { Ball, Player, Score } from './gameData';
import { modal } from '@/components/modal';
import { getGameSocket } from './gameSocket';

async function endGame(
    finBool: number,
    gameId: number,
    player1: Player,
    player2: Player,
    scores: Score,
    ball: Ball
) {
    if (
        finBool == 0 &&
        (document.getElementById('gameCanvas') as HTMLCanvasElement)
    ) {
        const ws = getGameSocket();
        if (!ws) {
            showToast('Internal error no WS', 'error');
            console.warn('Internal error no WS');
            navigateTo('dashboard', false, true);
            return;
        }

        const finished = await fetchGameAlreadyFinished(gameId);
        if (!finished) {
            ws?.destroy();
            showToast(t('GameError'));
            console.warn(t('GameError'));
            navigateTo('dashboard', false, true);
        }
        console.log('game = ', JSON.stringify(finished));
        const score1 = finished.match?.players[0]?.score || 0;
        const score2 = finished.match?.players[1]?.score || 0;
        renderValues(
            50,
            player1,
            50,
            player2,
            score1,
            score2,
            scores,
            50,
            50,
            ball
        );
        // const playerL = finished.match.players[0].userId;
        // const playerR = finished.match.players[1].userId;
        // console.log(
        //     '1=',
        //     playerL,
        //     ' 2=',
        //     playerR,
        //     ' 1=',
        //     score1,
        //     ' 2=',
        //     score2,
        //     ' winner=',
        //     finished.match.winner?.username
        // );
        ws?.destroy();
        navigateTo('dashboard', false, true);
        await modal({
            type: 'gameFinished',
            player1Score: finished.match?.players[0]?.score,
            player2Score: finished.match?.players[1]?.score,
            winner: finished.match.winner?.username,
        });
    }
}

export async function endGameAndErrors(
    data: string,
    gameId: number,
    player1: Player | undefined,
    player2: Player | undefined,
    scores: Score | undefined,
    ball: Ball | undefined
) {
    let finBool = 0;
    if (!ball || !player1 || !player2 || !scores) return;

    if (data == 'GameAlreadyFinished') {
        endGame(finBool, gameId, player1, player2, scores, ball);
        finBool = 1;
        return;
    }
    if (data == 'GameNotFound') return;
    if (data == 'noActiveGame') {
        showToast(t('noActiveGame'), 'error');
        console.warn(t('noActiveGame'));
    } else {
        const ws = getGameSocket();
        if (!ws) {
            showToast('Internal error no WS', 'error');
            console.warn('Internal error no WS');
            navigateTo('dashboard', false, true);
            return;
        }
        ws?.destroy();
        console.warn(t('GameError'));
        navigateTo('dashboard', false, true);
    }
}
