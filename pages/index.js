import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function Home() {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Set wedding date - September 27, 2025
  const weddingDate = new Date("2025-09-27T16:00:00");

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = weddingDate - now;

      // If wedding date has passed, show zeros
      if (difference <= 0) {
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        return;
      }

      // Calculate time units
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setDays(d);
      setHours(h);
      setMinutes(m);
      setSeconds(s);
    };

    // Update immediately and then every second
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Sydney & Chris's Wedding">
      {/* Hero Section */}
      <div
        className="relative h-[70vh] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-secondary bg-opacity-60"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="font-script text-5xl md:text-7xl text-white mb-4">
            Sydney & Chris
          </h1>
          <p className="text-xl md:text-2xl text-white font-light mb-6">
            We're getting married!
          </p>
          <p className="inline-block border-t border-b border-white py-3 px-6 text-white text-lg">
            September 27, 2025 • The Barn at Valhalla, Chapel Hill NC
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="py-16 bg-primary-light bg-opacity-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link
              href="/gallery"
              className="group bg-white hover:bg-primary-light rounded-lg overflow-hidden shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden flex items-center justify-center bg-primary-light bg-opacity-10">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="256" 
                  height="200" 
                  viewBox="0 0 24 24"
                  className="transition-transform duration-500 group-hover:scale-110 fill-primary"
                >
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-semibold text-primary-dark mb-2">
                  Photo Gallery
                </h3>
                <p className="text-primary">
                  Browse moments from our special day
                </p>
              </div>
            </Link>

            <Link
              href="/photos"
              className="group bg-white hover:bg-secondary-light rounded-lg overflow-hidden shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden flex items-center justify-center bg-primary-light bg-opacity-10">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="256" 
                  height="200" 
                  viewBox="0 0 24 24"
                  className="transition-transform duration-500 group-hover:scale-110 fill-primary"
                >
                  <path d="M5 20h14v-2H5v2zm7-16-7 7h4v6h6v-6h4l-7-7z"/>
                </svg>
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-semibold text-primary-dark mb-2">
                  Share Your Photos
                </h3>
                <p className="text-primary">Upload your favorite moments</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="py-16 container mx-auto px-4">
        <h2 className="font-script text-4xl text-center text-primary mb-12">
          Our Story
        </h2>

        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-elegant">
          <p className="text-lg text-primary-dark leading-relaxed">
            We met in 2018 during a hiking trip with mutual friends. After three
            years of adventures together, Chris proposed on the same mountain
            where we first met. Now we're excited to begin our greatest
            adventure yet - marriage!
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg overflow-hidden shadow-md">
              <img
                src="/images/couple-1.jpg"
                alt="Sydney and Chris hiking"
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-md">
              <img
                src="/images/couple-2.jpg"
                alt="Sydney and Chris engagement"
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Section */}
      <div className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-script text-4xl mb-8">
            Countdown to Our Big Day
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-primary-light bg-opacity-40 rounded-lg p-6 shadow-elegant">
              <div className="text-4xl font-bold text-white">{days}</div>
              <div className="text-white">Days</div>
            </div>
            <div className="bg-primary-light bg-opacity-40 rounded-lg p-6 shadow-elegant">
              <div className="text-4xl font-bold text-white">{hours}</div>
              <div className="text-white">Hours</div>
            </div>
            <div className="bg-primary-light bg-opacity-40 rounded-lg p-6 shadow-elegant">
              <div className="text-4xl font-bold text-white">{minutes}</div>
              <div className="text-white">Minutes</div>
            </div>
            <div className="bg-primary-light bg-opacity-40 rounded-lg p-6 shadow-elegant">
              <div className="text-4xl font-bold text-white">{seconds}</div>
              <div className="text-white">Seconds</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}