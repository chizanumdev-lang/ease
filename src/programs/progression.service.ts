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
  levelEntailment: string;
  journey: Array<{
    id: string;
    title: string;
    subtitle: string;
    unlocked: boolean;
    active: boolean;
    imageUrl: string;
    levelRange: string;
    unlockedAtLevel: number;
  }>;
}

@Injectable()
export class ProgressionService {
  private readonly LEVEL_ENTAILMENTS = {
    mindfulness: {
      1: "Planting the first seeds of peace. You've taken the hardest step: starting.",
      2: "Noticing your breath. You're beginning to see the rhythm of your life.",
      3: 'Small stillness. You found a quiet moment in a loud world.',
      4: "Thought watching. You're starting to see thoughts as passing clouds.",
      5: "Inner anchor. You're using your breath to stay centered during the day.",
      6: 'Habit root. Your mind is starting to expect its daily moment of calm.',
      7: "Quiet power. You're feeling more centered even when things get busy.",
      8: 'Soft focus. Your concentration is becoming more natural and easy.',
      9: "Self-kindness. You're learning to be gentle with yourself during practice.",
      10: 'Breaking surface. Your new awareness is starting to change how you feel.',
      11: "Emotional space. You're finding a gap between feeling and reacting.",
      12: 'Deepening roots. Calm is becoming your default state of being.',
      13: "Patience growth. You're letting go of the need for immediate results.",
      14: "Clear mirror. You're seeing yourself with more honesty and love.",
      15: "First sprout. You've built a solid foundation for lasting peace.",
    },
    focus: {
      1: "Setting your intention. You've decided to master your most valuable asset.",
      2: "Cutting noise. You're starting to identify what steals your attention.",
      3: 'Brief flow. You found your first few minutes of total immersion.',
      4: "Task clarity. You're getting better at defining what truly matters.",
      5: "Deep roots. You're building the stamina to stay with a single task.",
      6: "Distraction shield. You're learning to say no to the unimportant.",
      7: 'Mental grip. Your concentration is becoming stronger and more reliable.',
      8: "Flow trigger. You're discovering what helps you get 'in the zone'.",
      9: "System build. You're creating a routine that supports your best work.",
      10: "Productive momentum. You're achieving more with less mental effort.",
      11: 'Depth mastery. You can now hold complex ideas for longer periods.',
      12: "Time sovereignty. You're starting to own your schedule, not the other way around.",
      13: "Energy mapping. You're aligning your hardest tasks with your peak energy.",
      14: 'Unshakable intent. Your focus stays sharp even in busy environments.',
      15: "Intentional growth. You've mastered the basics of deep, meaningful work.",
    },
    energy: {
      1: "Waking up. You've committed to fueling your body and mind properly.",
      2: "Initial spark. You're noticing a slight lift in your morning alertness.",
      3: 'Steady burn. Your energy is starting to last longer throughout the day.',
      4: "Fuel awareness. You're beginning to see how your choices affect your fire.",
      5: "Rising heat. You're finding the motivation to move and create more.",
      6: "Recovery root. You're learning that rest is just as important as action.",
      7: 'Vibrant pulse. Your body is feeling more responsive and alive.',
      8: "Mental clarity. The 'brain fog' is starting to lift more consistently.",
      9: "Momentum build. You're finding it easier to get started on new things.",
      10: 'Power surge. You have enough energy to handle challenges with a smile.',
      11: 'Rhythmic flow. Your peaks and valleys are becoming more predictable.',
      12: "Inner battery. You're learning how to recharge quickly during the day.",
      13: 'Glow effect. Your high energy is starting to be noticed by others.',
      14: 'Limitless drive. You feel ready to take on bigger, more exciting goals.',
      15: "Vital core. You've built a sustainable engine of high performance.",
    },
    balance: {
      1: "Finding center. You've realized that harmony is better than hustle.",
      2: "Initial shift. You're starting to adjust the scales of your daily life.",
      3: 'Small alignment. Work and life are beginning to feel a bit more integrated.',
      4: "Boundary build. You're learning where to draw the line for your own sake.",
      5: "Steady rhythm. You're finding a pace that you can actually maintain.",
      6: "Harmony root. You're noticing that when one area improves, they all do.",
      7: "Graceful flow. You're moving between tasks with less friction and stress.",
      8: "Priority focus. You're spending more time on what truly brings you joy.",
      9: "Self-care anchor. You're realizing that taking care of you helps everyone.",
      10: "Integrated life. Your daily routine is starting to feel like 'you'.",
      11: "Ease mastery. You're doing more by trying less—finding the flow.",
      12: "Wholeness spark. You're feeling more complete and less fragmented.",
      13: "Calm conduct. You're steering your life with a gentle, steady hand.",
      14: "Balanced reach. You're growing in multiple directions at once.",
      15: "True harmony. You've found a way to live that feels both full and light.",
    },
  };

