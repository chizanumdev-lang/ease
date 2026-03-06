import { useState } from 'react';
import { Target, Tag, Film, Save } from 'lucide-react';

const INITIAL_CATEGORIES = [
    { id: '1', name: 'Physical Health', description: 'Fitness, Nutrition, Sleep', videoCount: 12 },
    { id: '2', name: 'Mental Clarity', description: 'Meditation, Mindfulness, Focus', videoCount: 8 },
    { id: '3', name: 'Skill Acquisition', description: 'Learning, Practice, Study', videoCount: 5 },
    { id: '4', name: 'Creativity', description: 'Art, Writing, Music', videoCount: 3 },
];

export default function GoalCategories() {
    const [categories] = useState(INITIAL_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    return (
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 min-h-[600px]">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-100 p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Target className="mr-2 w-5 h-5" /> Categories
                </h2>
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors border ${selectedCategory === cat.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                    : 'hover:bg-gray-50 border-transparent'
                                }`}
                        >
                            <div className="font-medium text-gray-900">{cat.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                                <Film className="w-3 h-3 mr-1" /> {cat.videoCount} videos
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-2/3 p-6 bg-gray-50">
                {selectedCategory ? (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {categories.find(c => c.id === selectedCategory)?.name}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Manage assigned videos and tag rules for this category.
                                </p>
                            </div>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex-1">
                            <h4 className="font-medium text-gray-700 mb-4 flex items-center">
                                <Tag className="w-4 h-4 mr-2" /> Associated Tags
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-8">
                                {['fitness', 'strength', 'cardio', 'health'].map(tag => (
                                    <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200">
                                        #{tag}
                                    </span>
                                ))}
                                <button className="text-blue-500 text-sm hover:underline px-2">+ Add Tag</button>
                            </div>

                            <h4 className="font-medium text-gray-700 mb-4 flex items-center">
                                <Film className="w-4 h-4 mr-2" /> Curated Videos
                            </h4>
                            <p className="text-sm text-gray-500 italic mb-4">
                                Videos tagged with the above keywords are automatically included.
                                You can also manually pin videos here.
                            </p>

                            <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center text-gray-400 text-sm">
                                Drag and drop videos here or search library
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Select a category to view details
                    </div>
                )}
            </div>
        </div>
    );
}
