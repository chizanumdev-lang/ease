import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Library, 
  Activity, 
  LogOut,
  Shield,
  Box,
  Settings2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: Users, label: 'Users', to: '/users' },
        { icon: Library, label: 'Content', to: '/content' },
        { icon: Activity, label: 'Health', to: '/health' },
        { icon: Box, label: 'Workflow', to: '/workflow' },
        { icon: Settings2, label: 'Settings', to: '/settings' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
                />
              )}
            </AnimatePresence>

            <aside className={clsx(
              "fixed left-0 top-0 z-50 h-screen w-80 bg-ease-surface/40 backdrop-blur-xl border-r border-white/5 shadow-2xl overflow-hidden transition-transform duration-300 lg:translate-x-0",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="absolute inset-0 bg-gradient-to-b from-ease-blue/5 via-transparent to-purple-500/5 pointer-events-none" />
                
                <div className="flex flex-col h-full relative z-10">
                    <div className="p-8 lg:p-10 flex items-center justify-between">
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4"
                        >
                            <div className="relative group">
                              <div className="absolute -inset-2 bg-ease-blue/20 rounded-2xl blur-lg group-hover:bg-ease-blue/40 transition-all opacity-0 group-hover:opacity-100" />
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-ease-blue rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10 group-hover:rotate-6 transition-transform duration-500">
                                <Shield className="w-5 h-5 lg:w-6 lg:h-6" />
                              </div>
                            </div>
                            <div>
                              <h1 className="text-xl lg:text-2xl font-black text-ease-text-primary tracking-tighter leading-none">EASE</h1>
                              <p className="text-[8px] lg:text-[9px] text-ease-text-secondary font-black uppercase tracking-[0.3em] mt-1 opacity-40">Management Portal</p>
                            </div>
                        </motion.div>

                        <button 
                          onClick={onClose}
                          className="lg:hidden p-2 rounded-xl bg-white/5 text-ease-text-secondary hover:text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 lg:px-6 py-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <p className="px-4 text-[9px] font-black text-ease-text-secondary uppercase tracking-[0.25em] mb-4 opacity-30">Navigation</p>
                            {navItems.map((item, idx) => (
                                <motion.div
                                  key={item.to}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                    <NavLink
                                        to={item.to}
                                        onClick={() => window.innerWidth < 1024 && onClose()}
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center px-4 lg:px-5 py-3 lg:py-4 rounded-[1.25rem] transition-all duration-300 group relative overflow-hidden',
                                                isActive 
                                                  ? 'text-white' 
                                                  : 'text-ease-text-secondary hover:bg-white/5 hover:text-ease-text-primary'
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                          <>
                                            {isActive && (
                                              <motion.div 
                                                layoutId="nav-active"
                                                className="absolute inset-0 bg-ease-blue shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] rounded-[1.25rem] -z-10"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                              />
                                            )}
                                            <item.icon className={clsx(
                                              "w-5 h-5 mr-3 lg:mr-4 transition-all duration-300",
                                              isActive ? "text-white scale-110" : "group-hover:scale-110 group-hover:text-ease-blue"
                                            )} />
                                            <span className="text-[12px] lg:text-[13px] font-black uppercase tracking-widest">{item.label}</span>
                                            {isActive && (
                                              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                                            )}
                                          </>
                                        )}
                                    </NavLink>
                                </motion.div>
                            ))}
                        </div>
                    </nav>

                    <div className="p-6 lg:p-8 mt-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        <button
                            onClick={logout}
                            className="flex items-center w-full px-5 lg:px-6 py-4 lg:py-5 text-ease-text-secondary rounded-[1.25rem] lg:rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-500 group overflow-hidden relative shadow-xl"
                        >
                            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/[0.02] transition-colors" />
                            <LogOut className="w-5 h-5 mr-3 lg:mr-4 group-hover:-translate-x-1 transition-transform relative z-10" />
                            <span className="text-[11px] lg:text-[12px] font-black uppercase tracking-[0.2em] relative z-10">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

