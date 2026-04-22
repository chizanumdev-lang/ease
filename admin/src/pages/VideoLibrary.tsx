import { useState, useEffect } from 'react';
import { 
  Video as VideoIcon, 
  Plus, 
  Search, 
  MoreVertical, 
  Play, 
  Eye, 
  TrendingUp,
  Filter
} from 'lucide-react';
import { videoService } from '../services/video.service';
// import VideoModal from '../components/VideoModal'; // Assuming it exists or will be styled later
import clsx from 'clsx';

export default function VideoLibrary() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const data = await videoService.getAll();
            // Enhancing with mock metrics for demonstration
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ContentStat cardTitle="Total Content" value={videos.length} icon={VideoIcon} color="blue" />
                <ContentStat cardTitle="Avg. Completion" value="84%" icon={Play} color="green" />
                <ContentStat cardTitle="Total Impressions" value="1.2M" icon={Eye} color="purple" />
                <ContentStat cardTitle="Growth Rate" value="+12.5%" icon={TrendingUp} color="orange" />
            </div>

            {/* Library Tools */}
            <div className="bg-ease-surface p-6 rounded-3xl border border-ease-border shadow-ease-layered flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Search video title or category..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-ease-blue transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-ease-bg border border-ease-border rounded-2xl text-sm font-bold text-ease-text-primary hover:bg-ease-border transition-colors">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-ease-blue text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-ease-blue-dark transition-all">
                        <Plus className="w-4 h-4" />
                        Upload Video
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="bg-ease-surface aspect-video rounded-3xl animate-pulse border border-ease-border"></div>
                    ))
                ) : (
                    videos.map((video) => (
                        <div key={video.id} className="bg-ease-surface rounded-3xl border border-ease-border shadow-ease-layered overflow-hidden group hover:border-ease-blue transition-all duration-300">
                            <div className="relative aspect-video bg-ease-bg overflow-hidden">
                                {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ease-text-secondary opacity-20">
                                        <VideoIcon className="w-16 h-16" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-ease-blue shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                    <Play className="w-5 h-5 fill-current" />
                                  </div>
                                </div>
                                <div className="absolute top-4 left-4">
                                  <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black uppercase text-ease-text-primary shadow-sm">
                                    {video.category || 'General'}
                                  </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-ease-text-primary text-lg leading-tight group-hover:text-ease-blue transition-colors truncate max-w-[200px]">{video.title}</h4>
                                        <p className="text-xs text-ease-text-secondary font-medium mt-1">Added on {new Date(video.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <button className="p-2 rounded-xl hover:bg-ease-bg transition-colors">
                                        <MoreVertical className="w-5 h-5 text-ease-text-secondary" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ease-border/50">
                                    <div>
                                        <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest mb-1">Views</p>
                                        <p className="font-bold text-ease-text-primary">{video.views?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest mb-1">Completion</p>
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-ease-text-primary">{video.completionRate}%</p>
                                          <TrendingUp className="w-3 h-3 text-ease-success" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ContentStat({ cardTitle, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-ease-surface rounded-3xl border border-ease-border shadow-ease-layered p-6 flex items-center gap-5 hover:scale-[1.02] transition-transform">
            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", colors[color])}>
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest mb-1">{cardTitle}</p>
                <p className="text-2xl font-black text-ease-text-primary tracking-tighter">{value}</p>
            </div>
        </div>
    );
}
