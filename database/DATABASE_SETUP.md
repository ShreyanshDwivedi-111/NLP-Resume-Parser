# 🚀 Database Integration Setup Guide

## Step 1: Setup Supabase Database

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy the entire SQL from `database/schema.sql`
3. Paste and **Run** the SQL to create tables
4. Verify tables created: `resumes`, `job_searches`, `match_results`

## Step 2: Get Supabase Service Key

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Find **Service Role Key** (secret - starts with `eyJ...`)
3. Copy this key ⚠️ **NEVER share or commit this key!**

## Step 3: Update Backend Environment

1. Create `backend/.env` file (if it doesn't exist)
2. Add these variables:
```env
SUPABASE_URL=https://wodzmprdbfhyvlkpdusf.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

## Step 4: Deploy Backend to Render

1. Go to Render Dashboard → Your service (resumeparser-1u43)
2. Go to **Environment** tab
3. Add new environment variable:
   - Key: `SUPABASE_SERVICE_KEY`
   - Value: (paste your service role key)
4. Click **Save Changes**
5. Backend will auto-redeploy with database support

## Step 5: Test the New Endpoints

Once backend is deployed, test these endpoints:

### Test with Postman/Thunder Client:

**1. Match and Save (with authentication)**
```
POST https://resumeparser-1u43.onrender.com/api/match-and-save
Headers:
  Authorization: Bearer <user_id_from_supabase>
Body (form-data):
  job_input: {"description": "Looking for Python developer..."}
  files: [upload resume files]
```

**2. Get Saved Resumes**
```
GET https://resumeparser-1u43.onrender.com/api/resumes
Headers:
  Authorization: Bearer <user_id>
```

**3. Get Dashboard Stats**
```
GET https://resumeparser-1u43.onrender.com/api/dashboard/stats
Headers:
  Authorization: Bearer <user_id>
```

## Step 6: Frontend Updates (Next)

After backend is working, I'll create:
- New dashboard with tabs
- Resume library view
- Match history view
- Analytics dashboard

## Security Notes

✅ **Row Level Security (RLS)** is enabled on all tables
✅ Users can only see their own data
✅ Service key is only on backend (never exposed to frontend)
✅ Frontend uses Supabase client with anon key (safe)

## Troubleshooting

**Error: "SUPABASE_URL must be set"**
- Make sure .env file exists in backend folder
- Check environment variables in Render

**Error: "Row Level Security"**
- Make sure RLS policies are created (in schema.sql)
- Check user_id is correct

**Error: "Table doesn't exist"**
- Run the schema.sql in Supabase SQL Editor first

---

## What's Next?

After you:
1. Run the SQL in Supabase ✅
2. Add SUPABASE_SERVICE_KEY to Render ✅
3. Test the endpoints ✅

I'll build the frontend dashboard with all the views! 🎨
