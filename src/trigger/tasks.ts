import { task, tasks } from '@trigger.dev/sdk/v3';

/**
 * Background task: Hydrate a day plan with AI-generated content.
 * This runs on Trigger.dev's infrastructure, not on Vercel serverless.
 */
export const hydrateDayTask = task({
  id: 'hydrate-day',
  retry: {
    maxAttempts: 5,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
    factor: 2,
  },
  run: async (payload: {
    dayPlanId: string;
    goalText: string;
    params: Record<string, any>;
    appUrl: string;
    internalKey?: string;
  }) => {
    // Call back to our NestJS API to perform the hydration
    // This keeps all business logic in the NestJS app
    const res = await fetch(`${payload.appUrl}/api/internal/hydrate-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': payload.internalKey || process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        dayPlanId: payload.dayPlanId,
        goalText: payload.goalText,
        params: payload.params,
      }),
    });

    if (!res.ok) {
      throw new Error(`Hydration failed: ${res.status} ${await res.text()}`);
    }

    return await res.json();
  },
});

/**
 * Background task: Generate audio for a track.
 * Long-running TTS + audio mixing that can't complete in serverless timeouts.
 */
export const generateAudioTask = task({
  id: 'generate-audio',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
    factor: 2,
  },
  run: async (payload: {
    audioTrackId: string;
    theme: string;
    audioFilename: string;
    appUrl: string;
    internalKey?: string;
  }) => {
    const res = await fetch(`${payload.appUrl}/api/internal/generate-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': payload.internalKey || process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        audioTrackId: payload.audioTrackId,
        theme: payload.theme,
        audioFilename: payload.audioFilename,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Audio generation failed: ${res.status} ${await res.text()}`,
      );
    }

    return await res.json();
  },
});

/**
 * Helper: Trigger a background task with graceful fallback.
 * Returns null if Trigger.dev is not configured (dev mode).
 */
export async function triggerHydrateDay(payload: {
  dayPlanId: string;
  goalText: string;
  params: Record<string, any>;
}) {
  try {
    const appUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    const internalKey = process.env.INTERNAL_API_KEY || '';

    return await tasks.trigger('hydrate-day', { ...payload, appUrl, internalKey });
  } catch (err) {
    // Trigger.dev not configured or unreachable — caller should handle synchronously
    return null;
  }
}

export async function triggerGenerateAudio(payload: {
  audioTrackId: string;
  theme: string;
  audioFilename: string;
}) {
  try {
    const appUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    const internalKey = process.env.INTERNAL_API_KEY || '';

    return await tasks.trigger('generate-audio', { ...payload, appUrl, internalKey });
  } catch (err) {
    return null;
  }
}