  private readonly PHASES: PhaseInfo[] = [
    {
      id: 'phase1_seed',
      title: 'Primordial Seed',
      subtitle: 'Pure potential, waiting to awaken.',
      imageUrl:
        'https://res.cloudinary.com/duooultxc/image/upload/v1776454648/ease/spirit-tree/phase1_seed.jpg',
      minLevel: 1,
      maxLevel: 5,
      levelRange: 'Level 1 - 5',
      unlockedAtLevel: 1,
    },
    {
      id: 'phase2_sprout',
      title: 'Sprouting Awareness',
      subtitle: 'Your intention begins to take root.',
      imageUrl:
        'https://res.cloudinary.com/duooultxc/image/upload/v1776454656/ease/spirit-tree/phase2_sprout.jpg',
      minLevel: 6,
      maxLevel: 15,
      levelRange: 'Level 6 - 15',
      unlockedAtLevel: 6,
    },
    {
      id: 'phase3_sapling',
      title: 'Resilient Sapling',
      subtitle: 'Steady growth through consistent practice.',
      imageUrl:
        'https://res.cloudinary.com/duooultxc/image/upload/v1776454668/ease/spirit-tree/phase3_sapling.jpg',
      minLevel: 16,
      maxLevel: 30,
      levelRange: 'Level 16 - 30',
      unlockedAtLevel: 16,
    },
    {
      id: 'phase4_tree',
      title: 'Branching Expansion',
      subtitle: 'Your reach grows as deep as your roots.',
      imageUrl:
        'https://res.cloudinary.com/duooultxc/image/upload/v1776454678/ease/spirit-tree/phase4_tree.jpg',
      minLevel: 31,
      maxLevel: 50,
      levelRange: 'Level 31 - 50',
      unlockedAtLevel: 31,
    },
    {
      id: 'phase5_wisdom',
      title: 'Blossoming Wisdom',
      subtitle: 'A peak state of enlightened presence.',
      imageUrl:
        'https://res.cloudinary.com/duooultxc/image/upload/v1776454698/ease/spirit-tree/phase5_wisdom.jpg',
      minLevel: 51,
      maxLevel: 80,
      levelRange: 'Level 51 - 80',
      unlockedAtLevel: 51,
    },
    {
      id: 'phase6_ancient',
      title: 'Infinite Ancient',
      subtitle: 'Transcendent connection to the universe.',
      imageUrl:
        'https://res.cloudinary.com/duooultxc/image/upload/v1776454714/ease/spirit-tree/phase6_ancient.jpg',
      minLevel: 81,
      maxLevel: 999,
      levelRange: 'Level 81+',
      unlockedAtLevel: 81,
    },
  ];

