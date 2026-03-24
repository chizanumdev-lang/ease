import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testUpload() {
    const filePath = '/var/folders/kh/p7y3_mdn39bg0c6k_lv42lvm0000gn/T/ease-audio-binaural-sync/audio_1774342189353.mp3';
    const publicId = 'test_debug_upload';

    if (!fs.existsSync(filePath)) {
        console.error(`File NOT found: ${filePath}`);
        return;
    }

    const stats = fs.statSync(filePath);
    console.log(`File found! Size: ${stats.size} bytes`);

    console.log('Starting manual upload to Cloudinary...');
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'video',
            public_id: `ease/audio/${publicId}`,
            overwrite: true,
            format: 'mp3',
        });
        console.log('Upload SUCCESS:', result.secure_url);
    } catch (err) {
        console.error('Upload FAILED:', err);
    }
}

testUpload();
