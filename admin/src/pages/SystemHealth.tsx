import { useEffect, useState } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  Cpu, 
  Server, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  RefreshCcw,
  Activity,
  Shield,
  Zap,
  Network,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { adminService } from '../services/admin.service';
import type { SystemHealthData } from '../services/admin.service';
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
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function SystemHealth() {
    const [data, setData] = useState<SystemHealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHealth() {
            try {
                const healthData = await adminService.getHealth();
                setData(healthData);
            } catch (error) {
                console.error('Failed to fetch system health:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchHealth();
        const interval = setInterval(fetchHealth, 15000); // More frequent updates for real-time feel
        return () => clearInterval(interval);
    }, []);

    const handleRetry = async (dayPlanId: string) => {
        if (!dayPlanId) return;
        try {
            await adminService.retryHydration(dayPlanId);
            const healthData = await adminService.getHealth();
            setData(healthData);
        } catch (error) {
            console.error('Retry failed:', error);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-ease-blue/10 border-t-ease-blue rounded-full animate-spin"></div>
                  <Shield className="absolute inset-0 m-auto text-ease-blue animate-pulse w-8 h-8" />
                </div>
                <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.4em] animate-pulse">Syncing System Core...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Health Overview Cards */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
                <HealthCard 
                    title="NEURAL INTEGRITY"
                    value={data?.aiLogs.length ? `${Math.round((data.aiLogs.filter(l => l.status === 'success').length / data.aiLogs.length) * 100)}%` : '100%'}
                    subtitle="Success Probability"
                    icon={Cpu}
                    status="healthy"
                    gradient="from-blue-500/20 to-indigo-500/5"
                />
                <HealthCard 
                    title="ACTIVE ANOMALIES"
                    value={data?.recentErrors.length || 0}
                    subtitle="Critical Exceptions"
                    icon={AlertCircle}
                    status={(data?.recentErrors.length || 0) > 0 ? 'warning' : 'healthy'}
                    gradient="from-red-500/20 to-rose-500/5"
                />
                <HealthCard 
                    title="RESOURCE DRAIN"
                    value={`$${(data?.totalCost ?? 0).toFixed(2)}`}
                    subtitle="Operational Overhead"
                    icon={DollarSign}
                    status="info"
                    gradient="from-purple-500/20 to-pink-500/5"
                />
            </motion.div>

            {/* Queue Monitor */}
            {data?.queueStats && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-ease-surface/40 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 shadow-ease-layered relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
                       <Network className="w-64 h-64 text-ease-blue" />
                    </div>
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-3 bg-ease-blue/10 rounded-2xl border border-ease-blue/20">
                          <Activity className="w-6 h-6 text-ease-blue" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-ease-text-primary uppercase tracking-[0.2em]">Processing Pipeline</h3>
                          <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-widest mt-1 opacity-40">Hydration Engine State</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-10">
                        <QueueStat label="DORMANT" value={data.queueStats.waiting} color="text-ease-text-secondary" icon={Clock} />
                        <QueueStat label="ACTIVE" value={data.queueStats.active} color="text-ease-blue" pulse icon={Zap} />
                        <QueueStat label="RESOLVED" value={data.queueStats.completed} color="text-emerald-400" icon={CheckCircle2} />
                        <QueueStat label="FAILED" value={data.queueStats.failed} color="text-red-400" icon={XCircle} />
                        <QueueStat label="DELAYED" value={data.queueStats.delayed} color="text-ease-text-secondary" opacity icon={Clock} />
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* AI Generation Logs */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-ease-surface/40 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-ease-layered overflow-hidden flex flex-col"
                >
                    <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-ease-blue/10 rounded-xl border border-ease-blue/20">
                              <Terminal className="w-5 h-5 text-ease-blue" />
                            </div>
                            <h3 className="text-lg font-black text-ease-text-primary uppercase tracking-[0.15em]">Neural Stream</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Flow</span>
                        </div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar bg-black/10">
                        <AnimatePresence initial={false}>
                          {data?.aiLogs.map((log, idx) => (
                              <motion.div 
                                key={log.id} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="px-10 py-6 hover:bg-white/[0.03] transition-all flex gap-6 group"
                              >
                                  <div className={clsx(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xl transition-transform group-hover:scale-110",
                                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  )}>
                                      {log.status === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <p className="font-black text-ease-text-primary tracking-tight text-base group-hover:text-ease-blue transition-colors">
                                              {log.model} // {log.provider}
                                            </p>
                                            <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest opacity-40 mt-0.5">
                                              Shard ID: {log.id.split('-')[0]}
                                            </p>
                                          </div>
                                          <p className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded-lg">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                          </p>
                                      </div>
                                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-4 group-hover:border-white/10 transition-colors">
                                        <p className="text-xs text-ease-text-secondary font-mono leading-relaxed opacity-60">
                                          <span className="text-ease-blue opacity-100">$ </span>
                                          {log.prompt.substring(0, 100)}...
                                        </p>
                                      </div>
                                      <div className="flex gap-6">
                                          <div className="flex items-center gap-2">
                                              <Clock className="w-3.5 h-3.5 text-ease-text-secondary opacity-40" />
                                              <span className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">{log.latency}ms</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <Zap className="w-3.5 h-3.5 text-ease-text-secondary opacity-40" />
                                              <span className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">${(log.cost ?? 0).toFixed(4)}</span>
                                          </div>
                                          {log.status === 'error' && log.metadata?.dayPlanId && (
                                              <button 
                                                  onClick={() => handleRetry(log.metadata.dayPlanId)}
                                                  className="flex items-center gap-2 text-ease-blue hover:text-white transition-colors bg-ease-blue/10 px-3 py-1 rounded-lg border border-ease-blue/20"
                                              >
                                                  <RefreshCcw className="w-3 h-3" />
                                                  <span className="text-[9px] font-black uppercase tracking-widest">RE-INITIALIZE</span>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </motion.div>
                          ))}
                        </AnimatePresence>
                        {(!data?.aiLogs || data.aiLogs.length === 0) && (
                          <div className="px-10 py-32 text-center space-y-8">
                            <div className="relative inline-block">
                              <div className="w-24 h-24 bg-ease-blue/10 rounded-[2.5rem] flex items-center justify-center border border-ease-blue/20 shadow-2xl">
                                <Cpu className="w-12 h-12 text-ease-blue" />
                              </div>
                              <div className="absolute -inset-4 bg-ease-blue/20 rounded-full blur-3xl -z-10 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xl font-black text-ease-text-primary tracking-tighter uppercase tracking-[0.2em]">Neural Silence</p>
                              <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-widest opacity-40">Zero Shard Activations Detected</p>
                            </div>
                          </div>
                        )}
                    </div>
                </motion.div>

                {/* Error Exceptions */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-ease-surface/40 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-ease-layered overflow-hidden flex flex-col"
                >
                    <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                              <Server className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-ease-text-primary uppercase tracking-[0.15em]">System Shards</h3>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">CRITICAL MONITOR</span>
                        </div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar bg-black/10">
                        {data?.recentErrors.map((error, idx) => (
                            <motion.div 
                              key={error.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className="px-10 py-8 hover:bg-white/[0.03] transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded-xl border border-red-500/20 shadow-lg shadow-red-500/5">
                                          {error.statusCode} // ERROR
                                      </div>
                                      <span className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] opacity-40">{error.path}</span>
                                    </div>
                                    <p className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded-lg">
                                      {new Date(error.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <p className="font-black text-ease-text-primary text-base mb-4 tracking-tight group-hover:text-red-400 transition-colors leading-tight">{error.message}</p>
                                <div className="bg-black/30 rounded-[2rem] p-6 border border-white/5 group-hover:border-red-500/20 transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
                                      <Command className="w-16 h-16 text-white" />
                                    </div>
                                    <code className="text-[11px] text-red-400/80 font-mono break-all leading-relaxed block overflow-x-auto custom-scrollbar-mini">
                                        {error.stack?.substring(0, 300)}...
                                    </code>
                                </div>
                            </motion.div>
                        ))}
                        {(!data?.recentErrors || data.recentErrors.length === 0) && (
                          <div className="px-10 py-32 text-center space-y-8">
                            <div className="relative inline-block">
                              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                              </div>
                              <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xl font-black text-ease-text-primary tracking-tighter uppercase tracking-[0.2em]">All Systems Nominal</p>
                              <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-widest opacity-40">Zero Shard Anomalies Detected</p>
                            </div>
                          </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function HealthCard({ title, value, subtitle, icon: Icon, status, gradient }: any) {
  return (
    <motion.div 
      variants={itemVariants}
      className="bg-ease-surface/40 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 shadow-ease-layered group hover:border-white/10 transition-all duration-500 relative overflow-hidden"
    >
      <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity duration-1000 group-hover:opacity-60", gradient)} />
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className={clsx(
          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 border",
          status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          status === 'warning' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          'bg-ease-blue/10 text-ease-blue border-ease-blue/20'
        )}>
          <Icon className="w-7 h-7" />
        </div>
        <div className={clsx(
          "w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]",
          status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
          status === 'warning' ? 'bg-red-500 animate-bounce' :
          'bg-ease-blue'
        )}></div>
      </div>
      
      <div className="relative z-10">
        <p className="text-[11px] font-black text-ease-text-secondary uppercase tracking-[0.25em] mb-2 opacity-50">{title}</p>
        <h4 className="text-4xl font-black text-ease-text-primary tracking-tighter group-hover:text-ease-blue transition-colors">{value}</h4>
        <p className="text-[9px] font-black text-ease-text-secondary mt-3 opacity-30 uppercase tracking-[0.2em]">{subtitle}</p>
      </div>
    </motion.div>
  );
}

function QueueStat({ label, value, color, pulse, opacity, icon: Icon }: any) {
    return (
        <div className={clsx(
            "p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group shadow-inner relative overflow-hidden",
            opacity && "opacity-40"
        )}>
            <div className="absolute -right-2 -top-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Icon className="w-16 h-16" />
            </div>
            <p className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.25em] mb-4 opacity-40 relative z-10">{label}</p>
            <div className="flex items-center gap-3 relative z-10">
                <span className={clsx("text-3xl font-black tracking-tighter transition-transform group-hover:scale-110", color)}>{value}</span>
                {pulse && value > 0 && (
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ease-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-ease-blue"></span>
                  </div>
                )}
            </div>
        </div>
    );
}
