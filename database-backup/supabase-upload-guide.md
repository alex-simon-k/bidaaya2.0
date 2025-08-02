# Supabase Direct Upload Guide

## 🚀 Option B: Upload Your CSVs Directly to Supabase

If you prefer to upload directly to Supabase instead of using our restoration scripts:

### 1. **Access Supabase Dashboard**
```
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to "Table Editor"
```

### 2. **Upload User Data**
```
1. Click on "User" table
2. Click "Insert" → "Import data via CSV"
3. Upload: database-backup/csv-files/Supabase - User.csv
4. Map columns correctly:
   - id → id
   - name → name  
   - email → email
   - createdAt → created_at
   - role → role
   - etc.
```

### 3. **Upload Project Data**
```
1. Click on "Project" table
2. Import: Supabase - Project.csv
3. Map columns appropriately
```

### 4. **Upload Application Data**
```
1. Click on "Application" table  
2. Import: Supabase - Application.csv
3. Ensure foreign keys are preserved
```

### 5. **Data Validation**
```sql
-- Check user count
SELECT COUNT(*) FROM "User";

-- Check projects
SELECT COUNT(*) FROM "Project";

-- Check applications
SELECT COUNT(*) FROM "Application";
```

## ⚠️ **Important Notes:**

1. **Backup Current Data First**
   ```sql
   -- Export current data before importing
   ```

2. **Handle Date Formats**
   - Supabase expects ISO format: `2025-07-28T00:00:00Z`
   - Your CSV has: `7/28/2025 6:33:45`
   - May need manual conversion

3. **Foreign Key Constraints**
   - Upload Users first
   - Then Projects  
   - Finally Applications
   - Ensure IDs match between tables

## 🎯 **Recommendation: Use Option A**

The script method (Option A) is better because:
- ✅ Handles date conversion automatically
- ✅ Preserves relationships
- ✅ Validates data quality
- ✅ Provides error handling
- ✅ Already tested and working 