import { useEffect, useState } from 'react';
import { Users, Activity, Target, CheckSquare } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';
import type { DashboardMetrics, UserGrowthData } from '../services/analytics.service';
// Uses simple CSS bars for chart to avoid heavy deps like recharts for now

export default function UserAnalytics() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [growthData, setGrowthData] = useState<UserGrowthData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [m, g] = await Promise.all([
                    analyticsService.getOverviewMetrics(),
                    analyticsService.getUserGrowth()
                ]);
                setMetrics(m);
                setGrowthData(g);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Users className="mr-3" /> User Analytics
            </h1>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Users"
                    value={metrics?.totalUsers}
                    icon={Users}
                    color="blue"
                />
                <MetricCard
                    title="Active (30d)"
                    value={metrics?.activeUsersLast30Days}
                    icon={Activity}
                    color="green"
                />
                <MetricCard
                    title="Programs Created"
                    value={metrics?.totalProgramsGenerated}
                    icon={CheckSquare}
                    color="purple"
                />
                <MetricCard
                    title="Goals Completed"
                    value={metrics?.totalGoalsCompleted}
                    icon={Target}
                    color="orange"
                />
            </div>

            {/* Simple Growth Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">User Growth (Last 7 Days)</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                    {growthData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 group">
                            <div
                                className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all relative"
                                style={{ height: `${(d.count / 60) * 100}%` }} // detailed scaling usually logic
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity">
                                    {d.count}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                                {d.date}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className={`p-3 rounded-full mr-4 ${colors[color] || colors.blue}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString()}</p>
            </div>
        </div>
    );
}
