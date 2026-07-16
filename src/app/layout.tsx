import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'OSA Dashboard — Document Tracking',
    template: '%s — OSA Dashboard',
  },
  description: 'Track document submissions across all OSA teams with a beautiful tree visualization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
