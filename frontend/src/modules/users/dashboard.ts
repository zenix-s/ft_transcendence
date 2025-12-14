import { getStats } from '@/modules/users';
import { t } from '@/app/i18n';
import type { User } from '@/types/user';
import { renderAvatar } from '@/components/renderAvatar';
import { resumeMatchBtn } from '@/components/resumeMatchBtn';

export async function loadDashboard(user: User) {
    const userStats = await getStats(user.id);

    if (!userStats) {
        console.warn(t('UserNotFound'));
        return;
    }

    // Actualizar elementos dinámicos
    const usernameElement = document.getElementById('user-name');
    const avatarElement = document.getElementById('user-avatar');
    const totalGamesElement = document.getElementById('user-total-games');

    // Actualizar texto
    if (usernameElement) {
        usernameElement.textContent = user.username;
    }

    renderAvatar(user, avatarElement);

    if (totalGamesElement) {
        totalGamesElement.textContent = userStats.totalMatches;
    }

    // Aquí llamamos al botón de reanudar partida
    resumeMatchBtn();
}
