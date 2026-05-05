import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { Mail, Lock, AlertCircle, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, user } = response.data;
            login(accessToken, user);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-ease-bg relative overflow-hidden selection:bg-ease-blue/20">
            {/* Background Mesh Gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-ease-blue/15 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/15 blur-[150px] rounded-full" />
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="w-full max-w-xl p-16 bg-ease-surface/40 backdrop-blur-2xl rounded-[4rem] shadow-ease-layered border border-white/5 relative"
            >
                <div className="absolute -top-12 -left-12 p-8 opacity-[0.03] rotate-12">
                   <Shield className="w-64 h-64 text-ease-blue" />
                </div>

                <div className="flex flex-col items-center mb-16 relative z-10">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 6 }}
                      className="w-20 h-20 bg-ease-blue rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-8 relative group"
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Shield className="w-8 h-8 relative z-10" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-ease-text-primary tracking-tighter uppercase mb-2">Neural Access</h2>
                    <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.4em] opacity-40">System Orchestration Node</p>
                </div>

                {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 mb-10 text-[11px] text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-4 animate-in shake duration-500 uppercase font-black tracking-widest"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.3em] ml-6 opacity-40" htmlFor="email">
                            Operator Identity
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ease-text-secondary group-focus-within:text-ease-blue transition-colors opacity-50" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/20 border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-ease-blue/40 focus:bg-black/30 transition-all font-bold text-ease-text-primary placeholder:text-ease-text-secondary/20 shadow-inner"
                                placeholder="authority@ease.app"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-ease-text-secondary uppercase tracking-[0.3em] ml-6 opacity-40" htmlFor="password">
                            Authentication Shard
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ease-text-secondary group-focus-within:text-ease-blue transition-colors opacity-50" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-ease-blue/40 focus:bg-black/30 transition-all font-bold text-ease-text-primary placeholder:text-ease-text-secondary/20 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                          "w-full group relative overflow-hidden bg-ease-blue text-white rounded-[2rem] py-6 font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="flex items-center justify-center gap-4 relative z-10">
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Key className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    <span>Initiate Protocol</span>
                                </>
                            )}
                        </div>
                    </button>
                </form>

                <div className="mt-16 text-center">
                    <p className="text-[10px] text-ease-text-secondary font-black uppercase tracking-[0.2em] opacity-20">
                       ENCRYPTED MULTI-FACTOR AUTHENTICATION ACTIVE
                    </p>
                </div>
            </motion.div>

            {/* Bottom Branding */}
            <div className="fixed bottom-12 left-0 right-0 text-center opacity-10">
                <p className="text-[10px] font-black uppercase tracking-[1em] text-white">Security Level: Omega</p>
            </div>
        </div>
    );
}
