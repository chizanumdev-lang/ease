import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

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
        <div className="flex items-center justify-center min-h-screen bg-ease-bg selection:bg-ease-blue/20">
            <div className="w-full max-w-md p-10 bg-ease-surface rounded-[2.5rem] shadow-ease-layered border border-ease-border animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-ease-blue rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-200 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                        E
                    </div>
                    <h2 className="text-3xl font-black text-ease-text-primary tracking-tighter">Admin Portal</h2>
                    <p className="text-ease-text-secondary font-medium mt-2">Sign in to manage the EASE ecosystem</p>
                </div>

                {error && (
                    <div className="p-4 mb-8 text-sm text-ease-error bg-ease-error/5 rounded-2xl border border-ease-error/10 flex items-center gap-3 animate-in shake duration-500">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-ease-text-secondary uppercase tracking-widest ml-4" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ease-text-secondary group-focus-within:text-ease-blue transition-colors" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-ease-blue transition-all font-bold placeholder:text-ease-text-secondary/50 placeholder:font-medium"
                                placeholder="admin@ease.app"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-ease-text-secondary uppercase tracking-widest ml-4" htmlFor="password">
                            Secret Key
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ease-text-secondary group-focus-within:text-ease-blue transition-colors" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-ease-bg border border-ease-border rounded-2xl pl-14 pr-6 py-4 focus:outline-none focus:border-ease-blue transition-all font-bold placeholder:text-ease-text-secondary/50"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full group relative overflow-hidden bg-ease-blue text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-blue-200 hover:bg-ease-blue-dark active:scale-[0.98] transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center justify-center gap-3">
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    <span>Enter Dashboard</span>
                                </>
                            )}
                        </div>
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-xs text-ease-text-secondary font-bold uppercase tracking-tighter opacity-50">
                        Unauthorized access is strictly prohibited
                    </p>
                </div>
            </div>
        </div>
    );
}
