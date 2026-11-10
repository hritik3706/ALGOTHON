# Supabase Authentication & Setup Guide

Algothon is configured with **Supabase Authentication** using `@supabase/supabase-js`. Follow these steps to connect your Supabase project.

---

## 1. Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose an organization, name it (e.g., `algothon`), and set a secure database password.
3. Wait ~1 minute for the project to finish provisioning.

---

## 2. Obtain Your API Credentials

1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon in sidebar) $\rightarrow$ **API**.
2. Find the **Project URL** and the **Project API keys** (`anon` public key).
3. In the root directory of your Algothon repository, create or update `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Restart the Vite development server (`npm run dev`) so the environment variables take effect.

---

## 3. Supported Authentication Providers

### A. Email & Password (Enabled by default)
- Users can sign up with email and password directly from the **Sign In** modal in the top nav or sidebar.
- *Tip for local development*: Under **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email**, you can toggle off **"Confirm email"** if you want instant logins without checking confirmation emails.

### B. GitHub OAuth (Optional)
1. In your GitHub account, go to **Settings** $\rightarrow$ **Developer settings** $\rightarrow$ **OAuth Apps** $\rightarrow$ **New OAuth App**.
2. Set **Homepage URL** to `http://localhost:5173` (or your production URL).
3. Set **Authorization callback URL** to:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and generate a **Client Secret**.
5. In Supabase, go to **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **GitHub**, paste the credentials, and toggle it on.

### C. Google OAuth (Optional)
1. In Google Cloud Console, configure an OAuth 2.0 Client ID.
2. Set the redirect URI to `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Paste the Client ID and Secret under **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Google** in Supabase.

---

## 4. Optional: Cloud Database Tables with Row-Level Security (RLS)

If you want to sync your DSA problems, attempts, and revisions to Supabase Postgres, run this SQL in your Supabase **SQL Editor**:

```sql
-- 1. Create Problems table
CREATE TABLE IF NOT EXISTS public.problems (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  link TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Attempts table
CREATE TABLE IF NOT EXISTS public.attempts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  problem_id TEXT REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  attempt_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('solved', 'hint', 'failed')),
  time_taken INT NOT NULL DEFAULT 0,
  mistake_tag TEXT NOT NULL,
  recall_quality INT NOT NULL CHECK (recall_quality >= 0 AND recall_quality <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Revisions table
CREATE TABLE IF NOT EXISTS public.revisions (
  problem_id TEXT PRIMARY KEY REFERENCES public.problems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  next_due_date DATE NOT NULL,
  interval_index INT NOT NULL DEFAULT 0,
  interval_days INT NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
  repetitions INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  leech_flag BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

-- 5. Policies: users can only view and modify their own records
CREATE POLICY "Users can manage their own problems"
  ON public.problems FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own attempts"
  ON public.attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own revisions"
  ON public.revisions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
