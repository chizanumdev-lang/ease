import api from './api';

export interface CoachResponse {
    reply: string;
    tone: 'supportive' | 'direct' | 'analytical';
    suggested_actions?: {
        type: 'reduce_load' | 'increase_difficulty' | 'reschedule' | 'encourage_review';
        details: string;
    }[];
    safety_flag: boolean;
}

export const CoachService = {
    async sendMessage(message: string): Promise<CoachResponse> {
        const response = await api.post('/coach/message', { message });
        return response.data;
    },
};
