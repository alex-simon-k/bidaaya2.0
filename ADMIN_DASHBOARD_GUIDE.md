# 🛡️ Admin Dashboard Guide

## 📊 **Current Status: READY FOR USE**

The admin dashboard is **fully built and functional**. It just needs a user to be granted admin access.

## 🔗 **Access Information**

- **Dashboard URL**: `http://localhost:3000/admin/projects`
- **Required Role**: `ADMIN`
- **Current Admin Users**: None (need to set up)

## 🚀 **Quick Setup (3 Steps)**

### Step 1: Register Your Account
1. Go to: `http://localhost:3000/auth/login`
2. Click "Continue with Google" 
3. Complete email verification
4. Select your role (Student or Company)
5. Fill out your profile

### Step 2: Grant Yourself Admin Access
```bash
# Run this command with your email:
node scripts/setup-admin.js your.email@example.com
```

### Step 3: Access Admin Dashboard
Visit: `http://localhost:3000/admin/projects`

## 🎯 **Admin Dashboard Features**

### **Project Management**
- ✅ **View All Projects** - See projects from all companies
- ✅ **Approve/Reject Projects** - Approve projects to make them live
- ✅ **Add Admin Feedback** - Provide feedback when rejecting
- ✅ **Status Filtering** - Filter by Pending, Approved, Rejected

### **Company Information**
- ✅ **Company Details** - View company name, size, industry
- ✅ **Contact Information** - See contact person and email
- ✅ **Calendly Integration** - Direct links to company Calendly for interviews
- ✅ **Company Goals** - Understand what companies are looking for

### **Application Monitoring**
- ✅ **Application Count** - See how many students applied to each project
- ✅ **Real-time Updates** - Live application statistics
- ✅ **Student Interest Tracking** - Monitor project popularity

### **Admin Controls**
- ✅ **Bulk Actions** - Handle multiple projects efficiently
- ✅ **Admin Notes** - Add internal notes to projects
- ✅ **Approval Timestamps** - Track when projects were approved

## 📋 **Admin Workflow**

### **Typical Project Review Process:**
1. **Company Posts Project** → Status: `PENDING_APPROVAL`
2. **Admin Reviews Project** → Check details, requirements, company legitimacy
3. **Admin Decision:**
   - **✅ Approve** → Status: `LIVE` (students can apply)
   - **❌ Reject** → Status: `REJECTED` (with feedback to company)

### **What to Look For When Reviewing:**
- **Clear Project Description** - Well-defined roles and responsibilities
- **Appropriate Compensation** - Fair compensation or clear unpaid internship value
- **Legitimate Company** - Real company with valid website/LinkedIn
- **Professional Communication** - Proper grammar and professional tone
- **Realistic Requirements** - Skill requirements match internship level

## 🛠️ **Admin Utilities**

### **List All Users**
```bash
node scripts/list-users.js
```

### **Grant Admin Access to Another User**
```bash
node scripts/setup-admin.js other.user@example.com
```

### **Check Database Status**
```bash
npx prisma studio
```

## 🎯 **Admin Dashboard Screenshots**

### **Main Dashboard View**
- Project cards with company info
- Approve/Reject buttons
- Application statistics
- Status filters

### **Project Details Modal**
- Full project description
- Company contact information
- Skills required
- Compensation details
- Admin feedback section

## 🔐 **Security Features**

- **Role-Based Access** - Only users with `ADMIN` role can access
- **Audit Trail** - Track who approved/rejected what and when
- **Session Validation** - Proper authentication checks
- **Admin-Only APIs** - Backend APIs protected by admin role verification

## 📞 **Troubleshooting**

### **Can't Access Dashboard - "Access Denied"**
- Make sure your user role is set to `ADMIN`
- Run: `node scripts/list-users.js` to check your role
- If not admin, run: `node scripts/setup-admin.js your.email@example.com`

### **No Projects Showing**
- Projects only show after companies create them
- Create test projects by registering as a company
- Check project status filters (they might be filtered out)

### **Admin Scripts Not Working**
- Make sure you're in the project root directory
- Run: `npm install` to ensure dependencies are installed
- Check database connection with: `npx prisma studio`

## 🎉 **You're All Set!**

Once you complete the 3-step setup, you'll have full admin control over the platform including:
- ✅ Project approval workflow
- ✅ Company monitoring
- ✅ Application oversight  
- ✅ Platform quality control

**Next**: Register your account and grant yourself admin access! 🚀 