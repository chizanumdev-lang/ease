import { FileText, Clock } from 'lucide-react';

export default function ProgramTemplates() {
    const days = [
        { day: 1, title: 'Foundation', focus: 'Mindset & Preparation', tasks: 3 },
        { day: 2, title: 'First Steps', focus: 'Core Concepts', tasks: 4 },
        { day: 3, title: 'Building Momentum', focus: 'Action & Practice', tasks: 4 },
        { day: 4, title: 'Deep Dive', focus: 'Advanced Techniques', tasks: 5 },
        { day: 5, title: 'Reflection', focus: 'Review & Adjust', tasks: 3 },
        { day: 6, title: 'Integration', focus: 'Applying Skills', tasks: 4 },
        { day: 7, title: 'Completion', focus: 'Next Steps & Planning', tasks: 2 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FileText className="mr-3" /> Program Templates
                </h1>
                <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Standard 7-Day</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">30-Day Challenge</span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Standard 7-Day Journey</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-2xl">
                    This base template is used for most generated goal programs.
                    It follows a "Learn-Practice-Reflect" arc designed to maximize retention and habit formation.
                </p>

                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    <div className="space-y-8">
                        {days.map((day) => (
                            <div key={day.day} className="relative flex items-start group">
                                {/* Day User Badge */}
                                <div className="absolute left-0 w-16 flex justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-blue-600 font-bold text-sm z-10 group-hover:bg-blue-50 transition-colors">
                                        {day.day}
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className="ml-20 flex-1 bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{day.title}</h3>
                                            <p className="text-sm text-blue-600 font-medium mb-1">{day.focus}</p>
                                        </div>
                                        <div className="flex flex-col items-end text-xs text-gray-400 space-y-1">
                                            <span className="flex items-center"><CheckSquareIcon className="w-3 h-3 mr-1" /> {day.tasks} Tasks</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> ~15 mins</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckSquareIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
    )
}
