# Authentication Setup Guide

## Overview

This app uses Supabase Auth with email magic links (no passwords). Users receive a secure link via email to sign in.

## Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Supabase Configuration

### 1. Enable Email Auth

In Supabase Dashboard → Authentication → Providers:
- Enable "Email" provider
- Disable "Confirm email" (or keep enabled for production)
- Configure email templates (optional)

### 2. Configure Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add to **Redirect URLs**:
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 3. Email Templates (Optional)

Customize the magic link email template in:
Supabase Dashboard → Authentication → Email Templates → Magic Link

## File Structure

```
lib/
  ├── supabase-server.ts    # Server component client
  └── supabase-client.ts    # Client component client

actions/
  ├── auth.ts               # Login/logout actions
  └── account.ts            # User data actions

app/
  ├── login/
  │   └── page.tsx          # Login page
  ├── account/
  │   └── page.tsx          # Account/profile page
  └── auth/
      └── callback/
          └── route.ts      # Magic link callback handler

components/
  ├── login-form.tsx        # Login form (client)
  ├── sign-out-button.tsx   # Sign out button (client)
  └── auth-button.tsx       # Reusable auth button (client)

middleware.ts               # Session refresh
```

## Usage Examples

### Login Flow

1. User visits `/login`
2. Enters email address
3. Clicks "Send Magic Link"
4. Receives email with magic link
5. Clicks link → redirected to `/auth/callback?code=...`
6. Callback exchanges code for session
7. User redirected to `/account`

### Protected Pages

```typescript
// app/protected/page.tsx
import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <div>Protected content for {user.email}</div>;
}
```

### Client-Side Auth State

```typescript
'use client';

import { createClient } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return user ? <div>Hello {user.email}</div> : <div>Not logged in</div>;
}
```

### Server Actions

```typescript
import { sendMagicLink, signOut } from '@/actions/auth';

// Send magic link
const result = await sendMagicLink('user@example.com');
if (result.error) {
  console.error(result.error);
} else {
  console.log('Magic link sent!');
}

// Sign out
await signOut(); // Redirects to /
```

## Account Page Features

The `/account` page displays:

1. **User Info**
   - Email address
   - Sign out button

2. **Past Contests**
   - Contest name and dates
   - Movies selected (with salaries)
   - Total salary spent
   - Final score (if scored)
   - Rank (if scored)

3. **Stats Summary**
   - Total contests entered
   - Completed contests
   - Number of wins (rank #1)

## Testing

### Local Development

1. Start Supabase (if using local):
   ```bash
   supabase start
   ```

2. Run Next.js dev server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000/login`

4. Enter email → check terminal for magic link (local dev)
   - Supabase local dev prints magic link to console
   - In production, actual email is sent

### Test Magic Link Flow

1. Send magic link to your email
2. Click link in email
3. Should redirect to `/account`
4. Verify session persists on page reload
5. Click "Sign Out" → redirects to `/`
6. Visit `/account` → redirects to `/login`

## Notes

1. **Session Duration**: Default is 1 hour, configurable in Supabase Dashboard

2. **Refresh Tokens**: Middleware automatically refreshes expired sessions

3. **Security**:
   - Service role key bypasses RLS - never expose to client
   - Anon key is public, protected by RLS policies
   - Magic links expire after use or timeout

4. **Production**:
   - Enable email confirmation for new users
   - Configure custom email templates with branding
   - Set up custom SMTP server (optional)
   - Add rate limiting for magic link requests

5. **Email Provider**:
   - Supabase includes free email sending (limited)
   - For production, configure custom SMTP in Supabase Dashboard
   - Recommended: SendGrid, AWS SES, Resend

## Common Issues

**Magic link not working**:
- Check redirect URLs in Supabase Dashboard
- Verify callback route exists at `/app/auth/callback/route.ts`
- Check browser console for errors

**Session not persisting**:
- Ensure middleware is configured correctly
- Check cookie settings (httpOnly, secure, sameSite)
- Verify environment variables are set

**User redirected to login after sign in**:
- Check if `getUser()` is being called correctly
- Verify Supabase client is created properly
- Check for errors in server logs
