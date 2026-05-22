import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';
import { AiService } from '../../ai/ai.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class YoutubeService {
  private youtube: youtube_v3.Youtube;
  private readonly logger = new Logger(YoutubeService.name);

  constructor(
    private configService: ConfigService,
    private aiService: AiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'YOUTUBE_API_KEY not set. YouTube features will not work.',
      );
    }
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  async getRecommendedVideo(
    topic: string,
    prebuiltQuery?: string,
  ): Promise<any> {
    // 1. Check Cache
    const cacheKey = `yt_rec_${topic.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.log(`Using cached video for topic: ${topic}`);
      return cached;
    }

    // 2. Use prebuilt query if provided (avoids an extra Gemini API call)
    let query: string;
    if (prebuiltQuery && prebuiltQuery.trim()) {
      query = prebuiltQuery.trim();
      this.logger.log(`Using prebuilt query for "${topic}": "${query}"`);
    } else {
      query = await this.aiService.generateSearchQuery(topic);
      this.logger.log(`Generated query for "${topic}": "${query}"`);
    }

    // 3. Search YouTube
    const searchResults = await this.searchVideos(query);
    if (!searchResults || searchResults.length === 0) {
      this.logger.warn(`No videos found for query: ${query}`);
      return { error: 'No suitable video found' };
    }

    // 4. Get Video Details & Validate
    const videoIds = searchResults
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    const validVideos = await this.getVideoDetailsAndRank(videoIds);

    if (validVideos.length === 0) {
      this.logger.warn(
        `No valid videos found after filtering for query: ${query}`,
      );
      // Return a high-quality fallback focus/productivity video instead of a search page
      return {
        url: 'https://www.youtube.com/watch?v=inpok4MKVLM',
        title: 'Deep Focus & Consistency Protocol',
        channel: 'Ease Focus Labs',
      };
    }

    const bestVideo = validVideos[0];
    const result = {
      title: bestVideo.snippet?.title || 'Unknown Title',
      videoId: bestVideo.id,
      url: `https://www.youtube.com/watch?v=${bestVideo.id}`,
      thumbnail:
        bestVideo.snippet?.thumbnails?.high?.url ||
        bestVideo.snippet?.thumbnails?.default?.url ||
        '',
      channel: bestVideo.snippet?.channelTitle || 'Unknown Channel',
      description: bestVideo.snippet?.description || '',
    };

    // 5. Cache Result (24 hours)
    await this.cacheManager.set(cacheKey, result, 24 * 60 * 60 * 1000);

    return result;
  }

  private async searchVideos(query: string) {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults: 10, // Fetch more to allow for filtering
        order: 'relevance',
        videoEmbeddable: 'true',
      });
      return response.data.items || [];
    } catch (error) {
      this.logger.error(`YouTube Search failed: ${error.message}`);
      return [];
    }
  }

  private async getVideoDetailsAndRank(videoIds: string[]) {
    try {
      if (videoIds.length === 0) return [];

      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics', 'status'],
        id: videoIds,
      });

      const videos = response.data.items || [];

      // Filter & Rank
      return videos
        .filter((video) => {
          if (!video.status || !video.contentDetails) return false;

          const isPublic = video.status.privacyStatus === 'public';
          const isEmbeddable = video.status.embeddable;
          const duration = this.parseDuration(
            video.contentDetails.duration || '',
          );
          const isNotShort = duration > 60; // Filter out shorts (< 1 min)
          const isNotTooLong = duration < 45 * 60; // Max 45 mins

          // Enforce English if a language is explicitly set
          const lang =
            video.snippet?.defaultAudioLanguage ||
            video.snippet?.defaultLanguage;
          const isEnglishOrUnknown = !lang || lang.startsWith('en');

          return (
            isPublic &&
            isEmbeddable &&
            isNotShort &&
            isNotTooLong &&
            isEnglishOrUnknown
          );
        })
        .sort((a, b) => {
          // Rank by view count (descending)
          const viewsA = parseInt(a.statistics?.viewCount || '0', 10);
          const viewsB = parseInt(b.statistics?.viewCount || '0', 10);
          return viewsB - viewsA;
        });
    } catch (error) {
      this.logger.error(`YouTube Video Details failed: ${error.message}`);
      return [];
    }
  }

  async getBestRitualAudio(
    topic: string,
    type: 'morning' | 'night',
  ): Promise<any> {
    const cacheKey = `yt_ritual_${type}_${topic.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // 1. Construct specialized query
    let query: string;
    if (type === 'morning') {
      query = `${topic} positive morning affirmations high quality`;
    } else {
      query = `${topic} subliminal audio binaural beats no talking`;
    }

    this.logger.log(`Searching YouTube for ${type} ritual: "${query}"`);

    // 2. Search
    const searchResults = await this.searchVideos(query);
    if (!searchResults || searchResults.length === 0) {
      this.logger.warn(`No ritual videos found for query: ${query}`);
      return null;
    }

    // 3. Filter and Rank for RITUAL criteria
    // Rituals need to be clean, so we filter more strictly.
    const videoIds = searchResults
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    const videos = await this.getVideoDetailsAndRank(videoIds);

    // 4. Score and filter
    const scored = videos.map((video) => {
      const title = video.snippet?.title || '';
      const desc = video.snippet?.description || '';
      const duration = this.parseDuration(video.contentDetails?.duration || '');

      let score = 0;
      const themeLower = topic.toLowerCase();
      const titleLower = title.toLowerCase();

      // Keyword Matching
      const themeWords = themeLower.split(' ').filter((w) => w.length > 2);
      const matchCount = themeWords.filter(
        (word) =>
          titleLower.includes(word) || desc.toLowerCase().includes(word),
      ).length;
      score += (matchCount / Math.max(themeWords.length, 1)) * 40; // Up to 40 points for topic match (in title OR description)

      // Type Matching
      if (type === 'morning') {
        if (titleLower.includes('affirmation')) score += 20;
        if (titleLower.includes('morning')) score += 10;
        if (titleLower.includes('positive')) score += 10;
        if (duration >= 300 && duration <= 600) score += 10; // Ideal 5-10 mins
      } else {
        // night
        if (titleLower.includes('subliminal')) score += 20;
        if (titleLower.includes('sleep') || titleLower.includes('night'))
          score += 10;
        if (titleLower.includes('binaural') || titleLower.includes('432'))
          score += 10;
        if (duration >= 600) score += 10; // Ideal 10+ mins
      }

      // Popularity bonus (high view count = likely quality)
      const views = parseInt(video.statistics?.viewCount || '0', 10);
      if (views > 1_000_000) score += 15;
      else if (views > 100_000) score += 10;
      else if (views > 10_000) score += 5;

      return { video, score };
    });

    // Additional Ritual-Specific Ranking
    const ranked = scored
      .filter((s) => s.score >= 15) // Lowered: type-keyword match alone (e.g. "affirmation") is enough
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      this.logger.warn(
        `No relevant YouTube video found for topic: ${topic} (Ranked results were too low score)`,
      );
      return null;
    }

    const best = ranked[0];
    const result = {
      title: best.video.snippet?.title || 'Unknown Title',
      videoId: best.video.id,
      url: `https://www.youtube.com/watch?v=${best.video.id}`,
      thumbnail: best.video.snippet?.thumbnails?.high?.url || '',
      channel: best.video.snippet?.channelTitle || 'Unknown Channel',
      relevanceScore: best.score,
    };

    await this.cacheManager.set(cacheKey, result, 7 * 24 * 60 * 60 * 1000); // 1 week cache
    return result;
  }

  private parseDuration(isoDuration: string): number {
    // PT1H2M10S -> seconds
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }
}
