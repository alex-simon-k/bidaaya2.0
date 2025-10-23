-- ========================================
-- DELETE USER COMPLETELY
-- ========================================
-- This script DELETES the entire user record.
-- All related data (CV, chat, applications, etc.) will be deleted automatically via CASCADE.
-- 
-- USAGE:
-- 1. Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- 2. Run this in Supabase SQL Editor
-- 3. User will be completely removed - they can sign up again as a fresh user
--
-- ⚠️  WARNING: This is PERMANENT deletion!
-- ========================================

-- 🎯 REPLACE THIS WITH YOUR USER ID
DELETE FROM "User" WHERE id = 'YOUR_USER_ID_HERE';

-- That's it! Cascade rules delete everything else automatically:
-- ✅ All CV data (education, experience, projects, skills, etc.)
-- ✅ All chat history (conversations, messages)
-- ✅ All applications (internal and external)
-- ✅ All sessions
-- ✅ All analytics data
-- ✅ Everything linked to this user

-- Verify deletion (should return 0 rows)
SELECT COUNT(*) as remaining_users FROM "User" WHERE id = 'YOUR_USER_ID_HERE';

