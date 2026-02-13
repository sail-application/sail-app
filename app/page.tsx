/**
 * app/page.tsx — Root page redirect.
 *
 * Redirects all visitors to /login. The middleware and dashboard layout
 * handle authenticated user routing — no need to check auth here.
 * This keeps the root page statically renderable at build time.
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}
