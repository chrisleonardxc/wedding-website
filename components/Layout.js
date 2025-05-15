import Head from "next/head";
import Link from "next/link";

export default function Layout({ children, title = "Wedding Website" }) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sydney and Chris's wedding website" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <header className="bg-primary shadow-elegant">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Link
              href="/"
              className="font-script text-3xl text-white mb-4 md:mb-0"
            >
              Sydney & Chris
            </Link>
            <div className="space-x-2 md:space-x-6 flex flex-wrap justify-center">
              <Link
                href="/"
                className="text-white hover:text-primary-light transition duration-300 px-3 py-2"
              >
                Home
              </Link>
              <Link
                href="/gallery"
                className="text-white hover:text-primary-light transition duration-300 px-3 py-2"
              >
                Gallery
              </Link>
              <Link
                href="/photos"
                className="text-white hover:text-primary-light transition duration-300 px-3 py-2"
              >
                Upload Photos
              </Link>
              <Link
                href="/wedding-predictions"
                className="text-white hover:text-primary-light transition duration-300 px-3 py-2"
              >
                Predictions
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-primary py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="font-script text-2xl mb-4">Sydney & Chris</p>
          <p className="mb-2">September 15, 2023 • Sunset Beach Resort</p>
          <p>© {new Date().getFullYear()} - Our Wedding Website</p>
        </div>
      </footer>
    </div>
  );
}