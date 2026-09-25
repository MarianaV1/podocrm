import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// URL pública para armar enlaces absolutos (imagen al compartir). En Vercel se
// toma el dominio de producción del proyecto; se puede fijar con SITE_URL.
const siteUrl = process.env.SITE_URL
  ? process.env.SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

const descripcion =
  "Sistema de gestión para clínica de podología: pacientes, hojas clínicas, citas, cobros, comisiones y reportes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "CRM Podología", template: "%s · CRM Podología" },
  description: descripcion,
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "CRM Podología",
    title: "CRM Podología",
    description: descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM Podología",
    description: descripcion,
  },
};

// Fija el tema antes del primer paint para evitar el "flash" al recargar.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script de tema fija data-theme en <html>
    // antes de hidratar, así que ese atributo difiere del HTML del servidor
    // a propósito (solo aplica a los atributos de <html>, no a sus hijos).
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
