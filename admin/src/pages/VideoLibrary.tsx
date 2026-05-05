import { useState, useEffect } from 'react';
import { 
  Video as VideoIcon, 
  Plus, 
  Search, 
  MoreVertical, 
  Play, 
  Eye, 
  TrendingUp,
  Filter,
  Layers,
  Clock,
  Zap,
  Globe,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { videoService } from '../services/video.service';
import clsx from 'clsx';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function VideoLibrary() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
      title: '',
      url: '',
      category: 'Focus'
    });

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const data = await videoService.getAll();
            const enhancedData = data.map((v: any) => ({
              ...v,
              views: Math.floor(Math.random() * 5000) + 100,
              completionRate: Math.floor(Math.random() * 40) + 60,
              growth: (Math.random() * 15).toFixed(1)
            }));
            setVideos(enhancedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await videoService.create(formData);
        setIsModalOpen(false);
        setFormData({ title: '', url: '', category: 'Focus' });
        loadVideos();
      } catch (err) {
        console.error(err);
        alert('Failed to initialize content node.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <div className="space-y-10">
            {/* Stats Header */}
            {/* Stats Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
            >
                <ContentStat 
                  cardTitle="ASSET VOLUME" 
                  value={videos.length} 
                  icon={Layers} 
                  color="blue" 
                  subtitle="Active Modules" 
                />
                <ContentStat 
                  cardTitle="SYNC VELOCITY" 
                  value={`${videos.length > 0 ? Math.round(videos.reduce((acc, v) => acc + v.completionRate, 0) / videos.length) : 0}%`} 
                  icon={Zap} 
                  color="emerald" 
                  subtitle="Avg. Completion" 
                />
                <ContentStat 
                  cardTitle="NEURAL IMPACT" 
                  value={videos.length > 0 ? (videos.reduce((acc, v) => acc + v.views, 0) / 1000).toFixed(1) + 'K' : '0'} 
                  icon={Eye} 
                  color="purple" 
                  subtitle="Total Signals" 
                />
                <ContentStat 
                  cardTitle="GROWTH CURVE" 
                  value={`${videos.length > 0 ? (videos.reduce((acc, v) => acc + parseFloat(v.growth), 0) / videos.length).toFixed(1) : '0'}%`} 
                  icon={TrendingUp} 
                  color="orange" 
                  subtitle="Avg. Momentum" 
                />
            </motion.div>

            {/* Library Tools */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-ease-surface/40 backdrop-blur-md p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-ease-layered flex flex-col md:flex-row justify-between items-center gap-4"
            >
                <div className="relative flex-1 w-full max-w-xl group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary group-focus-within:text-ease-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-ease-bg border border-ease-border rounded-xl lg:rounded-2xl pl-14 pr-8 py-4 lg:py-5 focus:outline-none focus:border-ease-blue transition-all font-bold placeholder:text-ease-text-secondary/40 shadow-inner text-sm"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 lg:px-8 py-4 lg:py-5 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-ease-text-primary hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 shadow-xl">
                        <Filter className="w-4 h-4" />
                        Parameters
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 lg:px-8 py-4 lg:py-5 bg-ease-blue text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:bg-ease-blue-dark hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Initialize
                    </button>
                </div>
            </motion.div>

            {/* Video Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10"
            >
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-ease-surface/40 aspect-[16/10] rounded-[2rem] lg:rounded-[2.5rem] animate-pulse border border-white/5 shadow-inner"></div>
                    ))
                ) : (
                    videos.map((video) => (
                        <motion.div 
                          key={video.id} 
                          variants={itemVariants}
                          className="bg-ease-surface/40 backdrop-blur-md rounded-[2.5rem] lg:rounded-[3rem] border border-white/5 shadow-ease-layered overflow-hidden group hover:border-ease-blue/40 transition-all duration-500 relative"
                        >
                            <div className="relative aspect-[16/10] bg-ease-bg overflow-hidden">
                                {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-1000" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ease-text-secondary/10">
                                        <VideoIcon className="w-16 lg:w-24 h-16 lg:h-24" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-[1.5rem] lg:rounded-[2rem] bg-white text-ease-blue flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] group-hover:rotate-6 transition-transform">
                                    <Play className="w-5 h-5 lg:w-6 lg:h-6 fill-current" />
                                  </div>
                                </div>

                                <div className="absolute top-4 lg:top-6 left-4 lg:left-6 flex gap-2">
                                  <span className="px-3 lg:px-4 py-1.5 lg:py-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase text-white tracking-[0.2em] shadow-2xl">
                                    {video.category || 'Core'}
                                  </span>
                                  {video.views > 4000 && (
                                    <span className="px-3 lg:px-4 py-1.5 lg:py-2 bg-ease-blue/20 backdrop-blur-xl border border-ease-blue/30 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase text-ease-blue tracking-[0.2em] shadow-2xl animate-pulse">
                                      Trending
                                    </span>
                                  )}
                                </div>

                                <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 right-4 lg:right-6 flex justify-between items-end">
                                   <div className="space-y-0.5 lg:space-y-1">
                                      <p className="text-[8px] lg:text-[10px] font-black text-white/50 uppercase tracking-widest">Duration</p>
                                      <div className="flex items-center gap-1.5 lg:gap-2 text-white">
                                         <Clock className="w-3 h-3" />
                                         <span className="text-xs lg:text-sm font-black">12:45</span>
                                      </div>
                                   </div>
                                   <button className="p-2.5 lg:p-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl lg:rounded-2xl text-white hover:bg-white hover:text-ease-blue transition-all active:scale-90">
                                      <Share2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                   </button>
                                </div>
                            </div>

                            <div className="p-6 lg:p-10">
                                <div className="flex justify-between items-start mb-6 lg:mb-8">
                                    <div className="space-y-1.5 lg:space-y-2 flex-1">
                                        <h4 className="font-black text-ease-text-primary text-xl lg:text-2xl tracking-tighter group-hover:text-ease-blue transition-colors leading-tight">
                                          {video.title}
                                        </h4>
                                        <p className="text-[9px] lg:text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.2em] opacity-40">
                                          ID: {video.id.split('-')[0]} // {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <button className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl hover:bg-white/5 text-ease-text-secondary border border-transparent hover:border-white/10 transition-all">
                                        <MoreVertical className="w-5 h-5 lg:w-6 lg:h-6" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 lg:gap-8 pt-6 lg:pt-8 border-t border-white/5">
                                    <div className="space-y-1.5 lg:space-y-2">
                                        <p className="text-[8px] lg:text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em] lg:tracking-[0.25em] opacity-50 flex items-center gap-2">
                                          <Eye className="w-3 h-3" /> Signal
                                        </p>
                                        <p className="text-lg lg:text-xl font-black text-ease-text-primary tracking-tighter">
                                          {video.views?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5 lg:space-y-2">
                                        <p className="text-[8px] lg:text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.2em] lg:tracking-[0.25em] opacity-50 flex items-center gap-2">
                                          <TrendingUp className="w-3 h-3" /> Delta
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <p className="text-lg lg:text-xl font-black text-ease-text-primary tracking-tighter">{video.completionRate}%</p>
                                          <div className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md lg:rounded-lg text-[8px] font-black">
                                            +{video.growth}%
                                          </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-white/5 flex items-center gap-3 lg:gap-4">
                                   <div className="flex -space-x-2 lg:-space-x-3">
                                      {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl border-2 lg:border-4 border-ease-surface bg-ease-blue/20 flex items-center justify-center text-[9px] lg:text-[10px] font-black text-ease-blue">
                                           {i}
                                        </div>
                                      ))}
                                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl border-2 lg:border-4 border-ease-surface bg-white/5 flex items-center justify-center text-[9px] lg:text-[10px] font-black text-ease-text-secondary backdrop-blur-sm">
                                         +12
                                      </div>
                                   </div>
                                   <p className="text-[8px] lg:text-[9px] font-black text-ease-text-secondary uppercase tracking-widest opacity-40">Active Nodes</p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Ingestion Slide-over */}
            <AnimatePresence>
              {isModalOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60]"
                    onClick={() => setIsModalOpen(false)}
                  />
                  <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-full lg:max-w-xl bg-ease-surface/80 backdrop-blur-3xl border-l border-white/10 z-[70] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar"
                  >
                    <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8 lg:space-y-12">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="p-2.5 lg:p-3 bg-ease-blue/10 rounded-xl lg:rounded-2xl border border-ease-blue/20">
                            <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-ease-blue" />
                          </div>
                          <h2 className="text-xl lg:text-2xl font-black text-ease-text-primary uppercase tracking-[0.1em] lg:tracking-[0.2em]">Initialize Content</h2>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 text-ease-text-secondary hover:text-white hover:bg-red-500/20 transition-all active:scale-90"
                        >
                          <X className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>
                      </div>

                      <div className="space-y-6 lg:space-y-8">
                        <div className="space-y-2 lg:space-y-3">
                          <label className="text-[9px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] ml-2">Module Title</label>
                          <input 
                            required
                            type="text" 
                            placeholder="e.g. Master Your Morning Routine"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-4 lg:py-5 focus:outline-none focus:border-ease-blue transition-all font-bold placeholder:text-ease-text-secondary/30 text-sm"
                          />
                        </div>

                        <div className="space-y-2 lg:space-y-3">
                          <label className="text-[9px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] ml-2">Video Resource URL</label>
                          <input 
                            required
                            type="url" 
                            placeholder="https://youtube.com/watch?v=..."
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-4 lg:py-5 focus:outline-none focus:border-ease-blue transition-all font-bold placeholder:text-ease-text-secondary/30 text-sm"
                          />
                        </div>

                        <div className="space-y-2 lg:space-y-3">
                          <label className="text-[9px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] ml-2">Neural Category</label>
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-4 lg:py-5 focus:outline-none focus:border-ease-blue transition-all font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] cursor-pointer appearance-none"
                          >
                            <option value="Focus">Focus</option>
                            <option value="Discipline">Discipline</option>
                            <option value="Physical">Physical</option>
                            <option value="Mental">Mental</option>
                            <option value="Spiritual">Spiritual</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-6 lg:pt-10">
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className={clsx(
                            "w-full py-5 lg:py-6 bg-ease-blue text-white rounded-2xl lg:rounded-3xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4",
                            isSubmitting && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isSubmitting ? (
                            <Zap className="w-5 h-5 animate-pulse" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                          Commit to Infrastructure
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
        </div>
    );
}

function ContentStat({ cardTitle, value, icon: Icon, color, subtitle }: any) {
    const colorStyles: any = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20',
        emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
        purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20',
        orange: 'from-orange-500/20 to-orange-600/5 text-orange-400 border-orange-500/20',
    };

    return (
        <div className="bg-ease-surface/40 backdrop-blur-md rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-ease-layered p-6 lg:p-8 relative overflow-hidden group hover:scale-[1.02] hover:border-white/10 transition-all duration-500">
            <div className={clsx("absolute -right-4 -bottom-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000", colorStyles[color].split(' ')[2])}>
                <Icon className="w-24 lg:w-32 h-24 lg:h-32" />
            </div>
            
            <div className="relative z-10 space-y-4 lg:space-y-6">
               <div className={clsx("w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br border shadow-2xl", colorStyles[color])}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
               </div>
               <div>
                  <p className="text-[9px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] lg:tracking-[0.25em] mb-1 opacity-50">{cardTitle}</p>
                  <div className="flex items-end gap-2 lg:gap-3">
                     <p className="text-2xl lg:text-4xl font-black text-ease-text-primary tracking-tighter">{value}</p>
                     <p className="text-[8px] lg:text-[9px] font-black text-ease-text-secondary uppercase tracking-widest mb-1 lg:mb-1.5 opacity-30 whitespace-nowrap">{subtitle}</p>
                  </div>
               </div>
            </div>
        </div>
    );
}
