import api from './api';

export const tasksService = {
    update: async (id: string, updates: any) => {
        const response = await api.patch(`/tasks/${id}`, updates);
        return response.data;
    },
};
