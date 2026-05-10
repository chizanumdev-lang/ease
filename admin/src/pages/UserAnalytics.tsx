import { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingDown, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Shield,
  Trash2,
  Activity,
  Award,
  Clock,
  Flag,
  CheckCircle2,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';
import type { UserMetric } from '../services/admin.service';
import clsx from 'clsx';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function UserAnalytics() {
    const [users, setUsers] = useState<UserMetric[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserMetric | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const [status, setStatus] = useState<'all' | 'verified' | 'unverified'>('all');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await adminService.getUsers(page, 10, search, status);
            setUsers(data.users);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search, status]);

    const handleSelectUser = async (user: UserMetric) => {
        setSelectedUser(user);
        setLoadingDetails(true);
        try {
            const details = await adminService.getUserDetails(user.id);
            setSelectedUser(details);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleToggleAdmin = async (id: string) => {
      setIsUpdatingRole(true);
      try {
        const updatedUser = await adminService.toggleAdmin(id);
        setSelectedUser(prev => prev ? { ...prev, isAdmin: updatedUser.isAdmin } : null);
        fetchUsers();
      } catch (error) {
        console.error('Failed to toggle admin status:', error);
      } finally {
        setIsUpdatingRole(false);
      }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Are you absolutely sure you want to delete this user?')) {
            return;
        }
        setIsDeleting(true);
        try {
            await adminService.deleteUser(id);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (name: string = 'User') => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="relative min-h-[calc(100vh-120px)] space-y-6">
            {/* Header & Search */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-ease-surface/40 backdrop-blur-md p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 shadow-ease-layered flex flex-col md:flex-row justify-between items-center gap-4"
            >
                <div className="relative flex-1 w-full max-w-full md:max-w-md group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary group-focus-within:text-ease-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-ease-blue transition-all font-bold placeholder:text-ease-text-secondary/50 shadow-inner"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56 group">
                      <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary pointer-events-none group-focus-within:text-ease-blue transition-colors" />
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-12 pr-10 py-4 appearance-none focus:outline-none focus:border-ease-blue transition-all font-black text-[10px] uppercase tracking-widest text-ease-text-primary shadow-inner cursor-pointer"
                      >
                        <option value="all">All</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </div>
                </div>
            </motion.div>

            {/* Users Table */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-ease-surface/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-ease-layered overflow-hidden"
            >
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 lg:px-10 py-6 lg:py-8 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em]">User</th>
                                <th className="px-4 lg:px-6 py-6 lg:py-8 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] text-center">Status</th>
                                <th className="px-4 lg:px-6 py-6 lg:py-8 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] text-center">Progress</th>
                                <th className="px-4 lg:px-6 py-6 lg:py-8 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] text-center hidden sm:table-cell">Streak</th>
                                <th className="px-4 lg:px-6 py-6 lg:py-8 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] text-center hidden lg:table-cell">Activity</th>
                                <th className="px-6 lg:px-10 py-6 lg:py-8 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody 
                          className="divide-y divide-white/5"
                        >
                            {loading ? (
                              <tr>
                                <td colSpan={6} className="px-8 py-32 text-center">
                                  <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-ease-blue/10 border-t-ease-blue rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-widest animate-pulse">Decrypting User Shards...</p>
                                  </div>
                                </td>
                              </tr>
                            ) : users.length > 0 ? (
                              users.map((user) => (
                                  <tr 
                                    key={user.id} 
                                    onClick={() => handleSelectUser(user)}
                                    className="hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                                  >
                                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                                          <div className="flex items-center gap-3 lg:gap-5">
                                              <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-ease-blue/10 border border-white/5 flex items-center justify-center text-ease-blue font-black text-[10px] lg:text-sm shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative">
                                                  {getInitials(user.name)}
                                                  {user.isAdmin && (
                                                     <div className="absolute -top-1 -right-1 lg:-top-1.5 lg:-right-1.5 w-4 h-4 lg:w-5 lg:h-5 bg-ease-blue rounded-full border-2 border-ease-surface flex items-center justify-center shadow-lg">
                                                       <Shield className="w-2 lg:w-2.5 h-2 lg:h-2.5 text-white fill-current" />
                                                     </div>
                                                   )}
                                              </div>
                                              <div>
                                                  <div className="flex items-center gap-1.5 lg:gap-2.5">
                                                    <p className="font-black text-ease-text-primary text-sm lg:text-base tracking-tight">{user.name}</p>
                                                    {user.isAdmin && (
                                                      <span className="px-1.5 lg:px-2 py-0.5 bg-ease-blue text-white text-[7px] lg:text-[8px] font-black uppercase rounded-lg tracking-[0.1em] shadow-sm">Admin</span>
                                                    )}
                                                  </div>
                                                  <p className="text-[10px] lg:text-xs text-ease-text-secondary font-bold tracking-tight opacity-60 mt-0.5 truncate max-w-[120px] lg:max-w-none">{user.email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 lg:px-6 py-4 lg:py-6 text-center">
                                          <div className={clsx(
                                            "inline-flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                            user.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-orange-500/10 text-orange-400 border-orange-500/10'
                                          )}>
                                            <span className={clsx("w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full animate-pulse", user.isVerified ? 'bg-emerald-400' : 'bg-orange-400')} />
                                            <span className="hidden sm:inline">{user.isVerified ? 'Verified' : 'Unverified'}</span>
                                            <span className="sm:hidden">{user.isVerified ? 'VER' : 'UNV'}</span>
                                          </div>
                                      </td>
                                      <td className="px-4 lg:px-6 py-4 lg:py-6 text-center">
                                          <div className="inline-flex flex-col items-center">
                                            <p className="text-[11px] lg:text-sm font-black text-ease-text-primary tracking-tight">V.{user.level || 1}.0</p>
                                            <div className="w-16 lg:w-28 h-1.5 lg:h-2 bg-white/5 rounded-full mt-1.5 lg:mt-2.5 overflow-hidden border border-white/5 p-[1px] lg:p-[1.5px] shadow-inner">
                                              <div 
                                                className="h-full bg-gradient-to-r from-ease-blue to-blue-400 rounded-full transition-all duration-1000 ease-out" 
                                                style={{width: `${((user.xp || 0) % 1000) / 10}%`}}
                                              ></div>
                                            </div>
                                          </div>
                                      </td>
                                      <td className="px-4 lg:px-6 py-4 lg:py-6 text-center hidden sm:table-cell">
                                          <p className="text-sm lg:text-base font-black text-ease-text-primary tracking-tighter">{user.streak || 0} Cycles</p>
                                          <p className="text-[8px] lg:text-[9px] text-ease-text-secondary font-black uppercase tracking-widest mt-1 opacity-50">Current Streak</p>
                                      </td>
                                      <td className="px-4 lg:px-6 py-4 lg:py-6 hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                          {(user.streak || 0) < 3 ? (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/5 text-red-400 rounded-xl border border-red-500/10 backdrop-blur-sm shadow-sm">
                                              <TrendingDown className="w-4 h-4" />
                                              <span className="text-[10px] font-black uppercase tracking-widest">Low Activity</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 text-emerald-400 rounded-xl border border-emerald-500/10 backdrop-blur-sm shadow-sm">
                                              <TrendingUp className="w-4 h-4" />
                                              <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 lg:px-10 py-4 lg:py-6 text-right">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectUser(user);
                                            }}
                                            className="p-2 lg:p-3 rounded-xl lg:rounded-2xl hover:bg-white/5 text-ease-text-secondary hover:text-ease-blue transition-all border border-transparent hover:border-white/10 shadow-sm"
                                          >
                                              <MoreHorizontal className="w-4 lg:w-5 h-4 lg:h-5" />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-8 py-32 text-center text-ease-text-secondary font-black uppercase tracking-[0.2em] opacity-40">
                                  No Identity Fragments Located
                                </td>
                              </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 lg:px-10 py-6 lg:py-8 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] lg:text-[11px] text-ease-text-secondary font-black uppercase tracking-widest text-center sm:text-left">
                        Index Shard <span className="text-ease-text-primary text-xs lg:text-sm px-1.5 py-0.5 bg-white/5 rounded-lg border border-white/5">{(page-1)*10 + 1}—{Math.min(page*10, total)}</span> of <span className="text-ease-text-primary text-xs lg:text-sm px-1.5 py-0.5 bg-white/5 rounded-lg border border-white/5">{total}</span> Nodes
                    </p>
                    <div className="flex gap-3 lg:gap-4">
                        <button 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="flex items-center justify-center w-12 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 text-ease-text-secondary disabled:opacity-20 hover:border-ease-blue hover:text-ease-blue transition-all shadow-xl active:scale-90"
                        >
                            <ChevronLeft className="w-5 lg:w-6 h-5 lg:h-6" />
                        </button>
                        <div className="flex items-center justify-center px-5 lg:px-6 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-ease-blue text-white text-xs lg:text-sm font-black shadow-2xl shadow-blue-500/30">
                          {page}
                        </div>
                        <button 
                          onClick={() => setPage(p => p + 1)}
                          disabled={page * 10 >= total}
                          className="flex items-center justify-center w-12 lg:w-14 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 text-ease-text-secondary disabled:opacity-20 hover:border-ease-blue hover:text-ease-blue transition-all shadow-xl active:scale-90"
                        >
                          <ChevronRight className="w-5 lg:w-6 h-5 lg:h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* User Detail Side Panel */}
            <AnimatePresence>
              {selectedUser && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xl z-40"
                    onClick={() => setSelectedUser(null)}
                  />
                  <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-full md:max-w-xl bg-ease-surface/90 backdrop-blur-3xl border-l border-white/10 z-50 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-y-auto custom-scrollbar"
                  >
                    <div className="p-6 lg:p-12 space-y-8 lg:space-y-12">
                      {/* Panel Header */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="p-2 lg:p-3 bg-ease-blue/10 rounded-xl lg:rounded-2xl border border-ease-blue/20">
                            <Zap className="w-5 lg:w-6 h-5 lg:h-6 text-ease-blue" />
                          </div>
                          <h2 className="text-lg lg:text-2xl font-black text-ease-text-primary uppercase tracking-[0.2em]">User Details</h2>
                        </div>
                        <button 
                          onClick={() => setSelectedUser(null)}
                          className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 text-ease-text-secondary hover:text-white hover:bg-red-500/20 hover:border-red-500/20 transition-all active:scale-90 shadow-xl"
                        >
                          <X className="w-5 lg:w-6 h-5 lg:h-6" />
                        </button>
                      </div>

                      {/* Profile Header */}
                      <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-[2rem] lg:rounded-[3rem] border border-white/5 p-6 lg:p-10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
                          <Shield className="w-48 lg:w-64 h-48 lg:h-64" />
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4 lg:space-y-6 relative z-10">
                          <div className="w-24 lg:w-32 h-24 lg:h-32 rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-ease-blue to-blue-600 border-[4px] lg:border-[6px] border-white/10 shadow-2xl flex items-center justify-center text-white text-2xl lg:text-4xl font-black relative group-hover:scale-105 transition-transform duration-700">
                            {getInitials(selectedUser.name)}
                            {selectedUser.isAdmin && (
                               <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 p-1.5 lg:p-2.5 bg-ease-blue rounded-xl lg:rounded-2xl shadow-2xl border border-white/20">
                                 <Shield className="w-4 lg:w-6 h-4 lg:h-6 text-white fill-current" />
                               </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-2xl lg:text-4xl font-black text-ease-text-primary tracking-tighter">{selectedUser.name}</h3>
                            <p className="text-ease-text-secondary font-black uppercase tracking-widest text-[10px] lg:text-xs opacity-50 mt-1 lg:mt-2">{selectedUser.email}</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                            {selectedUser.isAdmin && (
                              <div className="px-4 lg:px-6 py-1.5 lg:py-2.5 bg-ease-blue text-white rounded-xl lg:rounded-2xl text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20">
                                ADMIN
                              </div>
                            )}
                            <div className="px-4 lg:px-6 py-1.5 lg:py-2.5 bg-white/5 text-white rounded-xl lg:rounded-2xl text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] border border-white/5">
                              LVL {selectedUser.level || 1}
                            </div>
                            <div className={clsx(
                              "px-4 lg:px-6 py-1.5 lg:py-2.5 rounded-xl lg:rounded-2xl text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                              selectedUser.isVerified ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" : "bg-orange-500/10 text-orange-400 border-orange-500/10"
                            )}>
                              {selectedUser.isVerified ? 'VERIFIED' : 'PENDING'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Prediction & Pulse Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/[0.03] p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-xl space-y-4 lg:space-y-6">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em]">Churn Risk</p>
                            {(selectedUser.streak || 0) < 3 ? (
                              <TrendingDown className="w-4 lg:w-5 h-4 lg:h-5 text-red-400" />
                            ) : (
                              <TrendingUp className="w-4 lg:w-5 h-4 lg:h-5 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex items-end gap-2 lg:gap-3">
                            <p className="text-3xl lg:text-5xl font-black text-ease-text-primary tracking-tighter">
                              {(selectedUser.streak || 0) < 3 ? '84%' : '12%'}
                            </p>
                            <p className={clsx(
                              "text-[8px] lg:text-[10px] font-black uppercase mb-1 lg:mb-2 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-lg shadow-sm border",
                              (selectedUser.streak || 0) < 3 ? 'bg-red-500/10 text-red-400 border-red-500/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                            )}>
                              {(selectedUser.streak || 0) < 3 ? 'Critical' : 'Stable'}
                            </p>
                          </div>
                          <div className="w-full h-2 lg:h-2.5 bg-white/5 rounded-full overflow-hidden p-[1px] lg:p-[1.5px] border border-white/5 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: (selectedUser.streak || 0) < 3 ? '84%' : '12%' }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={clsx(
                                "h-full rounded-full shadow-lg",
                                (selectedUser.streak || 0) < 3 ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              )}
                            />
                          </div>
                        </div>

                        <div className="bg-white/[0.03] p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-xl space-y-4 lg:space-y-6">
                          <p className="text-[9px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.25em]">Activity History</p>
                          <div className="flex items-center gap-1 lg:gap-2 h-12 lg:h-16 pt-2">
                            {[40, 70, 45, 90, 65, 80, 50, 85, 95, 75].map((h, i) => (
                              <div 
                                key={i}
                                className="flex-1 bg-ease-blue/10 rounded-full relative group overflow-hidden"
                              >
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ duration: 1, delay: i * 0.05 }}
                                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ease-blue to-blue-400 rounded-full shadow-lg"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[8px] lg:text-[9px] font-black text-ease-text-secondary/40 uppercase tracking-[0.2em]">
                            <span>PRE</span>
                            <span>NOW</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="bg-white/5 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-white/5 flex flex-col items-center gap-1 lg:gap-2 group hover:bg-ease-blue/5 transition-colors">
                          <Activity className="w-4 lg:w-5 h-4 lg:h-5 text-ease-blue mb-0.5 lg:mb-1" />
                          <p className="text-[8px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">Rate</p>
                          <p className="text-xl lg:text-2xl font-black text-ease-text-primary tracking-tighter group-hover:text-ease-blue">
                            {selectedUser.stats?.completionRate ? `${Math.round(selectedUser.stats.completionRate)}%` : '0%'}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-white/5 flex flex-col items-center gap-1 lg:gap-2 group hover:bg-purple-500/5 transition-colors">
                          <Award className="w-4 lg:w-5 h-4 lg:h-5 text-purple-400 mb-0.5 lg:mb-1" />
                          <p className="text-[8px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">Streak</p>
                          <p className="text-xl lg:text-2xl font-black text-ease-text-primary tracking-tighter group-hover:text-purple-400">{selectedUser.streak || 0}d</p>
                        </div>
                        <div className="bg-white/5 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-white/5 flex flex-col items-center gap-1 lg:gap-2 group hover:bg-orange-500/5 transition-colors col-span-2 lg:col-span-1">
                          <Clock className="w-4 lg:w-5 h-4 lg:h-5 text-orange-400 mb-0.5 lg:mb-1" />
                          <p className="text-[8px] lg:text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">Tasks</p>
                          <p className="text-xl lg:text-2xl font-black text-ease-text-primary tracking-tighter group-hover:text-orange-400">{selectedUser.stats?.completedTasks || 0}</p>
                        </div>
                      </div>

                      {/* Active Program Section */}
                      {loadingDetails ? (
                        <div className="py-20 text-center space-y-6">
                          <div className="relative inline-block">
                            <div className="w-16 h-16 border-4 border-ease-blue/10 border-t-ease-blue rounded-full animate-spin mx-auto" />
                            <Zap className="absolute inset-0 m-auto text-ease-blue animate-pulse w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.3em] animate-pulse">Navigating Data Cluster...</p>
                        </div>
                      ) : (
                        <>
                          {selectedUser.programs && selectedUser.programs.length > 0 && (
                            <div className="space-y-6">
                              <h4 className="text-[11px] font-black text-ease-text-secondary uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-ease-blue animate-pulse" />
                                Current Program
                              </h4>
                              {selectedUser.programs.map((program) => (
                                <div key={program.id} className="bg-gradient-to-br from-ease-blue/10 to-transparent p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-ease-blue/20 space-y-4 lg:space-y-6 shadow-2xl relative overflow-hidden group">
                                  <div className="absolute -right-4 -bottom-4 p-4 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000">
                                    <Globe className="w-24 lg:w-32 h-24 lg:h-32 text-ease-blue" />
                                  </div>
                                  <div className="flex items-start gap-4 lg:gap-6 relative z-10">
                                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center text-ease-blue border border-ease-blue/10 group-hover:rotate-6 transition-transform duration-500">
                                      <Flag className="w-6 lg:w-8 h-6 lg:h-8" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="text-lg lg:text-xl font-black text-ease-text-primary tracking-tighter leading-tight">{program.title}</h5>
                                      <p className="text-[10px] lg:text-xs text-ease-text-secondary font-bold mt-1.5 lg:mt-2 opacity-60">Manifest: {program.purpose}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between text-[10px] font-black text-ease-text-secondary uppercase tracking-widest">
                                      <span>Sync Progression</span>
                                      <span className="text-ease-blue">{Math.round((program.dayPlans?.filter((dp: any) => dp.isCompleted).length || 0) / (program.dayPlans?.length || 1) * 100)}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-[2px] border border-white/10 shadow-inner">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(program.dayPlans?.filter((dp: any) => dp.isCompleted).length || 0) / (program.dayPlans?.length || 1) * 100}%` }}
                                        transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full bg-gradient-to-r from-ease-blue to-blue-400 rounded-full shadow-lg"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Recent Activity Timeline */}
                          <div className="space-y-8">
                            <h4 className="text-[11px] font-black text-ease-text-secondary uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Activity Log
                            </h4>
                            <div className="relative pl-10 space-y-10">
                              <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/5" />
                              
                              <AnimatePresence>
                                {selectedUser.programs?.flatMap(p => p.dayPlans || [])
                                  .filter((dp: any) => dp.isCompleted)
                                  .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                  .slice(0, 5)
                                  .map((dp: any, idx: number) => (
                                    <motion.div 
                                      key={dp.id} 
                                      initial={{ x: -20, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="relative flex items-start gap-6 group"
                                    >
                                      <div className="absolute -left-[32.5px] lg:-left-[35px] w-4 lg:w-5 h-4 lg:h-5 rounded-full bg-ease-surface border-[3px] lg:border-[4px] border-emerald-500 ring-[6px] lg:ring-[8px] ring-black/10 shadow-xl group-hover:scale-125 transition-transform duration-300" />
                                      <div className="flex-1 bg-white/[0.03] p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all group/card shadow-lg">
                                        <div className="flex justify-between items-start">
                                          <p className="text-sm lg:text-base font-black text-ease-text-primary tracking-tight group-hover/card:text-ease-blue transition-colors">{dp.title || `Day ${dp.dayNumber} Completion`}</p>
                                          <div className="p-1 lg:p-1.5 bg-emerald-500/10 rounded-lg">
                                            <CheckCircle2 className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-emerald-400" />
                                          </div>
                                        </div>
                                        <p className="text-[8px] lg:text-[9px] text-ease-text-secondary font-black uppercase mt-2 lg:mt-3 tracking-[0.15em] opacity-40">
                                          {new Date(dp.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    </motion.div>
                                  ))
                                }
                              </AnimatePresence>

                              {(!selectedUser.programs || selectedUser.programs.every(p => !p.dayPlans?.some((dp: any) => dp.isCompleted))) && (
                                <div className="text-center py-12 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
                                  <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.2em] opacity-40 italic">
                                    Zero Activity Fragments Recorded
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* System Metadata */}
                      <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-ease-text-secondary uppercase tracking-[0.3em] px-2">Access Privileges</h4>
                        <div className="bg-white/5 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden shadow-2xl">
                          <div className="flex items-center justify-between p-6 lg:p-8 hover:bg-white/[0.08] transition-colors group">
                            <div className="flex items-center gap-4 lg:gap-5">
                              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-ease-text-secondary group-hover:text-ease-blue group-hover:scale-110 transition-all">
                                <Calendar className="w-5 lg:w-6 h-5 lg:h-6" />
                              </div>
                              <div>
                                <span className="text-xs lg:text-sm font-black text-ease-text-primary tracking-tight">Tenure Record</span>
                                <p className="text-[9px] lg:text-[10px] text-ease-text-secondary font-black uppercase tracking-widest mt-1 opacity-40">System Admission</p>
                              </div>
                            </div>
                            <span className="text-[10px] lg:text-xs font-black text-ease-text-primary px-3 py-1.5 lg:px-4 lg:py-2 bg-white/5 rounded-lg lg:rounded-xl border border-white/5 shadow-inner">
                              {new Date(selectedUser.lastActive || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-between p-6 lg:p-8 hover:bg-white/[0.08] transition-colors group gap-6 sm:gap-0">
                            <div className="flex items-center gap-4 lg:gap-5 self-start sm:self-auto">
                              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-ease-text-secondary group-hover:text-ease-blue group-hover:scale-110 transition-all">
                                <Shield className="w-5 lg:w-6 h-5 lg:h-6" />
                              </div>
                              <div>
                                <span className="text-xs lg:text-sm font-black text-ease-text-primary tracking-tight">Root Clearance</span>
                                <p className="text-[9px] lg:text-[10px] text-ease-text-secondary font-black uppercase tracking-widest mt-1 opacity-40">Administrative Rights</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleToggleAdmin(selectedUser.id)}
                              disabled={isUpdatingRole}
                              className={clsx(
                                "w-full sm:w-auto px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] transition-all active:scale-90 shadow-2xl shadow-black/20 border",
                                selectedUser.isAdmin 
                                  ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white" 
                                  : "bg-ease-blue/10 text-ease-blue border-ease-blue/20 hover:bg-ease-blue hover:text-white"
                              )}
                            >
                              {isUpdatingRole ? 'Syncing...' : selectedUser.isAdmin ? 'REVOKE ACCESS' : 'GRANT ACCESS'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action Zone */}
                      <div className="pt-6 space-y-6">
                        <h4 className="text-[11px] font-black text-red-400 uppercase tracking-[0.3em] px-2">Danger Directive</h4>
                        <div className="p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-red-500/20 bg-red-500/[0.03] space-y-6 lg:space-y-8 relative overflow-hidden shadow-2xl">
                          <div className="absolute -top-10 -right-10 p-8 opacity-[0.05] rotate-12">
                            <Trash2 className="w-48 lg:w-64 h-48 lg:h-64 text-red-500" />
                          </div>
                          <div className="relative z-10 space-y-4 lg:space-y-6">
                            <p className="text-[11px] lg:text-sm text-ease-text-secondary font-bold leading-relaxed opacity-60">
                              Executing a purge sequence will permanently delete this node and all associated neural patterns from the infrastructure. This action is irreversible.
                            </p>
                            <button 
                              onClick={() => handleDeleteUser(selectedUser.id)}
                              disabled={isDeleting}
                              className={clsx(
                                "w-full flex items-center justify-center gap-3 lg:gap-4 py-4 lg:py-6 bg-red-500 text-white rounded-2xl lg:rounded-3xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-red-500/40 hover:bg-red-600 hover:scale-[1.02] active:scale-95 transition-all",
                                isDeleting && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {isDeleting ? (
                                <Activity className="w-5 lg:w-6 h-5 lg:w-6 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 lg:w-6 h-5 lg:w-6" />
                              )}
                              PURGE NODE DATA
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
        </div>
    );
}
