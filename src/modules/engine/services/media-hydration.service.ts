import { Injectable, Logger } from '@nestjs/common';
import { YoutubeService } from '../../../video/youtube/youtube.service';
import { AudioService } from '../../../audio/audio.service';
import { AiService } from '../../../ai/ai.service';
import { Task } from '../../../tasks/entities/task.entity';

@Injectable()
export class MediaHydrationService {
  private readonly logger = new Logger(MediaHydrationService.name);

  constructor(
    private youtubeService: YoutubeService,
    private audioService: AudioService,
    private aiService: AiService,
  ) {}

  async hydrateSingleTask(
    task: Task,
    goal: string,
    dayPlanId: string,
    pastVideoIds: string[] = [],
  ) {
    if (!task.metadata) {
      task.metadata = {};
    }
    const metadata = task.metadata;

    // 1. Handle VIDEO Hydration (with Retry Loop)
    if (task.type === 'video' && metadata.searchQuery) {
      const videoUrl = await this.fetchVideoWithRetry(
        goal,
        metadata.searchQuery,
        pastVideoIds,
      );
      task.videoUrl = videoUrl;
      const match = videoUrl.match(/v=([^&]+)/);
      if (match) pastVideoIds.push(match[1]);
    }

    if (metadata.pattern === 'vocal-test' || task.type === 'audio') {
      const currentScript =
        metadata.narrationScript ||
        metadata.targetScript ||
        metadata.description ||
        `Session for ${goal}`;
      const wordCount = currentScript.split(/\s+/).filter(Boolean).length;
      if (wordCount < 180) {
        this.logger.log(
          `Initial script is too short (${wordCount} words). Expanding via AI to ensure 4-5 mins of duration.`,
        );
        const expansionPrompt = `
                You are the cognitive elite voice coach for Ease.
                We have an audio lesson for the user's goal: "${goal}".
                The task title is: "${task.title}".
                The current script outline is: "${currentScript}".
                
                Your task is to expand this into a highly detailed, comprehensive, goal-specific voice coaching script of AT LEAST 600 words.
                The voice coach is instructing the student. 
                
                CRITICAL: 
                - The length must be at least 600 words so that the spoken track is 4-5 minutes long.
                - Style: Simple 5th-grade English. NO AI jargon (vital, journey, tailored, embark, comprehensive).
                - Write ONLY the raw text script of the narration. DO NOT include any formatting like "Narrator:", "Host:", bracketed audio cues, asterisks, or markdown formatting. Just write the exact spoken words, paragraphs, and guidance so it can be converted to speech.
                - Pacing & Pauses: If the task involves physical movement, stretching, or breathing, you MUST include explicit spoken count-downs or guided timing (e.g., "Hold this stretch for 15 seconds. Let's count. 15... 14... 13...") to give the user actual time to perform the actions in real-time. Do not rush through the instructions without giving them time to execute.
            `;
        try {
          const expandedScript = await this.aiService.generate(expansionPrompt);
          if (expandedScript && expandedScript.trim().length > 100) {
            metadata.narrationScript = expandedScript.trim();
            this.logger.log(
              `Successfully expanded initial script to ${metadata.narrationScript.split(/\s+/).length} words.`,
            );
          }
        } catch (e) {
          const err = e as Error;
          this.logger.error(`Failed to expand initial script: ${err.message}`);
        }
      }
    }

    // 2. Handle VOCAL TEST Hydration
    if (metadata.pattern === 'vocal-test') {
      const ttsScript =
        metadata.narrationScript ||
        metadata.targetScript ||
        metadata.description ||
        `Practice speaking about ${goal}`;
      const filename = `vocal_model_${dayPlanId}_${task.id}`;
      metadata.audioUrl = await this.audioService.generateAudioTrack(
        ttsScript,
        'calm',
        filename,
        true,
      );
    }

    // 3. Handle AUDIO Hydration
    if (task.type === 'audio' && !metadata.audioUrl) {
      const script =
        metadata.narrationScript ||
        metadata.description ||
        `Session for ${goal}`;
      const filename = `audio_task_${dayPlanId}_${task.id}`;
      metadata.audioUrl = await this.audioService.generateAudioTrack(
        script,
        'focus',
        filename,
      );
    }
  }

  private async fetchVideoWithRetry(
    goal: string,
    query: string,
    excludeVideoIds: string[] = [],
  ): Promise<string> {
    try {
      const video = await this.youtubeService.getRecommendedVideo(
        goal,
        query,
        excludeVideoIds,
      );
      if (video?.url) return video.url;
      throw new Error('No video found');
    } catch (e) {
      const err = e as Error;
      this.logger.warn(
        `Initial video search failed for "${query}". Retrying with goal: "${goal}"`,
      );
      // Retry with broader goal
      const fallback = await this.youtubeService.getRecommendedVideo(
        goal,
        goal,
        excludeVideoIds,
      );
      return fallback?.url || 'https://www.youtube.com/watch?v=inpok4MKVLM';
    }
  }
}
