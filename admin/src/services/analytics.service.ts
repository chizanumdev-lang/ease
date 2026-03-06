import api from '../lib/axios';

export interface DashboardMetrics {
    totalUsers: number;
    activeUsersLast30Days: number;
    totalProgramsGenerated: number;
    totalGoalsCompleted: number;
}

export interface UserGrowthData {
    date: string;
    count: number;
}

export const analyticsService = {
    async getOverviewMetrics(): Promise<DashboardMetrics> {
        // Return mock data for now if endpoint doesn't exist
        try {
            const response = await api.get('/analytics/overview');
            return response.data;
        } catch (e) {
            console.warn('Analytics endpoint not found, returning mock data');
            return {
                totalUsers: 1250,
                activeUsersLast30Days: 450,
                totalProgramsGenerated: 3200,
                totalGoalsCompleted: 850
            };
        }
    },

    async getUserGrowth(): Promise<UserGrowthData[]> {
        // Mock last 7 days
        const dates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        return dates.map(date => ({
            date,
            count: Math.floor(Math.random() * 50) + 10 // Random daily signups
        }));
    }
};
