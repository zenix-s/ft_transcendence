import { t, updateTexts } from '@/app/i18n';
import Swal from 'sweetalert2';
import type { SweetAlertIcon } from 'sweetalert2';
import type { GameOptions } from '@/types/gameOptions';
import type { ActiveTournament } from '@/types/tournamentsTypes';

export async function modal({
    type = 'logout',
    player1Score,
    player2Score,
    winner,
    playerColor,
    gameName,
    activeTournament,
    tournamentModal = false,
}: {
    type?:
        | 'logout'
        | 'gameFinished'
        | 'gameInvitation'
        | 'setReady'
        | 'gameCreation'
        | 'tournamentResults'
        | 'confirmLeaveTournament';
    player1Score?: number;
    player2Score?: number;
    winner?: string;
    playerColor?: string;
    gameName?: string;
    activeTournament?: ActiveTournament;
    tournamentModal?: boolean;
} = {}): Promise<boolean | GameOptions> {
    const isDark = !document.documentElement.classList.contains('dark');

    /* GENERAL AND DEFAULT OPTIONS*/
    let title = 'Action completed!';
    let titleText = 'Action completed!';
    let text = 'Everything went well.';
    let confirmButtonText = 'OK';
    let cancelButtonText = 'Cancel';
    let showCancelButton = false;
    const iconColor = '#00d3f2';
    const animation = true;
    let icon_msg: SweetAlertIcon | undefined = 'success';
    const color_modal = isDark ? '#131313' : '#fff';
    const color_back = isDark ? '#fff' : '#131313';
    const backdrop = 'rgba(0,0,0,0.8)';
    let allowOutsideClick = true;
    let allowEscapeKey = true;
    let position = 'center';

    /* Overwrite options */
    if (type === 'logout') {
        title = t('modalLogoutTitle');
        titleText = t('modalLogoutTitleText');
        text = t('modalLogoutText');
        confirmButtonText = t('modalLogoutConfirmButtonText');
        showCancelButton = true;
        cancelButtonText = t('modalLogoutCancelButtonText');
        icon_msg = 'warning';
    } else if (type === 'gameFinished') {
        const winnerName = winner;
        const scoreText = `${player1Score ?? 0} - ${player2Score ?? 0}`;

        let Winner = t('Winner');
        if (Winner === 'AI_Player') Winner = t('AI');
        const Unknown = t('Unknown');
        const FinalScore = t('FinalScore');
        title = t('gameFinished');
        titleText = `🏆 ${Winner}: ${winnerName ?? Unknown}`;
        text = `${FinalScore}: ${scoreText}`;
        confirmButtonText = t('Return');
        icon_msg = undefined;
    } else if (type === 'setReady') {
        title = t('SetReady');
        let GameInfo = t('GameInfoBlue');
        if (playerColor === 'red') GameInfo = t('GameInfoRed');
        titleText = `${t('isReady')}\n\n${GameInfo}\n${t('GameMove')}`;
        confirmButtonText = t('Ready');
        text = `${t('ClickReady')}<br><br><b></b>`;
        icon_msg = 'question';
        showCancelButton = true;
        cancelButtonText = t('Cancel');
        allowOutsideClick = false;
        allowEscapeKey = false;
    } else if (type === 'gameInvitation') {
        title = t('modalGameInvitationTitle');
        titleText = t('modalGameInvitationTitleText');
        const nameOfGame = gameName ? gameName : '';
        text = winner
            ? `${winner} ${t('modalGameInvitationText')} ${nameOfGame}`
            : `${t('modalTournamentGameInvitationText')}`;
        confirmButtonText = `<i class="fa fa-thumbs-up"></i> ${t('modalGameInvitationConfirmButtonText')}`;
        showCancelButton = tournamentModal ? false : true;
        position = tournamentModal ? 'top-end' : 'center';
        cancelButtonText = `<i class="fa fa-thumbs-down"></i> ${t('modalGameInvitationCancelButtonText')}`;
        icon_msg = 'question';
        allowOutsideClick = false;
        allowEscapeKey = false;
    } else if (type === 'gameCreation') {
        title = t('modalGameCreationTitle');
        titleText = t('modalGameCreationTitleText');
        confirmButtonText = `<i class="fa fa-thumbs-up"></i> ${t('modalGameCreationConfirmButtonText')}`;
        showCancelButton = true;
        cancelButtonText = `<i class="fa fa-thumbs-down"></i> ${t('modalGameCreationCancelButtonText')}`;
        icon_msg = undefined;
    } else if (type === 'tournamentResults' && activeTournament) {
        const tournamentName = activeTournament.name;
        title = `${t('tournament')}: ${tournamentName}`;
        titleText = `${t('tournament')}: ${tournamentName}`;
        const winnerParticipant = activeTournament.bracket?.winner;
        const winnerName = winnerParticipant
            ? winnerParticipant.username
            : t('Unknown');
        console.log('Tournament Winner Name:', winnerName);
        const status = activeTournament.status;
        const statusText =
            status === 'ongoing'
                ? t('inProgress')
                : status === 'completed'
                  ? t('completed')
                  : t('Unknown');
        text = `
        <div>
          <span class="font-thin ">${t('status')}: ${statusText}</span><br>
          ${winnerName !== t('Unknown') ? `<strong>${t('winner')}: </strong> 🏆 ${winnerName} 🏆` : ''}
        </div>
        <hr class="my-3 opacity-40">
        <div id="tournament-table" class="text-left"></div>
      `;
        confirmButtonText = t('Return');
        icon_msg = 'info';
    } else if (type === 'confirmLeaveTournament') {
        title = t('modalConfirmLeaveTournamentTitle');
        titleText = t('modalConfirmLeaveTournamentTitle');
        text = t('modalConfirmLeaveTournamentText');
        confirmButtonText = t('modalConfirmLeaveTournamentConfirmButtonText');
        showCancelButton = true;
        cancelButtonText = t('modalConfirmLeaveTournamentCancelButtonText');
        icon_msg = 'warning';
    } else {
        return false; // Tipo no reconocido
    }

    /* TIMER LOGIC FOR SET READY */
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    /* MAIN LOGIC */
    if (
        type !== 'gameCreation' &&
        type !== 'tournamentResults' &&
        type !== 'gameInvitation'
    ) {
        const result = await Swal.fire({
            title,
            titleText,
            html: text,
            color: color_modal,
            icon: icon_msg,
            iconColor,
            showCancelButton,
            cancelButtonText: cancelButtonText,
            //cancelButtonColor: "#F00",
            confirmButtonText,
            buttonsStyling: false, // to use our own classes
            background: color_back,
            backdrop: backdrop,
            allowOutsideClick: allowOutsideClick,
            allowEscapeKey: allowEscapeKey,
            animation,
            timer: type === 'setReady' ? 30000 : undefined,
            timerProgressBar: type === 'setReady',
            customClass: {
                actions: 'gap-10',
                confirmButton:
                    'px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300',
                cancelButton:
                    'px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300',
            },
            didOpen: () => {
                if (type === 'setReady') {
                    const timerEl = Swal.getHtmlContainer()?.querySelector('b');

                    timerInterval = setInterval(() => {
                        if (timerEl)
                            timerEl.textContent =
                                Math.ceil(Swal.getTimerLeft()! / 1000) + 's';
                    }, 200);
                }
            },
            willClose: () => {
                if (timerInterval) clearInterval(timerInterval);
            },
        });
        if (result.isConfirmed) {
            if (type === 'logout') {
                await Swal.fire({
                    title: t('modalLogoutIsConfirmedTitle'),
                    titleText: t('modalLogoutIsConfirmedTitle'),
                    text:
                        type === 'logout'
                            ? t('modalLogoutIsConfirmedText')
                            : 'Action completed successfully.',
                    color: color_modal,
                    icon: 'success',
                    iconColor,
                    confirmButtonText: t(
                        'modalLogoutIsConfirmedConfirmButtonText'
                    ),
                    background: color_back,
                    backdrop: backdrop,
                    buttonsStyling: false,
                    customClass: {
                        confirmButton:
                            'px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300',
                    },
                });
            }
            return true;
        } else {
            return false;
        }
    } else if (type === 'gameInvitation') {
        const result = await Swal.fire({
            title,
            titleText,
            html: text,
            color: color_modal,
            icon: icon_msg,
            iconColor,
            showCancelButton,
            cancelButtonText: cancelButtonText,
            position,
            confirmButtonText,
            buttonsStyling: false, // to use our own classes
            background: color_back,
            backdrop: backdrop,
            allowOutsideClick: allowOutsideClick,
            allowEscapeKey: allowEscapeKey,
            animation,
            customClass: {
                actions: 'gap-10',
                confirmButton:
                    'px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300',
                cancelButton:
                    'px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300',
            },
        });
        if (result.isConfirmed) {
            return true;
        } else {
            return false;
        }
    } else if (type === 'gameCreation') {
        // Caso: gameCreation
        const { value: formValues } = await Swal.fire({
            title,
            titleText,
            color: color_modal,
            icon: undefined,
            showCancelButton,
            cancelButtonText: cancelButtonText,
            //cancelButtonColor: "#F00",
            confirmButtonText,
            buttonsStyling: false, // to use our own classes
            background: color_back,
            backdrop: backdrop,
            allowOutsideClick: allowOutsideClick,
            allowEscapeKey: allowEscapeKey,
            animation,
            customClass: {
                title: 'text-balance',
                actions: 'gap-10',
                confirmButton:
                    'px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300',
                cancelButton:
                    'px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300',
            },
            html: `
          <div class="flex flex-col gap-4 text-left">
          
          <!-- Puntos máximos -->
          <div class="flex flex-col gap-2">
            <label for="points-range" class="font-medium" role="tooltip" data-i18n="modalGameCreationmaxPoints">
              Points: <span id="points-value" class="font-semibold">5</span>
            </label>
            <input
              id="points-range"
              type="range"
              class="swal2-range accent-cyan-400"
              min="3" max="15" value="5" step="1"
            >
          </div>

          <!-- Tiempo máximo -->
          <div class="flex flex-col gap-2">
            <label for="time-range" class="font-medium" role="tooltip" data-i18n="modalGameCreationMaxTime">
              Time: <span id="time-value" class="font-semibold">120</span> s
            </label>
            <input
              id="time-range"
              type="range"
              class="swal2-range accent-cyan-400"
              min="30" max="300" value="120" step="30"
            >
          </div>

          <!-- Modo de juego -->
          <div class="flex flex-col gap-2">
            <p class="font-medium" data-i18n="modalGameCreationGameMode">Mode:</p>
            <div class="flex justify-center gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  id="mode-2d"
                  name="mode-radio"
                  value="2d"
                  class="swal2-radio accent-cyan-400"
                  checked
                >
                <span data-i18n="2D">2D</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  id="mode-3d"
                  name="mode-radio"
                  value="3d"
                  class="swal2-radio accent-cyan-400"
                >
                <span data-i18n="3D">3D</span>
              </label>
            </div>
          </div>
        </div>
        `,
            focusConfirm: false,
            didOpen: () => {
                // Traducción después de insertar el HTML
                updateTexts();

                // Actualizar valores dinámicos de los sliders
                const pointsRange = document.getElementById(
                    'points-range'
                ) as HTMLInputElement;
                const pointsValue = document.getElementById('points-value')!;
                pointsRange.addEventListener('input', () => {
                    pointsValue.textContent = pointsRange.value;
                });

                const timeRange = document.getElementById(
                    'time-range'
                ) as HTMLInputElement;
                const timeValue = document.getElementById('time-value')!;
                timeRange.addEventListener('input', () => {
                    timeValue.textContent = timeRange.value;
                });
            },
            preConfirm: (): GameOptions => {
                const pointsInput = document.getElementById(
                    'points-range'
                ) as HTMLInputElement | null;
                const timeInput = document.getElementById(
                    'time-range'
                ) as HTMLInputElement | null;

                if (!pointsInput || !timeInput) {
                    Swal.showValidationMessage(
                        'No se pudieron leer los valores de los sliders.'
                    );
                    return {} as GameOptions; // devolver objeto vacío temporalmente
                }

                const points = Number(pointsInput.value);
                const time = Number(timeInput.value);
                const modeInput = document.querySelector(
                    'input[name="mode-radio"]:checked'
                ) as HTMLInputElement;

                const mode = modeInput?.value ?? '2d';

                return { maxPoints: points, maxTime: time, gameMode: mode };
            },
        });

        if (formValues) {
            // opcional: mostrar un resumen
            /* await Swal.fire({
          title: "Selected options",
          html: `<pre>${JSON.stringify(formValues, null, 2)}</pre>`,
          confirmButtonText: "OK"
        }); */

            return formValues; // Hay que devolver los datos en lugar de true
        } else return false;
    } else if (type === 'confirmLeaveTournament') {
        // Caso: confirmLeaveTournament
        const result = await Swal.fire({
            title,
            titleText,
            html: text,
            color: color_modal,
            icon: icon_msg,
            iconColor,
            showCancelButton,
            cancelButtonText: cancelButtonText,
            //cancelButtonColor: "#F00",
            confirmButtonText,
            buttonsStyling: false, // to use our own classes
            background: color_back,
            backdrop: backdrop,
            allowOutsideClick: allowOutsideClick,
            allowEscapeKey: allowEscapeKey,
            animation,
            customClass: {
                actions: 'gap-10',
                confirmButton:
                    'px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300',
                cancelButton:
                    'px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300',
            },
        });
        if (result.isConfirmed) {
            return true;
        } else {
            return false;
        }
    } else {
        // Caso: tournamentResults
        // Definir modal para resultados de torneo
        await Swal.fire({
            title,
            titleText,
            html: text,
            color: color_modal,
            icon: '',
            iconColor,
            showConfirmButton: true,
            confirmButtonText,
            buttonsStyling: false, // to use our own classes
            background: color_back,
            backdrop: backdrop,
            allowOutsideClick: allowOutsideClick,
            allowEscapeKey: allowEscapeKey,
            animation,
            customClass: {
                actions: 'gap-10',
                confirmButton:
                    'px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300',
            },
            didOpen: () => {
                const container = document.getElementById('tournament-table');
                if (!container) return;

                // 👉 aquí creas la tabla dinámicamente según ActiveTournament
                const table = buildTournamentTable(activeTournament);
                container.appendChild(table);

                // Traducción después de insertar el HTML
                updateTexts();
            },
        });

        return true;
    }
}

