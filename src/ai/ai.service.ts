import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private readonly logger = new Logger(AiService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY not found in configuration');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async generateProgramPlan(goal: string, options: any): Promise<any> {
        if (!this.genAI) {
            this.logger.error('Gemini API key not configured');
            // Using fallback for now to avoid complete failure
            return this.getFallbackPlan();
        }

        const { duration = 30, minutesPerDay = 30, learningStyle = 'mixed', constraints = [], category = 'default' } = options;

        const systemInstruction = `You are an expert curriculum designer. Create a detailed ${duration}-day learning program for the following goal: "${goal}".
    
    Parameters:
    - Daily Commitment: ${minutesPerDay} minutes
    - Learning Style: ${learningStyle}
    - Constraints: ${constraints.join(', ') || 'none'}

    Output Format: JSON array of objects, one per day.
    
    Each Day Object MUST have ALL of the following keys:
    - dayNumber: integer
    - theme: string (the day's focus topic, e.g. "Fingerstyle Basics")
    - videoTask: { title: string, description: string, searchQuery: string (a precise YouTube search query, e.g. "fingerstyle guitar beginner Travis picking tutorial") }
    - exerciseTask: { title: string, description: string, steps: string[] (3-5 concise step-by-step instructions for the guided exercise) }
    - lessonTask: { title: string, description: string, keyPoints: string[] (3-5 key takeaways to read or study) }
    - quiz: { title: string, questions: [ { question: string, options: string[], correctAnswer: integer (0-based index) } ] } (exactly 2 questions)
    - journalTask: { title: string, prompt: string (a reflective question for the user to write about, related to today's theme) }
    - audioTask: { title: string, description: string, mood: "meditation" | "focus" | "ambient" }
    - mindfulnessTask: { title: string, description: string, technique: string (e.g. "4-7-8 breathing", "body scan", "5-4-3-2-1 grounding") }
    - reflectionTask: { title: string, description: string, reviewPoints: string[] (2-3 things to revisit or consolidate from today) }

    RULES:
    - videoTask: provide searchQuery only, NO url field.
    - audioTask: provide mood only, NO url field.
    - Ensure all tasks together fit within ${minutesPerDay} minutes/day.
    - Vary the exercises and reflections across days — avoid repetition.
    
    Return ONLY the raw JSON array. No markdown, no commentary.`;

        try {
            // Do NOT use googleSearch tool here — grounding injects citations that break JSON parsing
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    responseMimeType: 'application/json',
                },
            });

            const result = await model.generateContent(systemInstruction);
            const response = await result.response;
            let text = response.text();

            if (!text) {
                throw new Error('Empty content from AI');
            }

            // Strip any residual markdown fences just in case
            text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

            let rawPlan = JSON.parse(text);
            
            // Validate each day independently so one bad day doesn't kill the whole plan
            const plan = rawPlan.map((day: any, i: number) => {
                const dayNumber = day.dayNumber || i + 1;
                try {
                    this.validateDay(day, dayNumber);
                    return day;
                } catch (e) {
                    this.logger.warn(`Validation failed for day ${dayNumber}: ${e.message}. Using fallback.`);
                    return this.getFallbackDay(dayNumber, category);
                }
            });

            this.logger.log(`AI plan generated: ${plan.length} days (validated)`);
            return plan;
        } catch (error) {
            this.logger.error(`Failed to generate program plan: ${error?.message || error}`);
            // If quota or other error, return fallback plan instead of crashing
            this.logger.warn('Returning fallback program plan due to AI error');
            return this.getFallbackPlan(Math.min(duration, 7), category);
        }
    }

    private async repairVideoUrl(theme: string, title: string): Promise<string | null> {
        try {
            const prompt = `Find a VALID, WORKING YouTube video URL for: "${theme} - ${title}".
            Use Google Search to find a real video.
            Return ONLY the URL string. Nothing else.`;

            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                // @ts-ignore
                tools: [{ googleSearch: {} }],
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            // Extract URL if surrounded by text
            const urlMatch = text.match(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/);
            const candidateUrl = urlMatch ? urlMatch[0] : text;

            if (candidateUrl && candidateUrl.includes('youtube.com/watch')) {
                const isValid = await this.validateYouTubeUrl(candidateUrl);
                if (isValid) return candidateUrl;
            }

            return null;
        } catch (error) {
            this.logger.error('Error repairing video URL', error);
            return null;
        }
    }

    private async validateYouTubeUrl(url: string): Promise<boolean> {
        try {
            // Use oEmbed endpoint to check existence
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    private async validateLink(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async generateSearchQuery(topic: string): Promise<string> {
        try {
            const prompt = `Generate a YouTube search query for finding a high-quality video about: "${topic}". 
            Return ONLY the query string. No quotes, no explanations.`;

            const model = this.genAI.getGenerativeModel({
                // IMPORTANT: NEVER CHANGE THIS MODEL! MUST BE gemini-2.5-flash.
                model: "gemini-2.5-flash",
            });

            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            this.logger.error('Failed to generate search query', error);
            return topic; // Fallback to raw topic
        }
    }

    async generateAudioScript(theme: string, mood: string): Promise<string> {
        try {
            const prompt = `You are an expert mindfulness and productivity coach. 
            Create a comprehensive 5-minute narration script for a ${mood} session focused on: "${theme}".
            
            Guidelines:
            - Mood: ${mood}
            - Tone: Calm, encouraging, and professional.
            - Content: Include deep breathing instructions, visualizations, and progressive muscle relaxation or mindfulness techniques appropriate for the mood.
            - Structure: 
                1. Gentle introduction (30 sec)
                2. Core practice or guidance (4 minutes)
                3. Grounding closing (30 sec)
            - Total word count: MUST be between 750 and 850 words to ensure a 5-minute duration at normal speaking pace.
            
            Return ONLY the spoken text. No stage directions, no labels like "Intro:", just the content to be read aloud.`;

            const model = this.genAI.getGenerativeModel({
                // IMPORTANT: NEVER CHANGE THIS MODEL! MUST BE gemini-2.5-flash.
                model: "gemini-2.5-flash",
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            this.logger.log(`AI audio script generated for ${theme} (${mood}) - length: ${text.length} chars`);
            return text;
        } catch (error) {
            this.logger.error('Failed to generate audio script', error);
            // Return a high-quality 5-minute generic fallback if AI is unavailable (e.g. quota exceeded)
            return `Welcome to this dedicated session of deep relaxation and focus. Before we begin, find a comfortable position. Whether you're sitting in a chair, on a cushion, or lying down, ensure your spine is relatively straight but not rigid. Allow your hands to rest gently in your lap or at your sides. 

Take a moment to simply arrive. Notice the weight of your body against the surface beneath you. Feel the connection to the ground. 

Let's start with three deep, cleansing breaths. Inhale deeply through your nose, filling your lungs completely... hold for a moment... and exhale slowly and fully through your mouth. 

Again, deep breath in... hold... and release. Feel the tension leaving your body with every exhale.

One last time, at your own pace... 

Now, let your breath return to its natural rhythm. Don't try to change it; just observe it. Notice the cool air entering your nostrils, and the slightly warmer air leaving. Feel the gentle rise and fall of your chest and abdomen. 

As we move through this session, your mind will naturally wander. That's what minds do. When you notice your thoughts drifting to work, or chores, or future plans, simply acknowledge them without judgment. Imagine them as clouds floating across a vast blue sky. Just let them pass and gently bring your attention back to your breath.

Now, let's bring our awareness to our physical body. We'll perform a progressive relaxation. Starting at the very top of your head, imagine a soft, warm light of relaxation beginning to spread. Feel it smoothing out the forehead, relaxing the muscles around your eyes. Let your jaw drop slightly, releasing any clenching. 

This warmth slowly moves down your neck and into your shoulders. These are areas where we often carry the weight of our daily responsibilities. Imagine that weight simply melting away. Your shoulders feel light and relaxed.

The relaxation flows down your arms, past your elbows, into your wrists, and all the way to your fingertips. Notice any sensations here—perhaps a slight tingling or warmth.

Now, bring that awareness to your back. Starting from the upper back, feel each vertebra relaxing. This relaxation spreads through your chest and abdomen. If you feel any tightness in your stomach, allow it to soften.

Feel the warmth moving into your hips and thighs. Your legs feel heavy and comfortable. The light flows past your knees, into your calves, through your ankles, and all the way to your toes. Your entire body, from head to toe, is now in a state of deep, restful relaxation.

In this quiet space, think about your primary goal for today. Not as a source of stress, but as a path toward growth. See yourself moving through your tasks with clarity and ease. You are capable, you are focused, and you are resilient.

Stay with this feeling for a few more moments of silence...

As we prepare to close this session, gently start to bring your awareness back to the room. Wiggle your fingers and toes. Take a deep, refreshing breath. When you're ready, slowly open your eyes. Carry this sense of calm and focus with you into the rest of your day. You have everything you need within you.`;
        }
    }

    private validateDay(day: any, dayIndex: number): void {
        const required = ['videoTask', 'exerciseTask', 'lessonTask', 'quiz',
            'journalTask', 'audioTask', 'mindfulnessTask', 'reflectionTask'];

        for (const field of required) {
            if (!day[field]) throw new Error(`Day ${dayIndex} missing field: ${field}`);
        }

        if (!day.quiz || !day.quiz.questions || day.quiz.questions.length !== 2) {
            throw new Error(`Day ${dayIndex} quiz must have exactly 2 questions`);
        }
    }

    private getFallbackDay(dayNumber: number, goalCategory: string = 'default') {
        const categories: Record<string, string[]> = {
            'language': [
                'Basic Greetings & Alphabet',
                'Common Vocabulary',
                'Simple Sentence Structure',
                'Listening Comprehension',
                'Speaking Practice',
                'Review & Conversation',
                'Immersive Practice'
            ],
            'fitness': [
                'Form & Technique',
                'Core Activation',
                'Strength Foundations',
                'Cardio Endurance',
                'Active Recovery & Flex',
                'High Intensity Intervals',
                'Full Body Flow'
            ],
            'productivity': [
                'Time Blocking Basics',
                'Prioritization Techniques',
                'Managing Distractions',
                'Deep Work Strategies',
                'Workflow Optimization',
                'Review & Rest',
                'System Consolidation'
            ],
            'study': [
                'Setting Up the Environment',
                'Information Intake Methods',
                'Active Recall & Spaced Repetition',
                'Synthesizing Notes',
                'Mock Testing',
                'Reviewing Mistakes',
                'Final Consolidation'
            ]
        };

        const themes = categories[(goalCategory || '').toLowerCase()] || [
            'Introduction & Foundations',
            'Core Skills',
            'Building Momentum',
            'Deepening Understanding',
            'Practice & Refinement',
            'Review & Consolidation',
            'Application',
        ];
        
        const theme = themes[(dayNumber - 1) % themes.length];
        return {
            dayNumber: dayNumber,
            theme,
            videoTask: {
                title: `Day ${dayNumber}: ${theme} — Video Lesson`,
                description: `Watch a focused lesson on ${theme}.`,
                searchQuery: `${theme} beginner tutorial`,
            },
            exerciseTask: {
                title: `Day ${dayNumber}: Guided Exercise`,
                description: `A hands-on exercise to reinforce ${theme}.`,
                steps: ['Step 1: Warm up', 'Step 2: Core drill', 'Step 3: Apply the concept', 'Step 4: Cool down'],
            },
            lessonTask: {
                title: `Day ${dayNumber}: Reading Lesson`,
                description: `Study the key concepts of ${theme}.`,
                keyPoints: ['Key concept 1', 'Key concept 2', 'Key concept 3'],
            },
            quiz: {
                title: `Day ${dayNumber} Quiz`,
                questions: [
                    { question: 'What was the main focus today?', options: ['Consistency', 'Speed', 'Technique'], correctAnswer: 0 },
                    { question: 'What is the next step?', options: ['Practice more', 'Move on', 'Skip it'], correctAnswer: 0 },
                ],
            },
            journalTask: {
                title: `Day ${dayNumber}: Journal Check-in`,
                prompt: `What did you find most challenging about ${theme} today, and how will you approach it tomorrow?`,
            },
            audioTask: {
                title: `Day ${dayNumber}: Nightly Audio`,
                description: `A calming audio session to close out the day.`,
                mood: dayNumber % 3 === 0 ? 'ambient' : dayNumber % 2 === 0 ? 'focus' : 'meditation',
            },
            mindfulnessTask: {
                title: `Day ${dayNumber}: Mindfulness Break`,
                description: 'Take a short break to reset your focus.',
                technique: ['4-7-8 breathing', 'body scan', '5-4-3-2-1 grounding', 'box breathing'][(dayNumber - 1) % 4],
            },
            reflectionTask: {
                title: `Day ${dayNumber}: Evening Reflection`,
                description: `Review what you learned about ${theme}.`,
                reviewPoints: ['What went well?', 'What was challenging?', 'What will I do differently tomorrow?'],
            },
        };
    }

    private getFallbackPlan(duration: number = 7, category: string = 'default') {
        const days: any[] = [];
        for (let i = 1; i <= duration; i++) {
            days.push(this.getFallbackDay(i, category));
        }
        return days;
    }
}
