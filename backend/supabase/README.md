# Supabase — Quantum Fee Management

Apply migrations in order:

```bash
# via Supabase CLI
supabase db push

# or via SQL editor: run 001_*.sql .. 009_*.sql in order
```

Required env:

```env
# frontend
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon>

# backend (service role, never frontend)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service>
```

Storage buckets (create in Supabase dashboard → Storage):
- `student-photos` (public: false, RLS: authenticated can read/write own)
- `student-documents` (public: false)

If env vars are missing, the app falls back to the local fileStore (`backend/data/quantum-store.json`) so it still runs.
