
-- Add foreign key relationship between jobs and user_profiles
ALTER TABLE jobs ADD CONSTRAINT jobs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(user_id);
