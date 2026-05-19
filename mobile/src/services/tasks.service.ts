import api from './api';

export const tasksService = {
    update: async (id: string, updates: any) => {
        const response = await api.patch(`/tasks/${id}`, updates);
        return response.data;
    },
    regenerate: async (id: string) => {
        const response = await api.post(`/tasks/${id}/regenerate`, {}, { timeout: 180000 });
        return response.data;
    },
};
