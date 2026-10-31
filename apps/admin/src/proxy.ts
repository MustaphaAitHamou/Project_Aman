import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rafraîchit la session Supabase à chaque requête et renvoie vers /login sans session.
 * Le contrôle du rôle (modérateur) est refait côté serveur dans chaque page et action.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = request.nextUrl.pathname.startsWith('/login');
  if (!url || !anonKey) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL('/login', request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLogin) return NextResponse.redirect(new URL('/login', request.url));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|maplibre).*)'],
};
