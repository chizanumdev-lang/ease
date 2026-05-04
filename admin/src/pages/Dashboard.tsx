import { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Cpu, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ChevronRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ease-surface/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-xs font-black text-ease-text-secondary uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm font-bold text-ease-text-primary">
                {entry.name.toUpperCase()}: {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

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
          <div className="flex items-center justify-center h-[70vh]">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-ease-blue/10 border-t-ease-blue rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Zap size={20} className="text-ease-blue animate-pulse" />
                </div>
              </div>
              <p className="text-ease-text-secondary font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Node Metrics...</p>
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
          label: 'AI Hydrations', 
          value: (pulse?.aiGens || 0).toLocaleString(), 
          change: 'Active', 
          isPositive: true, 
          icon: Cpu, 
          color: 'purple',
          isLive: true
        },
        { 
          label: 'Neural Uptime', 
          value: `${pulse?.uptime || 99.9}%`, 
          change: 'Stable', 
          isPositive: true, 
          icon: Activity, 
          color: 'teal',
          isLive: true
        },
        { 
          label: 'Processing Load', 
          value: `${pulse?.latency || 0}ms`, 
          change: 'Nominal', 
          isPositive: true, 
          icon: Zap, 
          color: 'blue' 
        },
    ];

    return (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 pb-10"
        >
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {cards.map((card) => (
                    <motion.div 
                      key={card.label} 
                      variants={itemVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="relative overflow-hidden bg-ease-surface/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-ease-layered hover:shadow-2xl transition-all duration-300 group"
                    >
                        {/* Decorative Background Glow */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-ease-${card.color}`} />
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={clsx(
                              "p-3.5 rounded-2xl transition-all duration-300 group-hover:scale-110",
                              card.color === 'blue' && "bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/5",
                              card.color === 'green' && "bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5",
                              card.color === 'purple' && "bg-purple-500/10 text-purple-400 shadow-lg shadow-purple-500/5",
                              card.color === 'teal' && "bg-teal-500/10 text-teal-400 shadow-lg shadow-teal-500/5",
                            )}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className={clsx(
                                "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg",
                                card.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              )}>
                                  {card.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                  {card.change}
                              </div>
                              {card.isLive && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Live</span>
                                </div>
                              )}
                            </div>
                        </div>
                        <h3 className="text-ease-text-secondary text-xs font-black uppercase tracking-[0.15em] mb-1">{card.label}</h3>
                        <p className="text-4xl font-black text-ease-text-primary tracking-tighter">{card.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-2 bg-ease-surface/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 shadow-ease-layered"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-ease-text-primary tracking-tighter">Growth Velocity</h3>
                            <p className="text-sm text-ease-text-secondary font-medium mt-1">Analyzing user retention and task completion cycles.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                            {['30D', '90D', '1Y'].map(t => (
                              <button key={t} className={clsx(
                                "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                t === '30D' ? "bg-ease-blue text-white shadow-lg shadow-blue-500/20" : "text-ease-text-secondary hover:text-white"
                              )}>
                                {t}
                              </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                  dy={15}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                  dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                <Area 
                                  name="Active Users"
                                  type="monotone" 
                                  dataKey="dau" 
                                  stroke="#3B82F6" 
                                  strokeWidth={4} 
                                  fillOpacity={1} 
                                  fill="url(#colorDau)" 
                                  animationDuration={2000}
                                />
                                <Area 
                                  name="Task Progress"
                                  type="monotone" 
                                  dataKey="completion" 
                                  stroke="#10B981" 
                                  strokeWidth={3} 
                                  strokeDasharray="5 5"
                                  fillOpacity={1} 
                                  fill="url(#colorCompletion)" 
                                  animationDuration={2500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5 relative">
                      <div className="absolute inset-0 flex justify-around pointer-events-none">
                         <div className="w-px h-full bg-white/5" />
                         <div className="w-px h-full bg-white/5" />
                      </div>
                      <div className="text-center group">
                        <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.2em]">Avg Streak</p>
                        <p className="text-3xl font-black text-ease-text-primary mt-2 group-hover:text-ease-blue transition-colors">{pulse?.avgStreak || 0}d</p>
                      </div>
                      <div className="text-center group">
                        <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.2em]">Retention</p>
                        <p className="text-3xl font-black text-ease-text-primary mt-2 group-hover:text-emerald-400 transition-colors">{pulse?.completionRate || 0}%</p>
                      </div>
                      <div className="text-center group">
                        <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.2em]">Processing</p>
                        <p className="text-3xl font-black text-ease-text-primary mt-2 group-hover:text-purple-400 transition-colors">{pulse?.latency || 0}ms</p>
                      </div>
                    </div>
                </motion.div>

                {/* Alerts Section */}
                <motion.div 
                  variants={itemVariants}
                  className="bg-ease-surface/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 shadow-ease-layered flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-ease-text-primary tracking-tighter flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        Signals
                      </h3>
                      <span className="px-2 py-1 bg-white/5 text-[9px] font-black rounded-lg text-ease-text-secondary uppercase">Real-time</span>
                    </div>
                    
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                          {pulse?.alerts?.map((alert, index) => (
                              <motion.div 
                                key={alert.id} 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 group cursor-pointer"
                              >
                                  <div className="flex justify-between items-start mb-3">
                                      <span className={clsx(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                                        alert.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                      )}>
                                        {alert.type}
                                      </span>
                                      <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-ease-blue/20 group-hover:text-ease-blue transition-all">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </div>
                                  </div>
                                  <h4 className="text-sm font-bold text-ease-text-primary leading-tight mb-2">{alert.message}</h4>
                                  <p className="text-xs text-ease-text-secondary font-medium leading-relaxed opacity-70">{alert.detail}</p>
                              </motion.div>
                          ))}
                        </AnimatePresence>
                        
                        {(!pulse?.alerts || pulse.alerts.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-20 text-ease-text-secondary text-center">
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-20 h-20 rounded-full bg-emerald-500/5 flex items-center justify-center mb-6 border border-emerald-500/10"
                            >
                              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <p className="font-black text-ease-text-primary text-sm uppercase tracking-wider">All Systems Nominal</p>
                            <p className="text-xs mt-2 opacity-60 px-10">No engine anomalies detected in the current cycle.</p>
                          </div>
                        )}
                    </div>
                    
                    <button 
                      onClick={() => window.location.href = '/health'}
                      className="w-full mt-8 py-5 rounded-[1.5rem] bg-white/5 text-ease-text-primary font-black text-xs uppercase tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all border border-white/5 shadow-xl"
                    >
                      Access Infrastructure Logs
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}

