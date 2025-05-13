import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PhotoGallery from "../components/PhotoGallery";

export default function Gallery() {
  const [photoGroups, setPhotoGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPhotoGroups() {
      try {
        console.log("Fetching photo groups...");
        const response = await fetch("/api/photos");

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error("Failed to fetch photos");
        }

        const data = await response.json();
        console.log("Photo groups data:", data);
        setPhotoGroups(data);
      } catch (err) {
        console.error("Error fetching photos:", err);
        setError("Unable to load photos. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchPhotoGroups();
  }, []);

  return (
    <Layout title="Wedding Photo Gallery">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Our Wedding Photo Gallery
        </h1>
        <p className="text-center text-gray-600 mb-10">
          Browse through the wonderful moments captured by our guests
        </p>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading photos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <PhotoGallery photoGroups={photoGroups} />
        )}

        <div className="mt-10 text-center">
          <a
            href="/photos"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Share Your Photos
          </a>
        </div>
      </div>
    </Layout>
  );
}