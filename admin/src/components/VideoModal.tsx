import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { VideoCreateInput, Video } from '../types';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (video: VideoCreateInput) => Promise<void>;
    videoToEdit?: Video | null;
}

export default function VideoModal({ isOpen, onClose, onSave, videoToEdit }: VideoModalProps) {
    const [formData, setFormData] = useState<VideoCreateInput>({
        title: '',
        url: '',
        category: 'General', // Default category
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Categories could be fetched from API or defined as constants
    const CATEGORIES = ['General', 'Mindfulness', 'Productivity', 'Sleep', 'Exercise', 'Nutrition'];

    useEffect(() => {
        if (videoToEdit) {
            setFormData({
                title: videoToEdit.title,
                url: videoToEdit.url,
                category: videoToEdit.category,
            });
        } else {
            setFormData({
                title: '',
                url: '',
                category: 'General',
            });
        }
        setError('');
    }, [videoToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save video');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {videoToEdit ? 'Edit Video' : 'Add New Video'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. 10 Minute Meditation"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                        <input
                            type="url"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving...' : 'Save Video'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