function buildTournamentTable(
    activeTournament: ActiveTournament | undefined
): HTMLTableElement {
    const participants = activeTournament?.participants ?? [];

    // Ordenar por score descendiente
    const sorted = [...participants].sort((a, b) => b.score - a.score);

    // Crear tabla
    const table = document.createElement('table');
    table.className = 'swal2-table w-full border-collapse text-left';

    // Crear head
    const thead = document.createElement('thead');
    thead.innerHTML = `
    <tr>
      <th data-i18n="tournamentPosition" class="py-2 px-3 border-b font-semibold text-center">Posición</th>
      <th data-i18n="tournamentPlayer" class="py-2 px-3 border-b font-semibold text-center">Nombre</th>
      <th data-i18n="tournamentScore" class="py-2 px-3 border-b font-semibold text-center">Score</th>
    </tr>
  `;
    table.appendChild(thead);

    // Crear body
    const tbody = document.createElement('tbody');

    sorted.forEach((p, i) => {
        const row = document.createElement('tr');
        const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;

        if (i === 0) row.classList.add('bg-amber-500', 'dark:text-secondary');
        else if (i === 1)
            row.classList.add('bg-gray-300', 'dark:text-secondary');
        else if (i === 2)
            row.classList.add('bg-yellow-800', 'dark:text-secondary');
        else
            row.classList.add(
                'sm:bg-transparent',
                'text-primary',
                'sm:text-secondary',
                'dark:text-primary'
            );
        row.innerHTML = `
      <td data-label="" data-i18n="tournamentPosition" class="py-2 px-3 border-b text-center">${rank}</td>
      <td data-label="" data-i18n="tournamentPlayer" class="py-2 px-3 border-b text-center">${p.username}</td>
      <td data-label="" data-i18n="tournamentScore" class="py-2 px-3 border-b text-center">${p.score}</td>
    `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    return table;
}
