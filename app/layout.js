import '../styles/globals.css';
import Toaster from '@/components/Toaster';

export const metadata = {
  title: 'JEY POWER GYM F.P. — Sistema Digital',
  description: 'Control de clientes, pagos y asistencias',
  themeColor: '#0b0f14',
  icons: {
    icon: '/logo.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased bg-black text-white">
        <Toaster />
        <div className="mx-auto max-w-7xl p-4">{children}</div>
      </body>
    </html>
  );
}
