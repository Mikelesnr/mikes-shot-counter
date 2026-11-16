import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: "Mike's Shot Counter",
  description: 'Bar inventory management and shot tracking system',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

// Runs before first paint so there is no light/dark flash on load.
const themeScript = `try{if(localStorage.getItem('msc_theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-amber-500 selection:text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <AuthProvider user={session}>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
