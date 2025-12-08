import { t } from '@/app/i18n';
import { navigateTo } from '@/app/navigation';
import { showToast } from '@/components/toast';
import { apiUrl } from '@/api';

//////
// NEED TO UPDATE TO TOURNAMENTS!!!!!
//////

export async function addFriend(friendUsername: string): Promise<boolean> {
    if (!friendUsername || !friendUsername.trim()) {
        showToast(t('fillAllFields'), 'error');
        return false;
    }

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.warn(t('NoTokenFound'));
            showToast(t('NoTokenFound'), 'error');
            navigateTo('login');
            return false;
        }

        const response = await fetch(apiUrl(`/friendship`), {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ friendUsername }),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorcode = data.error || 'UserNotFound';
            showToast(t(errorcode), 'error');
            return false;
        }

        showToast(t('FriendAddedSuccessfully'));
        return true;
    } catch {
        showToast(t('NetworkOrServerError'), 'error');
        return false;
    }
}

export async function deleteFriend(friendUsername: string): Promise<boolean> {
    if (!friendUsername || !friendUsername.trim()) {
        showToast(t('fillAllFields'), 'error');
        return false;
    }

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.warn(t('NoTokenFound'));
            showToast(t('NoTokenFound'), 'error');
            navigateTo('login');
            return false;
        }

        const response = await fetch(apiUrl(`/friendship/${friendUsername}`), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json().catch(() => ({})); // evita crash si no hay body

        if (!response.ok) {
            const errorcode = data.error || 'DeletionError';
            showToast(t(errorcode), 'error');
            return false;
        }

        showToast(t('FriendRemovedSuccessfully'));
        return true;
    } catch {
        showToast(t('NetworkOrServerError'), 'error');
        return false;
    }
}
