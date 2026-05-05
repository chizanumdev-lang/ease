import { useState } from 'react';
import { 
  Settings2, 
  Save, 
  Shield, 
  Cpu, 
  Database, 
  Bell, 
  Globe,
  Lock,
  RefreshCw,
  Server
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'ai', name: 'AI Engine', icon: Cpu },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'database', name: 'Database', icon: Database },
        { id: 'notifications', name: 'Alerts', icon: Bell },
    ];

    return (
        <div className="h-[calc(100vh-14rem)] flex flex-col gap-8 overflow-hidden p-2">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-ease-text-primary tracking-tighter uppercase tracking-[0.1em] flex items-center gap-3">
                        <Settings2 className="w-6 h-6 text-ease-blue" />
                        SYSTEM SETTINGS
                    </h1>
                    <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] opacity-40">CONFIGURE THE CORE PARAMETERS OF THE EASE ECOSYSTEM</p>
                </div>
                
                <button className="px-8 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-ease-blue transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-white/5">
                    <Save className="w-4 h-4" />
                    SAVE CONFIGURATION
                </button>
            </div>

            <div className="flex gap-8 h-full overflow-hidden">
                {/* Sidebar Nav */}
                <div className="w-64 flex flex-col gap-2">
                    {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all text-left ${
                            activeTab === tab.id 
                                ? 'bg-ease-blue/20 border-ease-blue text-ease-blue shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                : 'bg-white/5 border-white/5 text-ease-text-secondary hover:border-white/10 hover:bg-white/[0.07]'
                          }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white/5 border border-white/5 rounded-[2.5rem] p-10 overflow-y-auto scrollbar-hide">
                    {activeTab === 'general' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-10"
                        >
                            <Section title="Environment Config" description="Core system identifiers and URLs">
                                <Input label="APP NAME" defaultValue="EASE AI" />
                                <Input label="API BASE URL" defaultValue="http://localhost:3000/api" />
                                <Input label="ADMIN DASHBOARD URL" defaultValue="http://localhost:5173" />
                            </Section>

                            <Section title="Regional Settings" description="Timezone and localization parameters">
                                <Select label="DEFAULT TIMEZONE" options={['UTC', 'PST', 'EST', 'GMT']} defaultValue="UTC" />
                                <Select label="DEFAULT LANGUAGE" options={['English', 'Spanish', 'French', 'German']} defaultValue="English" />
                            </Section>
                        </motion.div>
                    )}

                    {activeTab === 'ai' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-10"
                        >
                            <Section title="Model Orchestration" description="Manage primary and fallback LLM models">
                                <Select label="PRIMARY HYDRATION MODEL" options={['GPT-4o', 'Gemini 1.5 Pro', 'Claude 3.5 Sonnet']} defaultValue="Gemini 1.5 Pro" />
                                <Select label="FALLBACK MODEL" options={['GPT-3.5 Turbo', 'Gemini 1.5 Flash', 'Llama 3']} defaultValue="Gemini 1.5 Flash" />
                            </Section>

                            <Section title="Creativity & Precision" description="Tuning the randomness of AI generation">
                                <Range label="TEMPERATURE" min={0} max={1} step={0.1} defaultValue={0.7} />
                                <Range label="MAX TOKENS" min={512} max={4096} step={128} defaultValue={2048} />
                            </Section>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-10"
                        >
                            <Section title="Authentication" description="Manage user session security">
                                <Input label="JWT SECRET" defaultValue="********" type="password" />
                                <Input label="ACCESS TOKEN TTL (SECONDS)" defaultValue="3600" type="number" />
                            </Section>

                            <Section title="API Keys" description="External service credentials">
                                <Input label="GEMINI API KEY" defaultValue="********" type="password" />
                                <Input label="BREVO API KEY" defaultValue="********" type="password" />
                            </Section>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <div className="space-y-6">
        <div className="space-y-1">
            <h3 className="text-sm font-black text-ease-text-primary uppercase tracking-widest">{title}</h3>
            <p className="text-[10px] text-ease-text-secondary opacity-60 uppercase tracking-widest font-bold">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
        <div className="h-px bg-white/5 w-full mt-10" />
    </div>
);

const Input = ({ label, defaultValue, type = 'text' }: { label: string, defaultValue: string, type?: string }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">{label}</label>
        <input 
          type={type} 
          defaultValue={defaultValue}
          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] font-bold text-ease-text-primary focus:outline-none focus:border-ease-blue transition-all"
        />
    </div>
);

const Select = ({ label, options, defaultValue }: { label: string, options: string[], defaultValue: string }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">{label}</label>
        <select 
          defaultValue={defaultValue}
          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] font-bold text-ease-text-primary focus:outline-none focus:border-ease-blue transition-all appearance-none"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const Range = ({ label, min, max, step, defaultValue }: { label: string, min: number, max: number, step: number, defaultValue: number }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">{label}</label>
            <span className="text-[10px] font-black text-ease-blue">{defaultValue}</span>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          defaultValue={defaultValue}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-ease-blue"
        />
    </div>
);
