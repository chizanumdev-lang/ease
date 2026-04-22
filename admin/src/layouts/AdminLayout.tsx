import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, User } from 'lucide-react';

export default function AdminLayout() {
    const { user } = useAuth();
    const location = useLocation();

    const getPageTitle = () => {
      switch(location.pathname) {
        case '/': return 'Overview';
        case '/users': return 'User Explorer';
        case '/content': return 'Content Manager';
        case '/health': return 'System Health';
        default: return 'Dashboard';
      }
    };

    return (
        <div className="min-h-screen bg-ease-bg flex">
            <Sidebar />

            <div className="flex-1 ml-72">
                <header className="sticky top-0 z-30 flex items-center justify-between px-10 h-24 bg-ease-bg/80 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold text-ease-text-primary">
                            {getPageTitle()}
                        </h2>
                        <p className="text-sm text-ease-text-secondary font-medium">
                          Platform metrics and system health at a glance.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="relative group hidden md:block">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ease-text-secondary" />
                          <input 
                            type="text" 
                            placeholder="Search data..." 
                            className="bg-ease-surface border border-ease-border rounded-xl pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-ease-blue transition-colors shadow-ease-layered"
                          />
                        </div>
                        
                        <button className="relative p-2 text-ease-text-secondary hover:text-ease-blue transition-colors">
                          <Bell className="w-6 h-6" />
                          <span className="absolute top-2 right-2 w-2 h-2 bg-ease-error rounded-full border-2 border-ease-bg"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-ease-border">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-ease-text-primary">{user?.name || 'Admin User'}</p>
                            <p className="text-xs text-ease-text-secondary font-medium uppercase tracking-wider">Super Admin</p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-ease-blue/10 border border-ease-blue/20 flex items-center justify-center text-ease-blue shadow-ease-layered overflow-hidden group hover:scale-105 transition-transform">
                              <User className="w-6 h-6" />
                          </div>
                        </div>
                    </div>
                </header>

                <main className="px-10 pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

