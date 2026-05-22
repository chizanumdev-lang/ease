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
export function canAutoPlayAudio(user: User | null, autoPlayEnabled: boolean, track?: any): boolean {
    // Auto-play must be explicitly enabled
    if (!autoPlayEnabled) {
        console.log('[SLEEP_WINDOW] Auto-play disabled');
        return false;
    }

    const isSleep = isWithinSleepWindow(user);
    const isNightTrack = track?.type === 'night' || track?.type === 'subliminal';

    if (isSleep) {
        if (isNightTrack) {
            console.log('[SLEEP_WINDOW] Night track within sleep window, auto-play allowed');
            return true;
        } else {
            // Option to still allow or block normal tracks. Let's just allow it for now or block if not a night track.
            console.log('[SLEEP_WINDOW] Normal track within sleep window, auto-play blocked to prevent startling');
            return false;
        }
    }

    console.log('[SLEEP_WINDOW] Auto-play allowed outside sleep window');
    return true;
}
