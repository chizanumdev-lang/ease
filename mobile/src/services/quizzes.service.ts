import api from './api';
import { API_ENDPOINTS } from '../constants/config';
import { Quiz, QuizAttempt } from '../types';

export const quizzesService = {
    async getQuiz(id: string): Promise<Quiz> {
        const response = await api.get<Quiz>(`/quizzes/${id}`);
        return response.data;
    },

    async submitAttempt(quizId: string, answers: number[]): Promise<QuizAttempt> {
        const response = await api.post<QuizAttempt>(API_ENDPOINTS.SUBMIT_QUIZ(quizId), {
            answers,
        });
        return response.data;
    },
};
