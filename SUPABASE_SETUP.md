# Supabase Setup Guide

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click **Start your project**
3. Sign up with GitHub, Google, or email
4. Verify your email (if using email signup)

## Step 2: Create New Project

1. Click **New Project** in dashboard
2. Fill in project details:
   - **Name**: `box-office-fantasy` (or any name)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
   - **Pricing Plan**: Free tier is fine for development
3. Click **Create new project**
4. Wait 2-3 minutes for provisioning

## Step 3: Get API Credentials

Once project is ready:

1. Go to **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. You'll see:

### Project URL
```
https://[your-project-ref].supabase.co
```
Copy this to `SUPABASE_URL`

### API Keys
You'll see two keys:

**anon/public key** (used for authenticated requests with RLS)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Copy this to `SUPABASE_ANON_KEY`

**service_role key** (bypasses RLS - admin operations only)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Copy this to `SUPABASE_SERVICE_ROLE_KEY`

## Step 4: Update .env.local

Edit `/home/derek/DFS_project/.env.local`:

```bash
SUPABASE_URL=https://yourprojectref.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

Note: All variables are server-only (no `NEXT_PUBLIC_` prefix) to prevent exposure in client JavaScript.

## Step 5: Configure Authentication

### Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Enable Email provider** to ON
4. Settings:
   - ✅ Enable email signup
   - ✅ Enable email confirmations (optional - can disable for dev)
   - Click **Save**

### Add Redirect URL
1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   ```
3. For production, also add:
   ```
   https://yourdomain.com/auth/callback
   ```
4. Click **Save**

### Site URL (Optional)
1. In same section, set **Site URL** to:
   ```
   http://localhost:3000
   ```
2. This is where users redirect after auth

## Step 6: Set Up Database Schema

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy contents of `/home/derek/DFS_project/schema.sql`
4. Paste into SQL editor
5. Click **Run** or press `Ctrl+Enter`
6. Verify tables created:
   - Go to **Table Editor**
   - Should see: contests, movies, lineups, entries, lineup_movies

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 7: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize **Magic Link** template:
   - Subject line
   - Email body
   - Add your branding
3. Click **Save**

## Step 8: Test Configuration

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/login`

3. Enter your email address

4. Check for magic link email

5. Click link → should redirect to `/account`

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the full key (they're very long)
- Make sure no extra spaces before/after
- Verify `.env.local` file is in project root

### Magic link not arriving
- Check spam folder
- Verify email provider is enabled
- Check Supabase logs: Authentication → Logs

### "Redirect URL not allowed" error
- Add `http://localhost:3000/auth/callback` to allowed URLs
- Make sure URL exactly matches (no trailing slash)

### Session not persisting
- Clear browser cookies
- Check middleware.ts is running
- Verify Supabase client is created correctly

## Production Checklist

Before deploying to production:

- [ ] Enable email confirmations
- [ ] Add production redirect URL
- [ ] Configure custom SMTP (optional, for better deliverability)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Rotate service_role key if exposed
- [ ] Set up database backups
- [ ] Configure rate limiting

## Quick Reference

```bash
# Supabase Dashboard URLs
Dashboard:  https://supabase.com/dashboard
Project:    https://supabase.com/dashboard/project/[ref]
API Keys:   https://supabase.com/dashboard/project/[ref]/settings/api
Auth:       https://supabase.com/dashboard/project/[ref]/auth/users
Database:   https://supabase.com/dashboard/project/[ref]/editor
SQL:        https://supabase.com/dashboard/project/[ref]/sql
```

## Free Tier Limits

Supabase free tier includes:
- 500MB database space
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users
- Unlimited API requests

Perfect for development and MVP!
