import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PhaseInfo {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  minLevel: number;
  maxLevel: number;
  levelRange: string;
  unlockedAtLevel: number;
}

export interface ProgressionData {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercentage: number;
  currentPhase: PhaseInfo;
  journey: Array<{
    id: string;
    title: string;
    unlocked: boolean;
    active: boolean;
    imageUrl: string;
    levelRange: string;
    unlockedAtLevel: number;
  }>;
}

@Injectable()
export class ProgressionService {
  private readonly PHASES: PhaseInfo[] = [
    {
      id: 'phase1_seed',
      title: 'Primordial Seed',
      subtitle: 'Pure potential, waiting to awaken.',
      imageUrl: 'https://res.cloudinary.com/duooultxc/image/upload/v1776454648/ease/spirit-tree/phase1_seed.jpg',
      minLevel: 1,
      maxLevel: 5,
      levelRange: 'Level 1 - 5',
      unlockedAtLevel: 1,
    },
    {
      id: 'phase2_sprout',
      title: 'Sprouting Awareness',
      subtitle: 'Your intention begins to take root.',
      imageUrl: 'https://res.cloudinary.com/duooultxc/image/upload/v1776454656/ease/spirit-tree/phase2_sprout.jpg',
      minLevel: 6,
      maxLevel: 15,
      levelRange: 'Level 6 - 15',
      unlockedAtLevel: 6,
    },
    {
      id: 'phase3_sapling',
      title: 'Resilient Sapling',
      subtitle: 'Steady growth through consistent practice.',
      imageUrl: 'https://res.cloudinary.com/duooultxc/image/upload/v1776454668/ease/spirit-tree/phase3_sapling.jpg',
      minLevel: 16,
      maxLevel: 30,
      levelRange: 'Level 16 - 30',
      unlockedAtLevel: 16,
    },
    {
      id: 'phase4_tree',
      title: 'Branching Expansion',
      subtitle: 'Your reach grows as deep as your roots.',
      imageUrl: 'https://res.cloudinary.com/duooultxc/image/upload/v1776454678/ease/spirit-tree/phase4_tree.jpg',
      minLevel: 31,
      maxLevel: 50,
      levelRange: 'Level 31 - 50',
      unlockedAtLevel: 31,
    },
    {
      id: 'phase5_wisdom',
      title: 'Blossoming Wisdom',
      subtitle: 'A peak state of enlightened presence.',
      imageUrl: 'https://res.cloudinary.com/duooultxc/image/upload/v1776454698/ease/spirit-tree/phase5_wisdom.jpg',
      minLevel: 51,
      maxLevel: 80,
      levelRange: 'Level 51 - 80',
      unlockedAtLevel: 51,
    },
    {
      id: 'phase6_ancient',
      title: 'Infinite Ancient',
      subtitle: 'Transcendent connection to the universe.',
      imageUrl: 'https://res.cloudinary.com/duooultxc/image/upload/v1776454714/ease/spirit-tree/phase6_ancient.jpg',
      minLevel: 81,
      maxLevel: 999,
      levelRange: 'Level 81+',
      unlockedAtLevel: 81,
    },
  ];

  constructor(private configService: ConfigService) {}

  getXpForLevel(level: number): number {
    if (level <= 1) return 0;
    // Exponential curve: floor(100 * (level-1)^1.5)
    return Math.floor(100 * Math.pow(level - 1, 1.5));
  }

  getLevelForXp(xp: number): number {
    let level = 1;
    while (this.getXpForLevel(level + 1) <= xp) {
      level++;
    }
    return level;
  }

  getProgression(totalXp: number): ProgressionData {
    const level = this.getLevelForXp(totalXp);
    const xpForCurrentLevel = this.getXpForLevel(level);
    const xpForNextLevel = this.getXpForLevel(level + 1);
    
    const currentLevelXp = totalXp - xpForCurrentLevel;
    const nextLevelXpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(
      Math.floor((currentLevelXp / nextLevelXpNeeded) * 100),
      100,
    );

    const currentPhase =
      this.PHASES.find((p) => level >= p.minLevel && level <= p.maxLevel) ||
      this.PHASES[this.PHASES.length - 1];

    const journey = this.PHASES.map((phase) => ({
      id: phase.id,
      title: phase.title,
      unlocked: level >= phase.minLevel,
      active: currentPhase.id === phase.id,
      imageUrl: phase.imageUrl,
      levelRange: phase.maxLevel === 999 ? 'Level 81+' : `Level ${phase.minLevel} - ${phase.maxLevel}`,
      unlockedAtLevel: phase.minLevel,
    }));

    return {
      level,
      totalXp,
      currentLevelXp,
      nextLevelXp: nextLevelXpNeeded,
      progressPercentage,
      currentPhase,
      journey,
    };
  }
}
