import { navigateTo } from '@/app/navigation';
import { fetchSinglePlayerGameId } from './getData';
import { showToast } from '@/components/toast.js';
import { t } from '@/app/i18n';
import { GameDifficulty } from '@/types/gameOptions';
import { createGameSocket } from './gameSocket';

// Guard flag to prevent multiple initialization
let isInitialized = false;
let readyButton: HTMLElement | null = null;
let pointsRange: HTMLInputElement | null = null;
let pointsValue: HTMLElement | null = null;
let timeRange: HTMLInputElement | null = null;
let timeValue: HTMLElement | null = null;

// Named handler function for proper cleanup
const handleReadyClick = async (event: Event) => {
    event.preventDefault();

    console.log('Ready button clicked');

    const difficulty = (
        document.querySelector(
            "input[name='diff-radio']:checked"
        ) as HTMLInputElement
    )?.value;
    const maxPoints = pointsRange?.value;
    const maxTime = timeRange?.value;
    const playerView = (
        document.querySelector(
            "input[name='mode-radio']:checked"
        ) as HTMLInputElement
    )?.value;

    if (!difficulty || !maxPoints || !playerView) {
        showToast(t('DiffAndMax'), 'error');
        console.warn('DiffAndMax');
        navigateTo('dashboard', false, true);
        return;
    }
    let AIdiff = GameDifficulty.NORMAL;
    if (difficulty === 'easy') AIdiff = GameDifficulty.EASY;
    else if (difficulty === 'hard') AIdiff = GameDifficulty.HARD;
    const createResult = await fetchSinglePlayerGameId(
        Number(maxPoints),
        AIdiff,
        Number(maxTime),
        playerView
    );
    if (!createResult.isSuccess || !createResult.gameId) {
        showToast(t(createResult.error || 'NoGameId'), 'error');
        navigateTo('dashboard', false, true);
        return;
    }
    const token = localStorage.getItem('access_token');
    createGameSocket(token, createResult.gameId);

    navigateTo(`playing?id=${createResult.gameId}`);
};

// Named handler for points range input
const handlePointsInput = () => {
    if (pointsValue && pointsRange) {
        pointsValue.textContent = pointsRange.value;
    }
};

// Named handler for time range input
const handleTimeInput = () => {
    if (timeValue && timeRange) {
        timeValue.textContent = timeRange.value;
    }
};

export function ready1() {
    // Cleanup first to ensure clean state
    cleanupReady1();
    
    isInitialized = true;
    
    // Initialize all elements
    readyButton = document.getElementById('ready-button');
    pointsRange = document.getElementById('points-range') as HTMLInputElement;
    pointsValue = document.getElementById('points-value');
    timeRange = document.getElementById('time-range') as HTMLInputElement;
    timeValue = document.getElementById('time-value');

    // Add event listeners
    readyButton?.addEventListener('click', handleReadyClick, { once: true });
    
    if (pointsRange && pointsValue) {
        pointsValue.textContent = pointsRange.value; // Set initial value
        pointsRange.addEventListener('input', handlePointsInput);
    }
    
    if (timeRange && timeValue) {
        timeValue.textContent = timeRange.value; // Set initial value
        timeRange.addEventListener('input', handleTimeInput);
    }
}

// Cleanup function for when leaving the page
export function cleanupReady1() {
    if (isInitialized) {
        // Remove all event listeners
        if (readyButton) {
            readyButton.removeEventListener('click', handleReadyClick);
        }
        if (pointsRange) {
            pointsRange.removeEventListener('input', handlePointsInput);
        }
        if (timeRange) {
            timeRange.removeEventListener('input', handleTimeInput);
        }
    }
    
    // Reset all references (always, even if not initialized)
    readyButton = null;
    pointsRange = null;
    pointsValue = null;
    timeRange = null;
    timeValue = null;
    isInitialized = false;
}
