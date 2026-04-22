import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Library, 
  Activity, 
  Settings, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar() {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', to: '/' },
        { icon: Users, label: 'User Explorer', to: '/users' },
        { icon: Library, label: 'Content Manager', to: '/content' },
        { icon: Activity, label: 'System Health', to: '/health' },
    ];

    const secondaryItems = [
      { icon: Settings, label: 'Settings', to: '/settings' },
      { icon: HelpCircle, label: 'Support', to: '/support' },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-ease-surface border-r border-ease-border">
            <div className="flex flex-col h-full">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ease-blue rounded-xl flex items-center justify-center text-white font-bold text-xl">
                          E
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-ease-text-primary tracking-tight">EASE</h1>
                          <p className="text-xs text-ease-text-secondary font-medium">Personal Growth</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center px-4 py-3 rounded-xl transition-all duration-200 group',
                                        isActive 
                                          ? 'bg-ease-blue text-white shadow-lg shadow-blue-200' 
                                          : 'text-ease-text-secondary hover:bg-ease-bg hover:text-ease-text-primary'
                                    )
                                }
                            >
                                <item.icon className={clsx("w-5 h-5 mr-3", "group-hover:scale-110 transition-transform")} />
                                <span className="font-semibold">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-ease-border space-y-1">
                        {secondaryItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center px-4 py-3 rounded-xl transition-all duration-200 group',
                                        isActive 
                                          ? 'bg-ease-blue text-white shadow-lg' 
                                          : 'text-ease-text-secondary hover:bg-ease-bg hover:text-ease-text-primary'
                                    )
                                }
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span className="font-semibold">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="p-6 border-t border-ease-border">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-3 text-ease-text-secondary rounded-xl hover:bg-ease-error/10 hover:text-ease-error transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
                        <span className="font-semibold">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

