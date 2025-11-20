-- Set your user account as ADMIN
-- Replace 'your.email@example.com' with your actual email address

-- First, check your current role
SELECT id, email, name, role 
FROM "User" 
WHERE email = 'your.email@example.com';

-- Update your role to ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your.email@example.com';

-- Verify the change
SELECT id, email, name, role 
FROM "User" 
WHERE email = 'your.email@example.com';

-- Optional: See all admin users
SELECT id, email, name, role, "createdAt"
FROM "User" 
WHERE role = 'ADMIN'
ORDER BY "createdAt" DESC;

