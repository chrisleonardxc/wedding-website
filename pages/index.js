import Layout from "../components/Layout";
import Link from "next/link";
import { useEffect, useState } from 'react';

export default function Home() {
  const [days, setDays] = useState(15);
  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(42);
  const [seconds, setSeconds] = useState(17);

  // This would be replaced with actual countdown logic
  // using the real wedding date

  return (
    <Layout title="Sydney & Chris's Wedding">
      {/* Hero Section */}
      <div className="relative h-[70vh] bg-cover bg-center flex items-center justify-center" 
           style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="font-script text-5xl md:text-7xl text-white mb-4">
            Sydney & Chris
          </h1>
          <p className="text-xl md:text-2xl text-white font-light mb-6">
            We're getting married!
          </p>
          <p className="inline-block border-t border-b border-white py-3 px-6 text-white text-lg">
            September 15, 2023 • Sunset Beach Resort
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="py-16 bg-blush bg-opacity-30">
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
                <p className="text-gray-600">
                  Upload your favorite moments
                </p>
              </div>
            </Link>

            <Link
              href="/cake-voting"
              className="group bg-white hover:bg-accent-light rounded-lg overflow-hidden shadow-elegant transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src="/images/cake-thumb.jpg" 
                  alt="Cake voting" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-serif text-xl font-semibold text-gray-800 mb-2">
                  Cake Voting
                </h3>
                <p className="text-gray-600">
                  Vote for your favorite flavor
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="py-16 container mx-auto px-4">
        <h2 className="font-script text-4xl text-center text-primary mb-12">Our Story</h2>
        
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-elegant">
          <p className="text-lg text-gray-700 leading-relaxed">
            We met in 2018 during a hiking trip with mutual friends. After three
            years of adventures together, Chris proposed on the same mountain where
            we first met. Now we're excited to begin our greatest adventure yet -
            marriage!
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
      <div className="py-16 bg-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-script text-4xl mb-8">Countdown to Our Big Day</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-secondary-dark rounded-lg p-6">
              <div className="text-4xl font-bold">{days}</div>
              <div className="text-secondary-light">Days</div>
            </div>
            <div className="bg-secondary-dark rounded-lg p-6">
              <div className="text-4xl font-bold">{hours}</div>
              <div className="text-secondary-light">Hours</div>
            </div>
            <div className="bg-secondary-dark rounded-lg p-6">
              <div className="text-4xl font-bold">{minutes}</div>
              <div className="text-secondary-light">Minutes</div>
            </div>
            <div className="bg-secondary-dark rounded-lg p-6">
              <div className="text-4xl font-bold">{seconds}</div>
              <div className="text-secondary-light">Seconds</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}