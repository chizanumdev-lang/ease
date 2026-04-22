import { useEffect, useState } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  Cpu, 
  Server, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { SystemHealthData } from '../services/admin.service';
import clsx from 'clsx';

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
        const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ease-blue"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Health Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HealthCard 
                    title="AI System Success"
                    value={data?.aiLogs.length ? `${Math.round((data.aiLogs.filter(l => l.status === 'success').length / data.aiLogs.length) * 100)}%` : '100%'}
                    subtitle="Last 24 hours"
                    icon={Cpu}
                    status="healthy"
                />
                <HealthCard 
                    title="Active Exceptions"
                    value={data?.recentErrors.length || 0}
                    subtitle="Unresolved issues"
                    icon={AlertCircle}
                    status={(data?.recentErrors.length || 0) > 0 ? 'warning' : 'healthy'}
                />
                <HealthCard 
                    title="Estimated API Cost"
                    value={`$${data?.totalCost.toFixed(2)}`}
                    subtitle="Month to date"
                    icon={DollarSign}
                    status="info"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Generation Logs */}
                <div className="bg-ease-surface rounded-3xl border border-ease-border shadow-ease-layered overflow-hidden">
                    <div className="px-8 py-6 border-b border-ease-border flex justify-between items-center bg-ease-bg/30">
                        <h3 className="text-lg font-black text-ease-text-primary flex items-center gap-3">
                            <Terminal className="w-5 h-5 text-ease-blue" />
                            AI Generation Stream
                        </h3>
                        <span className="px-3 py-1 bg-ease-success/10 text-ease-success text-[10px] font-black uppercase tracking-widest rounded-lg">Live</span>
                    </div>
                    <div className="divide-y divide-ease-border max-h-[600px] overflow-y-auto">
                        {data?.aiLogs.map((log) => (
                            <div key={log.id} className="px-8 py-5 hover:bg-ease-bg/40 transition-colors flex gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    log.status === 'success' ? 'bg-ease-success/10 text-ease-success' : 'bg-ease-error/10 text-ease-error'
                                )}>
                                    {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-ease-text-primary truncate">{log.model} - {log.provider}</p>
                                        <p className="text-[10px] font-bold text-ease-text-secondary uppercase">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <p className="text-xs text-ease-text-secondary font-medium truncate mb-2">Prompt: {log.prompt.substring(0, 80)}...</p>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-ease-text-secondary" />
                                            <span className="text-[10px] font-bold text-ease-text-secondary uppercase">{log.latency}ms</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="w-3 h-3 text-ease-text-secondary" />
                                            <span className="text-[10px] font-bold text-ease-text-secondary uppercase">${log.cost.toFixed(4)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Exceptions */}
                <div className="bg-ease-surface rounded-3xl border border-ease-border shadow-ease-layered overflow-hidden">
                    <div className="px-8 py-6 border-b border-ease-border flex justify-between items-center bg-ease-bg/30">
                        <h3 className="text-lg font-black text-ease-text-primary flex items-center gap-3">
                            <Server className="w-5 h-5 text-ease-error" />
                            System Exceptions
                        </h3>
                        <span className="px-3 py-1 bg-ease-error/10 text-ease-error text-[10px] font-black uppercase tracking-widest rounded-lg">Critical</span>
                    </div>
                    <div className="divide-y divide-ease-border max-h-[600px] overflow-y-auto">
                        {data?.recentErrors.map((error) => (
                            <div key={error.id} className="px-8 py-6 hover:bg-ease-bg/40 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2 py-1 bg-ease-error/10 text-ease-error text-[10px] font-black uppercase rounded-lg">
                                        {error.statusCode} {error.path}
                                    </span>
                                    <p className="text-[10px] font-bold text-ease-text-secondary uppercase">{new Date(error.createdAt).toLocaleString()}</p>
                                </div>
                                <p className="font-bold text-ease-text-primary text-sm mb-2">{error.message}</p>
                                <div className="bg-ease-bg rounded-xl p-4 border border-ease-border">
                                    <code className="text-[10px] text-ease-error font-mono break-all leading-relaxed block overflow-x-auto">
                                        {error.stack?.substring(0, 200)}...
                                    </code>
                                </div>
                            </div>
                        ))}
                        {(!data?.recentErrors || data.recentErrors.length === 0) && (
                          <div className="px-8 py-20 text-center">
                            <div className="w-16 h-16 bg-ease-success/10 text-ease-success rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <p className="text-ease-text-primary font-bold">All systems nominal</p>
                            <p className="text-ease-text-secondary text-sm font-medium mt-1">No exceptions detected in the last 24 hours.</p>
                          </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthCard({ title, value, subtitle, icon: Icon, status }: any) {
  return (
    <div className="bg-ease-surface p-8 rounded-3xl border border-ease-border shadow-ease-layered group hover:border-ease-blue transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={clsx(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
          status === 'healthy' ? 'bg-ease-success/10 text-ease-success' :
          status === 'warning' ? 'bg-ease-error/10 text-ease-error' :
          'bg-ease-blue/10 text-ease-blue'
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={clsx(
          "w-2 h-2 rounded-full",
          status === 'healthy' ? 'bg-ease-success animate-pulse' :
          status === 'warning' ? 'bg-ease-error animate-bounce' :
          'bg-ease-blue'
        )}></div>
      </div>
      <div>
        <p className="text-sm font-black text-ease-text-secondary uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-ease-text-primary tracking-tighter">{value}</h4>
        <p className="text-xs font-bold text-ease-text-secondary mt-2 opacity-60 uppercase">{subtitle}</p>
      </div>
    </div>
  );
}
