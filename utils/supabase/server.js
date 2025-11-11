'use server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/*
 * createServerSupabase()
 * Use this helper in Server Components, Server Actions and Route Handlers.
 * It wires Next's cookies() into the Supabase client so Supabase can set/read secure cookies.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // return cookie list for createServerClient to read
        getAll: () => {
          return cookieStore.getAll().map((c) => {
            // Next's cookies() returns objects with name/value; convert to expected shape
            return { name: c.name, value: c.value };
          });
        },
        // when supabase wants to set cookies, it will call setAll
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach((c) => {
            // c shape: { name, value, options }
            // Next cookies().set accepts { name, value, expires, path, httpOnly, secure, sameSite }
            try {
              cookieStore.set({
                name: c.name,
                value: c.value,
                // map options if present
                httpOnly: c.options?.httpOnly,
                secure: c.options?.secure,
                sameSite: c.options?.sameSite,
                path: c.options?.path,
                // expires expects a Date or string
                expires: c.options?.expires ? new Date(c.options.expires) : undefined,
              });
            } catch (err) {
              // In middleware or certain runtime contexts set may not be allowed; ignore or log
              // console.warn('cookie set skipped', err);
            }
          });
        },
      },
    }
  );
}
