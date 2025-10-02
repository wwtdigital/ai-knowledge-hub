export const metadata = {
  title: 'AI Knowledge Hub',
  description: 'YouTube transcript knowledge base with Notion integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
