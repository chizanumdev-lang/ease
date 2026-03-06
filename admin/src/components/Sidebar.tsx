import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Target, FileText, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar() {
    const { logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
        { icon: Video, label: 'Video Library', to: '/videos' },
        { icon: Target, label: 'Goal Categories', to: '/goals' },
        { icon: FileText, label: 'Program Templates', to: '/programs' },
        { icon: Users, label: 'User Analytics', to: '/analytics' },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 transition-transform bg-gray-900 text-white">
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-16 border-b border-gray-800">
                    <h1 className="text-xl font-bold tracking-wider text-blue-500">EASE ADMIN</h1>
                </div>

                <div className="flex-1 px-3 py-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center p-3 rounded-lg group hover:bg-gray-800 transition-colors',
                                            isActive ? 'bg-blue-600 text-white' : 'text-gray-400'
                                        )
                                    }
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={logout}
                        className="flex items-center w-full p-3 text-gray-400 rounded-lg hover:bg-red-900/20 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
