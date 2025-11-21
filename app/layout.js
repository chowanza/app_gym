import '../styles/globals.css';
import Toaster from '@/components/Toaster';

export const metadata = {
  title: 'JEY POWER GYM F.P. — Sistema Digital',
  description: 'Control de clientes, pagos y asistencias',
  icons: {
    icon: '/logo.jpg',
  },
};

export const viewport = {
  themeColor: '#0b0f14',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased text-zinc-900">
        <Toaster />
        <div className="mx-auto max-w-7xl p-4">{children}</div>
      </body>
    </html>
  );
}
