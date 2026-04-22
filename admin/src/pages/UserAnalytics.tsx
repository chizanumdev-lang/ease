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
} from 'lucide-react';
import { adminService } from '../services/admin.service';
import type { UserMetric } from '../services/admin.service';
import clsx from 'clsx';

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
        alert('Failed to update admin status.');
      } finally {
        setIsUpdatingRole(false);
      }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Are you absolutely sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await adminService.deleteUser(id);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const getInitials = (name: string = 'User') => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="relative min-h-[calc(100vh-120px)] space-y-6 animate-in fade-in duration-700">
            {/* Header & Search */}
            <div className="bg-ease-surface p-6 rounded-3xl border border-ease-border shadow-ease-layered flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full max-md:max-w-none max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-ease-blue transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary pointer-events-none" />
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-12 pr-4 py-3 appearance-none focus:outline-none focus:border-ease-blue transition-all font-bold text-sm text-ease-text-primary"
                      >
                        <option value="all">All Status</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </div>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-ease-blue text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-ease-blue-dark transition-all">
                        Export
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-ease-surface rounded-3xl border border-ease-border shadow-ease-layered overflow-hidden">
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ease-bg/50 border-b border-ease-border">
                                <th className="px-8 py-6 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">User Profile</th>
                                <th className="px-6 py-6 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="px-6 py-6 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] text-center">Progression</th>
                                <th className="px-6 py-6 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] text-center">Streak</th>
                                <th className="px-6 py-6 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">Churn Risk</th>
                                <th className="px-8 py-6 text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ease-border">
                            {loading ? (
                              <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-ease-text-secondary font-bold animate-pulse">
                                  Accessing user records...
                                </td>
                              </tr>
                            ) : users.length > 0 ? (
                              users.map((user) => (
                                  <tr 
                                    key={user.id} 
                                    onClick={() => handleSelectUser(user)}
                                    className="hover:bg-ease-bg/40 transition-all duration-200 group cursor-pointer"
                                  >
                                      <td className="px-8 py-5">
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-2xl bg-ease-blue/10 border border-ease-blue/5 flex items-center justify-center text-ease-blue font-black text-sm shadow-sm group-hover:scale-105 transition-transform relative">
                                                  {getInitials(user.name)}
                                                  {user.isAdmin && (
                                                     <div className="absolute -top-1 -right-1 w-4 h-4 bg-ease-blue rounded-full border-2 border-white flex items-center justify-center">
                                                       <Shield className="w-2 h-2 text-white fill-current" />
                                                     </div>
                                                   )}
                                              </div>
                                              <div>
                                                  <div className="flex items-center gap-2">
                                                    <p className="font-bold text-ease-text-primary text-base">{user.name}</p>
                                                    {user.isAdmin && (
                                                      <span className="px-1.5 py-0.5 bg-ease-blue/10 text-ease-blue text-[8px] font-black uppercase rounded-md tracking-tighter">Admin</span>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-ease-text-secondary font-medium tracking-tight">{user.email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-5 text-center">
                                          <span className={clsx(
                                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                                            user.isVerified ? 'bg-ease-success/10 text-ease-success' : 'bg-orange-500/10 text-orange-500'
                                          )}>
                                            {user.isVerified ? 'Verified' : 'Unverified'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-5 text-center">
                                          <div className="inline-flex flex-col items-center">
                                            <p className="text-sm font-bold text-ease-text-primary tracking-tight">Level {user.level || 1}</p>
                                            <div className="w-24 h-2 bg-ease-bg rounded-full mt-2 overflow-hidden border border-ease-border/50 p-[1px]">
                                              <div 
                                                className="h-full bg-gradient-to-r from-ease-blue to-blue-400 rounded-full transition-all duration-1000 ease-out" 
                                                style={{width: `${((user.xp || 0) % 1000) / 10}%`}}
                                              ></div>
                                            </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-5 text-center">
                                          <p className="text-sm font-black text-ease-text-primary">{user.streak || 0} days</p>
                                          <p className="text-[10px] text-ease-text-secondary font-bold uppercase tracking-tighter opacity-70">Current Heat</p>
                                      </td>
                                      <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                          {(user.streak || 0) < 3 ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-ease-error/5 text-ease-error rounded-xl border border-ease-error/10">
                                              <TrendingDown className="w-3.5 h-3.5" />
                                              <span className="text-[10px] font-black uppercase tracking-tight">High Risk</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-ease-success/5 text-ease-success rounded-xl border border-ease-success/10">
                                              <TrendingUp className="w-3.5 h-3.5" />
                                              <span className="text-[10px] font-black uppercase tracking-tight">Stable</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-8 py-5 text-right">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectUser(user);
                                            }}
                                            className="p-2.5 rounded-xl hover:bg-ease-bg text-ease-text-secondary hover:text-ease-blue transition-all border border-transparent hover:border-ease-border"
                                          >
                                              <MoreHorizontal className="w-5 h-5" />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-ease-text-secondary font-medium">
                                  No users found matching your criteria.
                                </td>
                              </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-ease-bg/30 border-t border-ease-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-ease-text-secondary font-medium">
                        Showing <span className="font-bold text-ease-text-primary">{(page-1)*10 + 1}</span> to <span className="font-bold text-ease-text-primary">{Math.min(page*10, total)}</span> of <span className="font-bold text-ease-text-primary">{total}</span> records
                    </p>
                    <div className="flex gap-3">
                        <button 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-ease-surface border border-ease-border text-ease-text-secondary disabled:opacity-30 hover:border-ease-blue hover:text-ease-blue transition-all shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center justify-center px-4 h-12 rounded-2xl bg-ease-surface border border-ease-border text-sm font-black text-ease-text-primary shadow-sm">
                          {page}
                        </div>
                        <button 
                          onClick={() => setPage(p => p + 1)}
                          disabled={page * 10 >= total}
                          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-ease-surface border border-ease-border text-ease-text-secondary disabled:opacity-30 hover:border-ease-blue hover:text-ease-blue transition-all shadow-sm active:scale-95"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* User Detail Side Panel */}
            {selectedUser && (
              <>
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 animate-in fade-in duration-300"
                  onClick={() => setSelectedUser(null)}
                />
                <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-ease-surface border-l border-ease-border z-50 shadow-[0_0_80px_rgba(0,0,0,0.25)] animate-in slide-in-from-right duration-500 overflow-y-auto">
                  <div className="p-10 space-y-10">
                    {/* Panel Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-ease-blue rounded-full" />
                        <h2 className="text-2xl font-black text-ease-text-primary uppercase tracking-wider">Intelligence</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="p-3 rounded-2xl bg-ease-bg border border-ease-border text-ease-text-secondary hover:text-ease-text-primary transition-all active:scale-95 shadow-sm"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Profile Header */}
                    <div className="bg-ease-bg/50 rounded-[2.5rem] border border-ease-border p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Shield className="w-32 h-32" />
                      </div>
                      <div className="flex flex-col items-center text-center space-y-5 relative z-10">
                        <div className="w-28 h-28 rounded-[2.2rem] bg-gradient-to-br from-ease-blue to-blue-600 border-4 border-white shadow-2xl flex items-center justify-center text-white text-4xl font-black relative">
                          {getInitials(selectedUser.name)}
                          {selectedUser.isAdmin && (
                             <div className="absolute -top-2 -right-2 p-2 bg-white rounded-2xl shadow-xl border border-ease-blue/10">
                               <Shield className="w-6 h-6 text-ease-blue fill-current" />
                             </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-ease-text-primary tracking-tight">{selectedUser.name}</h3>
                          <p className="text-ease-text-secondary font-semibold mt-1">{selectedUser.email}</p>
                        </div>
                        <div className="flex gap-3">
                          {selectedUser.isAdmin && (
                            <div className="px-5 py-2 bg-ease-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-ease-blue shadow-lg shadow-blue-200">
                              SYSTEM ADMIN
                            </div>
                          )}
                          <div className="px-5 py-2 bg-ease-blue/10 text-ease-blue rounded-2xl text-[10px] font-black uppercase tracking-widest border border-ease-blue/10">
                            PRO MEMBER
                          </div>
                          <div className={clsx(
                            "px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border",
                            selectedUser.isVerified ? "bg-ease-success/10 text-ease-success border-ease-success/10" : "bg-orange-500/10 text-orange-500 border-orange-500/10"
                          )}>
                            {selectedUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prediction & Pulse Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-ease-surface p-6 rounded-[2rem] border border-ease-border shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">Churn Prediction</p>
                          {(selectedUser.streak || 0) < 3 ? (
                            <TrendingDown className="w-4 h-4 text-ease-error" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-ease-success" />
                          )}
                        </div>
                        <div className="flex items-end gap-3">
                          <p className="text-4xl font-black text-ease-text-primary">
                            {(selectedUser.streak || 0) < 3 ? '84%' : '12%'}
                          </p>
                          <p className={clsx(
                            "text-[10px] font-black uppercase mb-1.5 px-2 py-0.5 rounded-lg",
                            (selectedUser.streak || 0) < 3 ? 'bg-ease-error/10 text-ease-error' : 'bg-ease-success/10 text-ease-success'
                          )}>
                            {(selectedUser.streak || 0) < 3 ? 'Critical' : 'Low'}
                          </p>
                        </div>
                        <div className="w-full h-1.5 bg-ease-bg rounded-full overflow-hidden">
                          <div 
                            className={clsx(
                              "h-full rounded-full transition-all duration-1000",
                              (selectedUser.streak || 0) < 3 ? 'bg-ease-error' : 'bg-ease-success'
                            )}
                            style={{width: (selectedUser.streak || 0) < 3 ? '84%' : '12%'}}
                          />
                        </div>
                      </div>

                      <div className="bg-ease-surface p-6 rounded-[2rem] border border-ease-border shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em]">Engagement Pulse</p>
                        <div className="flex items-center gap-1.5 h-12">
                          {[40, 70, 45, 90, 65, 80, 50, 85, 95, 75].map((h, i) => (
                            <div 
                              key={i}
                              className="flex-1 bg-ease-blue/20 rounded-full relative group"
                            >
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-ease-blue rounded-full transition-all duration-700 delay-[100ms*i]"
                                style={{height: `${h}%`}}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-ease-text-secondary/50 uppercase tracking-tighter">
                          <span>30D AGO</span>
                          <span>TODAY</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-ease-bg p-5 rounded-3xl border border-ease-border flex flex-col items-center gap-1">
                        <Activity className="w-4 h-4 text-ease-blue mb-1" />
                        <p className="text-[9px] font-black text-ease-text-secondary uppercase">Rate</p>
                        <p className="text-lg font-black text-ease-text-primary">
                          {selectedUser.stats?.completionRate ? `${Math.round(selectedUser.stats.completionRate)}%` : '0%'}
                        </p>
                      </div>
                      <div className="bg-ease-bg p-5 rounded-3xl border border-ease-border flex flex-col items-center gap-1">
                        <Award className="w-4 h-4 text-purple-500 mb-1" />
                        <p className="text-[9px] font-black text-ease-text-secondary uppercase">Heat</p>
                        <p className="text-lg font-black text-ease-text-primary">{selectedUser.streak || 0}d</p>
                      </div>
                      <div className="bg-ease-bg p-5 rounded-3xl border border-ease-border flex flex-col items-center gap-1">
                        <Clock className="w-4 h-4 text-orange-500 mb-1" />
                        <p className="text-[9px] font-black text-ease-text-secondary uppercase">Tasks</p>
                        <p className="text-lg font-black text-ease-text-primary">{selectedUser.stats?.completedTasks || 0}</p>
                      </div>
                    </div>

                    {/* Active Program Section */}
                    {loadingDetails ? (
                      <div className="py-10 text-center space-y-4">
                        <div className="w-10 h-10 border-4 border-ease-blue border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-black text-ease-text-secondary uppercase tracking-widest">Accessing Cluster Data...</p>
                      </div>
                    ) : (
                      <>
                        {selectedUser.programs && selectedUser.programs.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                              Active Goal
                            </h4>
                            {selectedUser.programs.map((program) => (
                              <div key={program.id} className="bg-ease-blue/5 p-6 rounded-[2.5rem] border border-ease-blue/10 space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-ease-blue border border-ease-blue/5">
                                    <Flag className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-lg font-black text-ease-text-primary tracking-tight">"{program.title}"</h5>
                                    <p className="text-xs text-ease-text-secondary font-semibold mt-1">Goal: {program.purpose}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black text-ease-text-secondary uppercase tracking-tighter">
                                    <span>Program Progression</span>
                                    <span>{Math.round((program.dayPlans?.filter((dp: any) => dp.isCompleted).length || 0) / (program.dayPlans?.length || 1) * 100)}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-ease-blue/5 p-[1px]">
                                    <div 
                                      className="h-full bg-ease-blue rounded-full transition-all duration-1000"
                                      style={{width: `${(program.dayPlans?.filter((dp: any) => dp.isCompleted).length || 0) / (program.dayPlans?.length || 1) * 100}%`}}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recent Activity Timeline */}
                        <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] px-1">
                            Neural Activity Pulse
                          </h4>
                          <div className="relative pl-6 space-y-8">
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-ease-border" />
                            
                            {selectedUser.programs?.flatMap(p => p.dayPlans || [])
                              .filter((dp: any) => dp.isCompleted)
                              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                              .slice(0, 5)
                              .map((dp: any, idx: number) => (
                                <div key={dp.id} className="relative flex items-start gap-4 animate-in slide-in-from-left duration-500" style={{animationDelay: `${idx * 100}ms`}}>
                                  <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-ease-bg border-4 border-ease-success ring-4 ring-ease-surface" />
                                  <div className="flex-1 bg-ease-bg/30 p-4 rounded-2xl border border-ease-border hover:border-ease-blue/20 transition-all group">
                                    <div className="flex justify-between items-start">
                                      <p className="text-sm font-bold text-ease-text-primary group-hover:text-ease-blue transition-colors">{dp.title || `Day ${dp.dayNumber} Completed`}</p>
                                      <CheckCircle2 className="w-4 h-4 text-ease-success opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-[10px] text-ease-text-secondary font-black uppercase mt-1">
                                      {new Date(dp.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              ))
                            }

                            {(!selectedUser.programs || selectedUser.programs.every(p => !p.dayPlans?.some((dp: any) => dp.isCompleted))) && (
                              <div className="text-center py-6 text-ease-text-secondary text-xs font-semibold italic">
                                No recent activity patterns detected.
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* System Metadata */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        System Attributes
                      </h4>
                      <div className="bg-ease-bg/30 rounded-[2rem] border border-ease-border divide-y divide-ease-border overflow-hidden">
                        <div className="flex items-center justify-between p-5 hover:bg-ease-bg/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-ease-surface border border-ease-border flex items-center justify-center text-ease-text-secondary">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-ease-text-primary">Account Tenure</span>
                          </div>
                          <span className="text-xs font-black text-ease-text-secondary uppercase">
                            {new Date(selectedUser.lastActive || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-5 hover:bg-ease-bg/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-ease-surface border border-ease-border flex items-center justify-center text-ease-text-secondary">
                              <Shield className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-ease-text-primary">Admin Access</span>
                          </div>
                          <button 
                            onClick={() => handleToggleAdmin(selectedUser.id)}
                            disabled={isUpdatingRole}
                            className={clsx(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95",
                              selectedUser.isAdmin 
                                ? "bg-ease-error/10 text-ease-error hover:bg-ease-error hover:text-white border border-ease-error/20" 
                                : "bg-ease-blue/10 text-ease-blue hover:bg-ease-blue hover:text-white border border-ease-blue/20"
                            )}
                          >
                            {isUpdatingRole ? 'Syncing...' : selectedUser.isAdmin ? 'REVOKE ACCESS' : 'GRANT ACCESS'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Zone */}
                    <div className="pt-4 space-y-4">
                      <h4 className="text-[10px] font-black text-ease-error uppercase tracking-[0.2em] px-1">Termination Sequence</h4>
                      <div className="p-8 rounded-[2.5rem] border border-ease-error/20 bg-ease-error/[0.03] space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                          <Trash2 className="w-32 h-32 text-ease-error" />
                        </div>
                        <div className="relative z-10 space-y-4">
                          <p className="text-sm text-ease-text-secondary font-semibold leading-relaxed">
                            Account termination is irreversible. This will purge all associated programs, goals, and behavioral data from the system clusters.
                          </p>
                          <button 
                            onClick={() => handleDeleteUser(selectedUser.id)}
                            disabled={isDeleting}
                            className={clsx(
                              "w-full flex items-center justify-center gap-3 py-5 bg-ease-error text-white rounded-2xl text-sm font-black shadow-xl shadow-red-200/50 hover:bg-red-600 hover:scale-[1.02] transition-all active:scale-95",
                              isDeleting && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isDeleting ? (
                              <Activity className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                            TERMINATE SESSION & PURGE DATA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
    );
}
