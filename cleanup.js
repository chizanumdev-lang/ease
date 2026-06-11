require('dotenv').config();
const { Client } = require('pg');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Connected to DB. Starting cleanup...');

  // Find all users that have programs
  const { rows: users } = await client.query('SELECT DISTINCT user_id FROM programs');
  console.log(`Found ${users.length} users with programs.`);
  
  for (const { user_id } of users) {
    // Get programs for user ordered by created_at DESC
    const { rows: programs } = await client.query('SELECT id, title, created_at FROM programs WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    
    if (programs.length <= 1) {
      continue;
    }

    console.log(`User ${user_id} has ${programs.length} programs. Keeping the most recent one.`);

    // Keep the first one, delete the rest
    for (let i = 1; i < programs.length; i++) {
      const progId = programs[i].id;
      console.log(` Deleting program ${progId} (${programs[i].title})`);
      
      // Get associated ritual tracks
      const { rows: rituals } = await client.query('SELECT url FROM ritual_tracks WHERE program_id = $1', [progId]);
      for (const rt of rituals) {
        if (rt.url) {
          const match = rt.url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
          if (match && match[1]) {
            console.log('   -> Deleting ritual from Cloudinary:', match[1]);
            await cloudinary.uploader.destroy(match[1], { resource_type: 'video' }).catch(console.error);
          }
        }
      }
      
      // Get associated audio tracks from day plans
      const { rows: audios } = await client.query(`
        SELECT a.url FROM audio_tracks a 
        JOIN day_plans d ON a.day_plan_id = d.id 
        WHERE d.program_id = $1
      `, [progId]);
      
      for (const at of audios) {
        if (at.url) {
          const match = at.url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
          if (match && match[1]) {
            console.log('   -> Deleting audio track from Cloudinary:', match[1]);
            await cloudinary.uploader.destroy(match[1], { resource_type: 'video' }).catch(console.error);
          }
        }
      }
      
      // Delete from DB (cascade will handle the rest)
      await client.query('DELETE FROM programs WHERE id = $1', [progId]);
      console.log(`   -> Deleted program ${progId} from DB`);
    }
  }
  
  await client.end();
  console.log('Cleanup complete!');
}

run().catch(console.error);