  private readonly GOAL_VARIANT_MAP = {
    mindfulness: {
      phase1_seed: {
        title: 'Seed of Quiet',
        subtitle:
          "You're planting the first seeds of peace. It's okay to start small.",
      },
      phase2_sprout: {
        title: 'Gentle Sprout',
        subtitle:
          "Your mind is starting to settle. You're finding small moments of calm.",
      },
      phase3_sapling: {
        title: 'Steady Calm',
        subtitle:
          "You're handling stress much better now. Your roots of peace are deep.",
      },
      phase4_tree: {
        title: 'Sheltering Tree',
        subtitle:
          'Your inner peace is strong enough to protect you from any storm.',
      },
      phase5_wisdom: {
        title: 'Radiant Serenity',
        subtitle:
          'You carry a sense of peace wherever you go. You feel light and free.',
      },
      phase6_ancient: {
        title: 'Master of Stillness',
        subtitle:
          'You are perfectly at home in the present moment. Nothing can shake you.',
      },
    },
    focus: {
      phase1_seed: {
        title: 'Seed of Purpose',
        subtitle:
          "You're setting your intention. Clarity starts with a single step.",
      },
      phase2_sprout: {
        title: 'Growing Intent',
        subtitle:
          "Your focus is sharpening. You're getting better at staying on track.",
      },
      phase3_sapling: {
        title: 'Rooted Discipline',
        subtitle:
          "You've built a solid foundation. Work feels easier and more natural.",
      },
      phase4_tree: {
        title: 'Broad Vision',
        subtitle:
          'You can see the big picture clearly. Your output is growing every day.',
      },
      phase5_wisdom: {
        title: 'Peak Performance',
        subtitle:
          "You're in the flow. Your mind is a powerful tool for creation.",
      },
      phase6_ancient: {
        title: 'Infinite Creator',
        subtitle:
          "You've mastered your time and energy. You can achieve anything.",
      },
    },
    energy: {
      phase1_seed: {
        title: 'Seed of Vitality',
        subtitle:
          "You're waking up your inner fire. Every small movement counts.",
      },
      phase2_sprout: {
        title: 'Rising Spark',
        subtitle:
          "You're feeling more alert. Your energy levels are starting to stabilize.",
      },
      phase3_sapling: {
        title: 'Power Sapling',
        subtitle:
          'You have the fuel to get through your day. You feel strong and ready.',
      },
      phase4_tree: {
        title: 'Radiant Glow',
        subtitle:
          "Your energy is contagious. You're moving through life with real momentum.",
      },
      phase5_wisdom: {
        title: 'Peak Vitality',
        subtitle:
          "You're at your physical and mental best. You feel like you can take on the world.",
      },
      phase6_ancient: {
        title: 'Infinite Source',
        subtitle:
          'Your energy is a limitless spring. You are fully alive and unstoppable.',
      },
    },
    balance: {
      phase1_seed: {
        title: 'Seed of Harmony',
        subtitle:
          "You're finding your center. Balance begins with a single choice.",
      },
      phase2_sprout: {
        title: 'Shifting Weight',
        subtitle:
          "You're learning to juggle life better. Things are starting to align.",
      },
      phase3_sapling: {
        title: 'Rooted Center',
        subtitle:
          "You've found a steady rhythm. You feel more in control of your time.",
      },
      phase4_tree: {
        title: 'Balanced Reach',
        subtitle:
          "You're thriving in all areas of life. You've found the sweet spot.",
      },
      phase5_wisdom: {
        title: 'Effortless Flow',
        subtitle:
          "Everything is in its right place. You're living with ease and grace.",
      },
      phase6_ancient: {
        title: 'Master of Life',
        subtitle:
          "You've achieved perfect harmony. You are the conductor of your own life.",
      },
    },
  };

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

  getLevelEntailment(level: number, goalCategory?: string): string {
    const normalizedCategory = goalCategory?.toLowerCase();
    const entailments =
      (normalizedCategory &&
        this.LEVEL_ENTAILMENTS[
          normalizedCategory as keyof typeof this.LEVEL_ENTAILMENTS
        ]) ||
      this.LEVEL_ENTAILMENTS.mindfulness;

    if (entailments[level]) {
      return entailments[level];
    }

    // Fallback for levels above 15
    const phase =
      this.PHASES.find((p) => level >= p.minLevel && level <= p.maxLevel) ||
      this.PHASES[this.PHASES.length - 1];
    return `Continuing to deepen your ${phase.title.toLowerCase()} state. Your growth is becoming more effortless and natural every day.`;
  }

  getProgression(totalXp: number, goalCategory?: string): ProgressionData {
    const level = this.getLevelForXp(totalXp);
    const xpForCurrentLevel = this.getXpForLevel(level);
    const xpForNextLevel = this.getXpForLevel(level + 1);

    const currentLevelXp = totalXp - xpForCurrentLevel;
    const nextLevelXpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(
      Math.floor((currentLevelXp / nextLevelXpNeeded) * 100),
      100,
    );

    // Apply goal-specific variations if available
    const normalizedCategory = goalCategory?.toLowerCase();
    const variant = normalizedCategory
      ? this.GOAL_VARIANT_MAP[
          normalizedCategory as keyof typeof this.GOAL_VARIANT_MAP
        ]
      : undefined;

    const processedPhases = this.PHASES.map((phase) => {
      if (variant && variant[phase.id]) {
        return {
          ...phase,
          title: variant[phase.id].title,
          subtitle: variant[phase.id].subtitle,
        };
      }
      return phase;
    });

    const currentPhase =
      processedPhases.find((p) => level >= p.minLevel && level <= p.maxLevel) ||
      processedPhases[processedPhases.length - 1];

    const levelEntailment = this.getLevelEntailment(level, goalCategory);

    const journey = processedPhases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      subtitle: phase.subtitle,
      unlocked: level >= phase.minLevel,
      active: currentPhase.id === phase.id,
      imageUrl: phase.imageUrl,
      levelRange:
        phase.maxLevel === 999
          ? 'Level 81+'
          : `Level ${phase.minLevel} - ${phase.maxLevel}`,
      unlockedAtLevel: phase.minLevel,
    }));

    return {
      level,
      totalXp,
      currentLevelXp,
      nextLevelXp: nextLevelXpNeeded,
      progressPercentage,
      currentPhase,
      levelEntailment,
      journey,
    };
  }
}
