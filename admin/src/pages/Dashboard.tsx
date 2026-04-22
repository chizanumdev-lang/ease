import { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Cpu, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { PulseMetrics } from '../services/admin.service';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import clsx from 'clsx';

export default function Dashboard() {
    const [pulse, setPulse] = useState<PulseMetrics | null>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [pulseData, trendData] = await Promise.all([
                    adminService.getPulse(),
                    adminService.getTrends()
                ]);
                setPulse(pulseData);
                
                // Merge trend data by index (assuming dates align from backend)
                const mergedTrends = trendData.dau.map((d, i) => ({
                    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    dau: d.value,
                    completion: trendData.completion[i]?.value || 0
                }));
                setTrends(mergedTrends);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-ease-blue/20 border-t-ease-blue rounded-full animate-spin"></div>
              <p className="text-ease-text-secondary font-bold animate-pulse">Syncing platform metrics...</p>
            </div>
          </div>
        );
    }

    const cards = [
        { 
          label: 'Active Users', 
          value: pulse?.dau.toLocaleString(), 
          change: '+12.5%', 
          isPositive: true, 
          icon: Users, 
          color: 'blue' 
        },
        { 
          label: 'Tasks Today', 
          value: (pulse?.tasksToday || 0).toLocaleString(), 
          change: '+5.2%', 
          isPositive: true, 
          icon: CheckCircle2, 
          color: 'green' 
        },
        { 
          label: 'AI Gens', 
          value: (pulse?.aiGens || 0).toLocaleString(), 
          change: '-2.4%', 
          isPositive: false, 
          icon: Cpu, 
          color: 'purple' 
        },
        { 
          label: 'System Health', 
          value: `${pulse?.aiHealth}%`, 
          change: 'Optimal', 
          isPositive: true, 
          icon: Activity, 
          color: 'teal' 
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-ease-surface p-6 rounded-3xl border border-ease-border shadow-ease-layered hover:shadow-ease-card transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-ease-blue/10 text-ease-blue group-hover:scale-110 transition-transform`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${card.isPositive ? 'text-ease-success' : 'text-ease-error'}`}>
                                {card.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {card.change}
                            </div>
                        </div>
                        <h3 className="text-ease-text-secondary text-xs font-bold uppercase tracking-wider">{card.label}</h3>
                        <p className="text-3xl font-black text-ease-text-primary mt-1 tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-ease-surface p-8 rounded-3xl border border-ease-border shadow-ease-layered">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-ease-text-primary">DAU / WAU Trend</h3>
                            <p className="text-sm text-ease-text-secondary font-medium">Daily and Weekly active users over the last 30 days.</p>
                        </div>
                        <select className="bg-ease-bg border border-ease-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none cursor-pointer hover:border-ease-blue transition-colors">
                            <option>Last 30 Days</option>
                            <option>Last 90 Days</option>
                        </select>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#64748B', fontSize: 12, fontWeight: 500}} 
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#64748B', fontSize: 12, fontWeight: 500}} 
                                />
                                <Tooltip 
                                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                  itemStyle={{fontWeight: 700, color: '#1E293B'}}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="dau" 
                                  stroke="#4A90E2" 
                                  strokeWidth={4} 
                                  fillOpacity={1} 
                                  fill="url(#colorDau)" 
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="completion" 
                                  stroke="#10B981" 
                                  strokeWidth={2} 
                                  fillOpacity={0.1} 
                                  fill="#10B981" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-ease-border">
                      <div className="text-center">
                        <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-widest">Avg Streak</p>
                        <p className="text-2xl font-black text-ease-text-primary mt-1">{pulse?.avgStreak} days</p>
                      </div>
                      <div className="text-center border-x border-ease-border px-4">
                        <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-widest">Completion</p>
                        <p className="text-2xl font-black text-ease-text-primary mt-1">{pulse?.completionRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-widest">NPS Score</p>
                        <p className="text-2xl font-black text-ease-text-primary mt-1">+{pulse?.npsScore}</p>
                      </div>
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-ease-surface p-8 rounded-3xl border border-ease-border shadow-ease-layered flex flex-col">
                    <h3 className="text-xl font-bold text-ease-text-primary mb-6 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-ease-error" />
                      Critical Alerts
                    </h3>
                    
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {pulse?.alerts?.map((alert) => (
                            <div key={alert.id} className="p-5 rounded-2xl bg-ease-bg border border-ease-border hover:border-ease-blue/30 transition-all duration-200 group cursor-pointer hover:translate-x-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={clsx(
                                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                      alert.type === 'error' ? 'bg-ease-error/10 text-ease-error' : 'bg-ease-warning/10 text-ease-warning'
                                    )}>
                                      {alert.type}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-ease-text-secondary group-hover:text-ease-blue transition-colors" />
                                </div>
                                <h4 className="text-sm font-bold text-ease-text-primary leading-tight group-hover:text-ease-blue transition-colors">{alert.message}</h4>
                                <p className="text-xs text-ease-text-secondary mt-2 font-medium leading-relaxed">{alert.detail}</p>
                            </div>
                        ))}
                        
                        {(!pulse?.alerts || pulse.alerts.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-20 text-ease-text-secondary">
                            <div className="w-16 h-16 rounded-full bg-ease-success/10 flex items-center justify-center mb-4">
                              <CheckCircle2 className="w-8 h-8 text-ease-success" />
                            </div>
                            <p className="font-bold text-ease-text-primary">All systems nominal</p>
                            <p className="text-xs mt-1">No critical alerts detected.</p>
                          </div>
                        )}
                    </div>
                    
                    <button className="w-full mt-8 py-4 rounded-2xl bg-ease-bg text-ease-text-primary font-bold text-sm hover:bg-ease-blue hover:text-white transition-all duration-300 shadow-ease-layered border border-ease-border">
                      View All Incident Logs
                    </button>
                </div>
            </div>
        </div>
    );
}

