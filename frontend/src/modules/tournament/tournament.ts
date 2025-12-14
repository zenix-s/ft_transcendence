import { apiUrl } from '@/api';
import { t } from '@/app/i18n';
import { renderButtons } from '@/app/main';
import { navigateTo } from '@/app/navigation';
import { countInputLenght } from '@/components/inputCounter';
import { showToast } from '@/components/toast';
import { updateSliders } from '@/components/updateSliders';

export function tournament() {
    renderButtons();
    updateSliders();
    createTournament();
}

/* CREATE NEW TOURNAMENT */
export function createTournament(): void {
    const tournamentForm = document.getElementById(
        'tournamentForm'
    ) as HTMLFormElement | null;

    if (!tournamentForm) {
        console.error('Tournament form not found');
        return;
    }

    /* Char counter */
    const tournamentInput = tournamentForm.querySelector<HTMLInputElement>(
        'input[name="tournament-name"]'
    );

    if (tournamentInput) {
        countInputLenght(tournamentInput);
    }

    const handleSubmit = async (e: Event) => {
        e.preventDefault();

        const formData = new FormData(tournamentForm);

        const tournamentname = formData.get('tournament-name');
        const points = Number(formData.get('points-range'));
        const time = Number(formData.get('time-range'));

        const rawMode = formData.get('mode-radio');
        const mode =
            typeof rawMode === 'string' ? rawMode.toLowerCase() : '';

        /* Validate all fields are filled */
        if (
            typeof tournamentname !== 'string' ||
            !tournamentname ||
            !Number.isFinite(points) ||
            points <= 0 ||
            !Number.isFinite(time) ||
            time <= 0 ||
            !mode
        ) {
            showToast(t('fillAllFields'), 'error');
            return;
        }

        /* Validate Tournament Name
           3–40 characters
           Only letters, numbers, hyphens, and underscores
        */
        const tournamentNameRegex = /^[a-zA-Z0-9_-]{3,40}$/;
        if (!tournamentNameRegex.test(tournamentname)) {
            showToast(t('invalidTournamentName'), 'error');
            return;
        }

        try {
            const response = await fetch(apiUrl(`/tournaments/pong`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${
                        localStorage.getItem('access_token') || ''
                    }`,
                },
                body: JSON.stringify({
                    name: tournamentname,
                    matchSettings: {
                        maxScore: points,
                        maxGameTime: time,
                        visualStyle: mode,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorCode =
                    typeof data?.error === 'string'
                        ? data.error
                        : 'ErrorCreatingTournament';

                showToast(t(errorCode), 'error');
                return;
            }

            showToast(t('TournamentCreatedSuccessfully'));
            tournamentForm.reset();

            navigateTo('dashboard');
        } catch (err) {
            console.error(err);
            showToast(t('NetworkOrServerError'), 'error');
        }
    };

    // Evita listeners duplicados
    tournamentForm.addEventListener('submit', handleSubmit, { once: true });
}


export async function joinTournament(tournamentId: number) {
    try {
        const response = await fetch(
            apiUrl(`/tournaments/pong/tournaments/${tournamentId}/join`),
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const errorcode = data.error || 'ErrorJoiningTournament';
            showToast(t(errorcode), 'error');
            return;
        }

        showToast(t('JoinedTournamentSuccessfully'));
        return;
    } catch {
        showToast(t('ErrorJoiningTournament'), 'error');
        return;
    }
}
