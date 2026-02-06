import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Extract the authenticated Supabase user from an API route request.
 * Returns null if the user is not authenticated.
 */
export async function getSupabaseUser(
  request: NextRequest,
): Promise<User | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // API routes don't need to set cookies for session refresh.
          // The middleware handles that on page requests.
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
