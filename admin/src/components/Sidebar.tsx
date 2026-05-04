import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Library, 
  Activity, 
  LogOut,
  Shield,
  Box,
  Settings2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar() {
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
        <aside className="fixed left-0 top-0 z-50 h-screen w-80 bg-ease-surface/40 backdrop-blur-xl border-r border-white/5 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-ease-blue/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="flex flex-col h-full relative z-10">
                <div className="p-10">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4"
                    >
                        <div className="relative group">
                          <div className="absolute -inset-2 bg-ease-blue/20 rounded-2xl blur-lg group-hover:bg-ease-blue/40 transition-all opacity-0 group-hover:opacity-100" />
                          <div className="w-12 h-12 bg-ease-blue rounded-2xl flex items-center justify-center text-white shadow-2xl relative z-10 group-hover:rotate-6 transition-transform duration-500">
                            <Shield className="w-6 h-6" />
                          </div>
                        </div>
                        <div>
                          <h1 className="text-2xl font-black text-ease-text-primary tracking-tighter leading-none">EASE</h1>
                          <p className="text-[9px] text-ease-text-secondary font-black uppercase tracking-[0.3em] mt-1 opacity-40">Management Portal</p>
                        </div>
                    </motion.div>
                </div>

                <nav className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar">
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
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center px-5 py-4 rounded-[1.25rem] transition-all duration-300 group relative overflow-hidden',
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
                                          "w-5 h-5 mr-4 transition-all duration-300",
                                          isActive ? "text-white scale-110" : "group-hover:scale-110 group-hover:text-ease-blue"
                                        )} />
                                        <span className="text-[13px] font-black uppercase tracking-widest">{item.label}</span>
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

                <div className="p-8 mt-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-6 py-5 text-ease-text-secondary rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-500 group overflow-hidden relative shadow-xl"
                    >
                        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/[0.02] transition-colors" />
                        <LogOut className="w-5 h-5 mr-4 group-hover:-translate-x-1 transition-transform relative z-10" />
                        <span className="text-[12px] font-black uppercase tracking-[0.2em] relative z-10">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

