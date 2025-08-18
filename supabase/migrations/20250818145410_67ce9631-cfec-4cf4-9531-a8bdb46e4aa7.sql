
-- Add created_by column to jobs table to track which user created the job
ALTER TABLE jobs ADD COLUMN created_by uuid;

-- Add foreign key constraint linking created_by to user_profiles.user_id
ALTER TABLE jobs ADD CONSTRAINT jobs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(user_id);
