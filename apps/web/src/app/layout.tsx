import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ubiquitous Language System',
  description: 'A system for managing and evolving ubiquitous language in DDD',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
