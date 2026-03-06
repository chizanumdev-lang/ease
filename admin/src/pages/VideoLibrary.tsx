import { useState, useEffect } from 'react';
import { Video, Plus, Edit, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { videoService } from '../services/video.service';
import type { Video as VideoType, VideoCreateInput } from '../types';
import VideoModal from '../components/VideoModal';

export default function VideoLibrary() {
    const [videos, setVideos] = useState<VideoType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoToEdit, setVideoToEdit] = useState<VideoType | null>(null);

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const data = await videoService.getAll();
            setVideos(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (video: VideoType | null = null) => {
        setVideoToEdit(video);
        setIsModalOpen(true);
    };

    const handleSaveVideo = async (formData: VideoCreateInput) => {
        try {
            if (videoToEdit) {
                const updated = await videoService.update(videoToEdit.id, formData);
                setVideos(videos.map(v => v.id === updated.id ? updated : v));
            } else {
                const created = await videoService.create(formData);
                setVideos([...videos, created]);
            }
            setIsModalOpen(false);
        } catch (error) {
            throw error; // Re-throw to let modal handle error display
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this video?')) return;
        try {
            await videoService.delete(id);
            setVideos(videos.filter(v => v.id !== id));
        } catch (err) {
            alert('Failed to delete video');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading library...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Video className="mr-3" /> Video Library
                </h1>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    onClick={() => handleOpenModal(null)}
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Video
                </button>
            </div>

            {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbnail</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / URL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {videos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No videos found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                videos.map((video) => (
                                    <tr key={video.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                                {video.thumbnailUrl ? (
                                                    <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover rounded" />
                                                ) : (
                                                    <Video className="w-8 h-8 opacity-50" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{video.title}</div>
                                            <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center mt-1">
                                                View on YouTube <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                {video.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {video.approved ? (
                                                <span className="flex items-center text-green-600 text-sm">
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Approved
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-yellow-600 text-sm">
                                                    <XCircle className="w-4 h-4 mr-1" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                title="Edit"
                                                onClick={() => handleOpenModal(video)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                                onClick={() => handleDelete(video.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <VideoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveVideo}
                videoToEdit={videoToEdit}
            />
        </div>
    );
}
