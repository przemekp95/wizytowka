// app/page.tsx — REDIRECT TO DEFAULT LOCALE
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/pl');
}
