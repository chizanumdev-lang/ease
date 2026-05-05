import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout() {
    const { user } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-ease-bg flex relative overflow-hidden">
            {/* Background Mesh Gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ease-blue/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 lg:ml-80 min-h-screen flex flex-col transition-all duration-300">
                <header className="sticky top-0 z-40 flex items-center justify-between lg:justify-end px-6 lg:px-12 h-20 lg:h-28 bg-ease-bg/60 backdrop-blur-xl border-b border-white/5 shadow-2xl">
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-3 rounded-2xl bg-white/5 border border-white/5 text-ease-text-primary hover:bg-white/10 transition-all"
                    >
                      <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-5 pl-8">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-ease-text-primary tracking-tight">{user?.name || 'Admin'}</p>
                        <p className="text-[9px] text-ease-text-secondary font-black uppercase tracking-[0.2em] opacity-40">Super Admin</p>
                      </div>
                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-[1.25rem] lg:rounded-[1.5rem] bg-gradient-to-br from-ease-blue to-indigo-600 p-[1px] shadow-2xl group cursor-pointer hover:scale-105 transition-all">
                         <div className="w-full h-full bg-ease-bg rounded-[1.2rem] lg:rounded-[1.4rem] flex items-center justify-center text-ease-blue overflow-hidden">
                            <User className="w-6 h-6 lg:w-7 lg:h-7" />
                         </div>
                      </div>
                    </div>
                </header>

                <main className="px-6 lg:px-12 py-8 lg:py-10 flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <Outlet />
                      </motion.div>
                    </AnimatePresence>
                </main>

                <footer className="px-6 lg:px-12 py-6 lg:py-8 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <p className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.3em] opacity-20">Ease v1.4.2</p>
                </footer>
            </div>
        </div>
    );
}

