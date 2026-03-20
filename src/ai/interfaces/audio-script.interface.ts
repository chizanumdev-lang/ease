export interface AudioScriptData {
  sessionType: 'focus' | 'relaxation' | 'meditation' | 'sleep';
  binauralFrequency: number;
  carrierFrequency: number;
  affirmations: string[];
  backgroundNarration: string;
  theme: string;
}
