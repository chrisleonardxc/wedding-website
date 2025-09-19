import { useState, useEffect } from "react";
import { getLikedPhotos } from "../lib/galleryUtils";
import Layout from "../components/Layout";
import PhotoGallery from "../components/PhotoGallery";

export default function Gallery() {
  const [photoGroups, setPhotoGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeStats, setLikeStats] = useState({ totalLikes: 0 });

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

  // Calculate like statistics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const likedPhotos = getLikedPhotos();
      const totalLikes = Object.keys(likedPhotos).length;
      setLikeStats({ totalLikes });
    }
  }, [photoGroups]);

  return (
    <Layout title="Wedding Photo & Video Gallery">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Our Wedding Photo & Video Gallery
        </h1>
        
        <div className="text-center mb-8">
          <a
            href="/photos"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg"
          >
            Share Your Photos & Videos
          </a>
        </div>

        <p className="text-center text-gray-600 mb-10">
          Browse through the wonderful moments captured by our guests
        </p>

        {!loading && !error && likeStats.totalLikes > 0 && (
          <div className="text-center mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              You've liked {likeStats.totalLikes} {likeStats.totalLikes === 1 ? 'photo' : 'photos'}
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading photos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <PhotoGallery photoGroups={photoGroups} />
        )}
      </div>
    </Layout>
  );
}