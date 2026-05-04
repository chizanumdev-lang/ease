import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Zap, 
  Cpu, 
  Clock, 
  X, 
  Save, 
  Trash2, 
  Filter, 
  BrainCircuit, 
  Settings2,
  Award,
  ChevronRight,
  Headphones,
  Play,
  FileQuestion,
  Activity,
  Target,
  Heart,
  Users as UsersIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { adminService } from '../../../services/admin.service';
import clsx from 'clsx';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export const WorkflowBuilder: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            console.log("NEURAL_DEBUG: Starting template fetch...");
            setLoading(true);
            const data = await adminService.getTaskTemplates();
            console.log("NEURAL_DEBUG: Templates received:", data);
            setTemplates(data);
        } catch (error: any) {
            console.error("NEURAL_DEBUG: Failed to load task templates", error);
            if (error.response) {
                console.error("NEURAL_DEBUG: Response error:", error.response.status, error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesFilter = filter === 'all' || t.type === filter;
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                             t.description.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const types = ['all', 'mental', 'focus', 'exercise', 'audio', 'video', 'quiz', 'life', 'social'];

    return (
        <div className="h-[calc(100vh-14rem)] flex flex-col gap-6 overflow-hidden relative p-2">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-ease-text-primary tracking-tighter uppercase tracking-[0.1em] flex items-center gap-3">
                        <BrainCircuit className="w-6 h-6 text-ease-blue" />
                        NEURAL TASK BANK
                    </h1>
                    <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] opacity-40">MANAGE THE ATOMIC INGREDIENTS OF THE AI BRAIN</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary" />
                        <input 
                          type="text" 
                          placeholder="SEARCH SHARDS..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full bg-ease-surface/40 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-ease-text-primary focus:outline-none focus:border-ease-blue/50 transition-all placeholder:text-ease-text-secondary/30"
                        />
                    </div>
                    <button className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-ease-blue transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-white/5">
                        <Plus className="w-4 h-4" />
                        CREATE NEW SHARD
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                    <Filter className="w-4 h-4 text-ease-text-secondary" />
                </div>
                {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={clsx(
                        "px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                        filter === type 
                          ? "bg-ease-blue/20 border-ease-blue text-ease-blue shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                          : "bg-white/5 border-white/5 text-ease-text-secondary hover:border-ease-blue/50"
                      )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Task Grid */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-64 bg-white/5 rounded-[2rem] border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredTemplates.map((template) => (
                            <motion.div 
                              key={template.id}
                              variants={itemVariants}
                              whileHover={{ scale: 1.02, y: -4 }}
                              onClick={() => setSelectedTemplate(template)}
                              className="group bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between cursor-pointer hover:border-ease-blue transition-all shadow-xl hover:shadow-ease-blue/5"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-ease-blue/50 transition-colors">
                                            {template.type === 'audio' ? <Headphones className="w-5 h-5 text-pink-400" /> :
                                             template.type === 'video' ? <Play className="w-5 h-5 text-red-400" /> :
                                             template.type === 'quiz' ? <FileQuestion className="w-5 h-5 text-yellow-400" /> :
                                             template.type === 'exercise' ? <Activity className="w-5 h-5 text-emerald-400" /> :
                                             template.type === 'focus' ? <Target className="w-5 h-5 text-ease-blue" /> :
                                             template.type === 'life' ? <Heart className="w-5 h-5 text-rose-400" /> :
                                             template.type === 'social' ? <UsersIcon className="w-5 h-5 text-cyan-400" /> :
                                             <Zap className="w-5 h-5 text-purple-400" />}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-ease-text-secondary uppercase tracking-widest opacity-40">{template.type}</span>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-ease-text-primary uppercase tracking-widest mt-1">
                                                <Clock className="w-3 h-3 text-ease-text-secondary" />
                                                {template.defaultDuration}M
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-black text-ease-text-primary tracking-widest uppercase">{template.title}</h3>
                                        <p className="text-[10px] text-ease-text-secondary leading-relaxed line-clamp-3 opacity-60">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-3 h-3 text-ease-blue" />
                                        <span className="text-[9px] font-black text-ease-blue uppercase tracking-widest">{template.defaultXp} XP</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] font-black text-ease-text-secondary uppercase tracking-widest">DETAILS</span>
                                        <ChevronRight className="w-3 h-3 text-ease-text-secondary" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Template Editor Drawer */}
            <AnimatePresence>
                {selectedTemplate && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedTemplate(null)}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 rounded-[2.5rem]"
                        />
                        {/* Drawer Content */}
                        <motion.div 
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          className="absolute top-0 right-0 bottom-0 w-[500px] bg-ease-surface/90 backdrop-blur-2xl border-l border-white/10 z-50 p-10 flex flex-col gap-8 shadow-[-20px_0_40px_rgba(0,0,0,0.4)]"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-ease-blue/10 rounded-2xl border border-ease-blue/20">
                                        <Settings2 className="w-6 h-6 text-ease-blue" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-ease-text-primary tracking-widest uppercase">SHARD EDITOR</h2>
                                        <p className="text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em] opacity-40">TUNING NEURAL PARAMETERS</p>
                                    </div>
                                </div>
                                <button 
                                  onClick={() => setSelectedTemplate(null)}
                                  className="p-3 hover:bg-black/40 rounded-2xl border border-transparent hover:border-white/10 transition-all text-ease-text-secondary"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">SHARD IDENTITY</label>
                                    <input 
                                      type="text" 
                                      defaultValue={selectedTemplate.title}
                                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-bold text-ease-text-primary focus:outline-none focus:border-ease-blue transition-all"
                                      placeholder="TEMPLATE NAME"
                                    />
                                    <textarea 
                                      defaultValue={selectedTemplate.description}
                                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-medium text-ease-text-secondary h-24 focus:outline-none focus:border-ease-blue transition-all resize-none"
                                      placeholder="USER-FACING DESCRIPTION"
                                    />
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">DURATION (MINS)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary" />
                                            <input 
                                              type="number" 
                                              defaultValue={selectedTemplate.defaultDuration}
                                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-black text-ease-text-primary focus:outline-none focus:border-ease-blue transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">REWARD (XP)</label>
                                        <div className="relative">
                                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-blue" />
                                            <input 
                                              type="number" 
                                              defaultValue={selectedTemplate.defaultXp}
                                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-black text-ease-text-primary focus:outline-none focus:border-ease-blue transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* AI INSTRUCTIONS - THE BRAIN DATA */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-ease-blue uppercase tracking-widest flex items-center gap-2">
                                            <Cpu className="w-4 h-4" />
                                            AI SELECTION LOGIC
                                        </label>
                                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 uppercase">Active</span>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-ease-blue/20 to-purple-500/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                        <textarea 
                                          defaultValue={selectedTemplate.promptInstructions}
                                          className="relative w-full bg-black/60 border border-white/5 rounded-2xl p-6 text-xs font-medium text-ease-text-primary h-48 focus:outline-none focus:border-ease-blue transition-all resize-none leading-relaxed"
                                          placeholder="Define the logic for how the AI brain should use this shard..."
                                        />
                                    </div>
                                    <p className="text-[9px] text-ease-text-secondary italic opacity-50 leading-relaxed">
                                        * This text is never shown to the user. It is fed directly to the LLM to help it decide when this task is relevant to a user's prompt.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-6 border-t border-white/10">
                                <button className="flex-1 py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-ease-blue transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                                    <Save className="w-4 h-4" />
                                    SYNC SHARD
                                </button>
                                <button className="p-4 bg-black/40 border border-white/5 rounded-2xl text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all active:scale-95">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
