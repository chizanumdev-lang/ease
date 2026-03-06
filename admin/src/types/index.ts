export interface Video {
    id: string;
    title: string;
    url: string;
    category: string;
    thumbnailUrl?: string; // Optional, maybe derived from YouTube ID
    duration?: number;
    approved: boolean; // Admin approval flag
    createdAt: string;
    updatedAt: string;
}

export interface VideoCreateInput {
    title: string;
    url: string;
    category: string;
}

export interface VideoUpdateInput extends Partial<VideoCreateInput> {
    approved?: boolean;
}
