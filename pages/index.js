import Layout from "../components/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";

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
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link
              href="/gallery"
              className="group bg-white hover:bg-primary-light rounded-lg overflow-hidden shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/gallery-thumb.jpg"
                  alt="Photo gallery"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-2">
                  Photo Gallery
                </h3>
                <p className="text-gray-600">
                  Browse moments from our special day
                </p>
              </div>
            </Link>

            <Link
              href="/photos"
              className="group bg-white hover:bg-secondary-light rounded-lg overflow-hidden shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/upload-thumb.jpg"
                  alt="Upload photos"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-2">
                  Share Your Photos
                </h3>
                <p className="text-gray-600">Upload your favorite moments</p>
              </div>
            </Link>

            <Link
              href="/wedding-predictions"
              className="group bg-white hover:bg-accent-light rounded-lg overflow-hidden shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/cake-thumb.jpg"
                  alt="Wedding Predictions"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-2">
                  Wedding Predictions
                </h3>
                <p className="text-gray-600">
                  Predict what will happen at our wedding
                </p>
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
          <p className="text-lg text-gray-700 leading-relaxed">
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

      {/* Countdown Section - Updated with lighter colors */}
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
