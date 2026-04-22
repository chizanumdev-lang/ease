import api from '../lib/axios';

export interface PulseMetrics {
  dau: number;
  completionRate: number;
  aiHealth: number;
  totalUsers: number;
  timestamp: string;
  tasksToday?: number;
  aiGens?: number;
  avgStreak?: number;
  npsScore?: number;
  alerts?: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    detail: string;
  }>;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface UserMetric {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  level: number;
  xp: number;
  streak: number;
  lastActive: string;
  status: 'active' | 'inactive';
  isVerified: boolean;
  isAdmin?: boolean;
  completedTasks?: number;
  programs?: any[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
}

export interface SystemHealthData {
  aiLogs: any[];
  recentErrors: any[];
  totalCost: number;
}

export const adminService = {
  async getPulse(): Promise<PulseMetrics> {
    const response = await api.get('/admin/dashboard/pulse');
    return response.data;
  },

  async getTrends(): Promise<{ dau: TrendData[], completion: TrendData[] }> {
    const response = await api.get('/admin/dashboard/trends');
    return response.data;
  },

  async getUsers(page = 1, limit = 10, search = '', status = 'all'): Promise<{
    users: UserMetric[];
    total: number;
  }> {
    const response = await api.get('/admin/users', {
      params: { 
        page, 
        limit, 
        search,
        status: status === 'all' ? undefined : status 
      }
    });
    return response.data;
  },

  async getHealth(): Promise<SystemHealthData> {
    const response = await api.get('/admin/system/health');
    return response.data;
  },
  
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async getUserDetails(id: string): Promise<UserMetric> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async toggleAdmin(id: string): Promise<UserMetric> {
    const response = await api.patch(`/admin/users/${id}/role`);
    return response.data;
  }
};
