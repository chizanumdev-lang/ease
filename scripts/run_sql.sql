BEGIN;
SET session_replication_role = replica;

-- Delete the auto-created row
DELETE FROM users WHERE id = 'ef1531b8-f821-4a41-b07d-139e659712a8';

-- Update foreign keys
UPDATE goals SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE programs SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE ritual_tracks SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE check_ins SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE program_ratings SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE user_programs_engine SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE error_logs SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE ai_generation_logs SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE quiz_attempts SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE progress SET user_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE user_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
UPDATE referrals SET referrer_id = 'ef1531b8-f821-4a41-b07d-139e659712a8' WHERE referrer_id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';

-- Update the main users row and revert email back from temp_
UPDATE users SET id = 'ef1531b8-f821-4a41-b07d-139e659712a8', email = 'ichizanum@gmail.com' WHERE id = '2de80900-157d-4e8f-bf0e-6754165b9c1c';

-- Re-enable FK constraints
SET session_replication_role = DEFAULT;

COMMIT;
