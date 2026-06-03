export interface AudioScriptData {
  sessionType: 'focus' | 'relaxation' | 'meditation' | 'sleep';
  binauralFrequency: number;
  carrierFrequency: number;
  affirmations: string[];
  introNarration: string;
  outroNarration: string;
  theme: string;
}
