import api from '../lib/axios';
import type { Video, VideoCreateInput, VideoUpdateInput } from '../types';

export const videoService = {
    async getAll(): Promise<Video[]> {
        const response = await api.get('/videos');
        return response.data;
    },

    async create(data: VideoCreateInput): Promise<Video> {
        const response = await api.post('/videos', data);
        return response.data;
    },

    async update(id: string, data: VideoUpdateInput): Promise<Video> {
        const response = await api.patch(`/videos/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/videos/${id}`);
    }
};
