import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <LayoutDashboard className="mr-3" /> Dashboard Overview
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Users</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">1,234</p>
                    <span className="text-green-500 text-sm font-medium mt-2 inline-block">+12% from last month</span>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Videos</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">45</p>
                    <span className="text-gray-400 text-sm font-medium mt-2 inline-block">Library growing</span>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Programs Completed</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">892</p>
                    <span className="text-blue-500 text-sm font-medium mt-2 inline-block">Since launch</span>
                </div>
            </div>
        </div>
    );
}
