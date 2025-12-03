-- Clear all External Opportunities from the database
-- This will delete all opportunities created by scraping/upload systems
-- Use with caution - this cannot be undone!

-- Option 1: Delete ALL external opportunities
DELETE FROM "ExternalOpportunity";

-- Option 2: Delete only opportunities from scraping sources (uncomment to use instead)
-- DELETE FROM "ExternalOpportunity" 
-- WHERE source LIKE '%Scraping%' 
--    OR source LIKE '%Daily Upload%'
--    OR source LIKE '%OctoParse%'
--    OR source LIKE '%LinkedIn%';

-- Option 3: Delete only inactive opportunities (uncomment to use instead)
-- DELETE FROM "ExternalOpportunity" WHERE "isActive" = false;

-- Note: This will also cascade delete related records in:
-- - ExternalOpportunityApplication
-- - EarlyAccessUnlock
-- - OpportunityFeedback
-- - GeneratedCV (if linked)

-- Verify deletion
SELECT COUNT(*) as remaining_opportunities FROM "ExternalOpportunity";

