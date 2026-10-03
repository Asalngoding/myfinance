import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MyFinance",
  description: "Aplikasi Catatan Keuangan Bulanan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
