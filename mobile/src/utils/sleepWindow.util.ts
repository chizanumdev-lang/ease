import { User } from '../types';

/**
 * Check if current time is within user's sleep window
 */
export function isWithinSleepWindow(user: User | null): boolean {
    if (!user?.settings?.sleepWindow) return false;

    const { start, end } = user.settings.sleepWindow;
    if (!start || !end) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight

    // Parse sleep window times (format: "HH:MM")
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight sleep window (e.g., 22:00 to 06:00)
    if (startTime > endTime) {
        return currentTime >= startTime || currentTime < endTime;
    }

    // Normal sleep window (e.g., 01:00 to 08:00)
    return currentTime >= startTime && currentTime < endTime;
}

/**
 * Check if audio can auto-play based on settings and sleep window
 */
export function canAutoPlayAudio(user: User | null, autoPlayEnabled: boolean): boolean {
    // Auto-play must be explicitly enabled
    if (!autoPlayEnabled) {
        console.log('[SLEEP_WINDOW] Auto-play disabled');
        return false;
    }

    // Check sleep window
    if (isWithinSleepWindow(user)) {
        console.log('[SLEEP_WINDOW] Within sleep window, auto-play blocked');
        return false;
    }

    console.log('[SLEEP_WINDOW] Auto-play allowed');
    return true;
}
