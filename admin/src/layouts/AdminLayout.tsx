import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="p-4 sm:ml-64">
                <header className="flex items-center justify-between p-4 mb-6 bg-white rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Welcome, {user?.name || 'Admin'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        {/* Add header actions or profile avatar here if needed */}
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
