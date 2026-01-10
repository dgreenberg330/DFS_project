# Deployment Guide

This guide covers deploying Box Office Fantasy to Vercel and important considerations for production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Deployment Steps](#vercel-deployment-steps)
3. [Environment Variables](#environment-variables)
4. [Supabase Configuration](#supabase-configuration)
5. [Post-Deployment Testing](#post-deployment-testing)
6. [Common Issues & Fixes](#common-issues--fixes)
7. [Future Deployments](#future-deployments)
8. [Security Considerations](#security-considerations)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] A GitHub account with your code pushed
- [ ] A Supabase project set up with database tables
- [ ] Admin user added to `admin_users` table
- [ ] Local build works (`npm run build` succeeds)

---

## Vercel Deployment Steps

### Step 1: Prepare Your Code

Make sure all changes are committed and pushed:

```bash
git add .
git commit -m "Prepare for deployment"
git push
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

### Step 3: Import Your Project

1. On Vercel dashboard, click "Add New..." → "Project"
2. Find `DFS_project` in your repository list
3. Click "Import"

### Step 4: Configure Environment Variables

**CRITICAL STEP** - Before clicking Deploy, expand "Environment Variables" and add:

| Name | Value | Description |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Secret service role key (never expose!) |

**Where to find these values:**

1. Go to [supabase.com](https://supabase.com) → Your project
2. Click "Project Settings" (gear icon in sidebar)
3. Click "API" in the left menu
4. Copy values from there

### Step 5: Configure Build Settings

Vercel auto-detects Next.js. Verify these settings:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Step 6: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. If successful, you'll get a URL like `your-project.vercel.app`

---

## Environment Variables

### Required Variables

| Variable | Public? | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | **NO** | Admin key - server-side only |

### Security Notes

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - never expose it
- Never commit `.env.local` to git (already in `.gitignore`)

---

## Supabase Configuration

After deploying to Vercel, update Supabase to recognize your production domain:

### Step 1: Update Site URL

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to: `https://your-project.vercel.app`

### Step 2: Add Redirect URLs

Add these to **Redirect URLs**:

```
https://your-project.vercel.app/auth/callback
```

If using a custom domain later, add that too:

```
https://yourdomain.com/auth/callback
```

### Step 3: Verify Email Templates (Optional)

1. Go to Authentication → Email Templates
2. Update the "Confirm signup" template if needed
3. The magic link will use your Site URL automatically

---

## Post-Deployment Testing

Run through this checklist after deploying:

### Authentication
- [ ] Visit your Vercel URL
- [ ] Click "Sign In"
- [ ] Enter your email
- [ ] Check email for magic link
- [ ] Click link and verify redirect works
- [ ] Verify you land on account page

### User Features
- [ ] View current contest
- [ ] Create/edit a lineup
- [ ] Submit lineup successfully
- [ ] View "My Lineup" page
- [ ] Check account page shows your entries

### Admin Features
- [ ] Access `/admin` page
- [ ] Create a new contest
- [ ] Add movies to contest
- [ ] Lock a contest
- [ ] Enter actual grosses
- [ ] Score a contest

---

## Common Issues & Fixes

| Problem | Cause | Solution |
|---------|-------|----------|
| Magic links don't work | Supabase redirect URLs not configured | Add your Vercel URL to Supabase → Auth → URL Configuration |
| "Missing Supabase admin credentials" | Missing env variable | Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel |
| Page loads but no data | Wrong Supabase URL | Check `NEXT_PUBLIC_SUPABASE_URL` is correct |
| Admin pages show "Unauthorized" | User not in admin_users table | Add your user_id to `admin_users` table in Supabase |
| Build fails on Vercel | TypeScript or dependency error | Run `npm run build` locally to see detailed errors |
| "Invalid login credentials" | Using wrong Supabase keys | Verify you're using keys from the correct Supabase project |
| Styles look broken | CSS not loading | Clear browser cache, hard refresh (Ctrl+Shift+R) |

### Debugging Tips

1. **Check Vercel Logs:**
   - Dashboard → Your Project → Deployments
   - Click latest deployment → "Functions" tab

2. **Check Supabase Logs:**
   - Supabase Dashboard → Logs
   - Look at Edge Functions and Postgres logs

3. **Check Browser Console:**
   - Right-click → Inspect → Console tab
   - Look for red error messages

---

## Future Deployments

After initial setup, deploying updates is automatic:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```

Vercel automatically:
1. Detects the push to `master`
2. Builds your project
3. Deploys if build succeeds
4. Keeps old version if build fails

### Preview Deployments

When you push to a branch other than `master`, Vercel creates a preview URL:
- Useful for testing changes before merging
- Each pull request gets its own preview

### Rolling Back

If a deployment breaks something:
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"

---

## Security Considerations

### Before Each Deployment

**DO:**
- Run `npm run build` locally first
- Test authentication flow
- Verify all env variables are set
- Review any new user-facing features for data exposure

**DON'T:**
- Commit `.env.local` to git
- Share `SUPABASE_SERVICE_ROLE_KEY`
- Deploy with console.log debugging in production
- Expose user emails in public pages

### Production Checklist

```
[ ] All environment variables set in Vercel
[ ] Supabase Site URL updated to production domain
[ ] Supabase Redirect URLs include production domain
[ ] Magic link authentication tested on production
[ ] Admin user exists in admin_users table
[ ] RLS (Row Level Security) enabled on all tables
[ ] No sensitive data exposed in API responses
```

### Data Privacy

- User emails are never exposed publicly
- Leaderboards show usernames only
- RLS policies restrict data access per user
- Service role key only used server-side for admin operations

---

## Monitoring & Maintenance

### Regular Checks

**Weekly:**
- Check Vercel deployment logs for errors
- Monitor Supabase usage dashboard
- Review any user-reported issues

**Before Each Contest:**
- Verify contest creation works
- Test lineup submission flow
- Confirm lock/score workflow

### Supabase Free Tier Limits

Be aware of Supabase free tier limits:
- 500MB database size
- 2GB bandwidth per month
- 50MB file storage

Monitor usage at: Supabase Dashboard → Settings → Billing

### Vercel Free Tier Limits

Vercel Hobby plan includes:
- 100GB bandwidth per month
- Serverless function execution limits
- 1 concurrent build

Monitor usage at: Vercel Dashboard → Settings → Billing

---

## Custom Domain (Optional)

To use a custom domain like `boxofficefantasy.com`:

### Step 1: Add Domain in Vercel
1. Vercel Dashboard → Your Project → Settings → Domains
2. Enter your domain name
3. Follow DNS configuration instructions

### Step 2: Update Supabase
1. Add new redirect URL: `https://yourdomain.com/auth/callback`
2. Update Site URL to your custom domain

### Step 3: Wait for DNS
- DNS propagation can take up to 48 hours
- Vercel will show "Valid Configuration" when ready

---

## Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
