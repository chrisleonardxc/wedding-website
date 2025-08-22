import Link from "next/link";
import Head from "next/head";

export default function Layout({ children, title = "Wedding Website" }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sydney and Chris's wedding website" />
        {/* Font links moved to _document.js */}
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
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-primary py-8 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="font-script text-2xl mb-4">Sydney & Chris</p>
          <p className="mb-2">
            September 27, 2025 • The Barn at Valhalla, Chapel Hill NC
          </p>
          <p>© {new Date().getFullYear()} - Chris Leonard Software</p>
        </div>
      </footer>
    </div>
  );
}