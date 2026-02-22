import { createBrowserClient } from '@supabase/ssr';

// During SSR / build-time prerender there is no browser context and no env vars.
// All actual Supabase calls live inside useEffect or event handlers, so returning
// null here is safe — it is never dereferenced on the server.
export function createClient() {
  if (typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
