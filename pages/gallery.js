import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import PhotoGallery from "../components/PhotoGallery";
import { getLikedPhotos } from "../lib/galleryUtils";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

export default function Gallery() {
  const [photoGroups, setPhotoGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeStats, setLikeStats] = useState({ totalLikes: 0 });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalGroups: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const fetchPhotoGroups = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      console.log(`Fetching photo groups for page ${page}...`);
      const response = await fetch(`/api/photos?page=${page}&limit=${pagination.limit}`);

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to fetch photos");
      }

      const data = await response.json();
      console.log("Photo groups data:", data);
      
      if (append) {
        // Append new groups to existing ones
        setPhotoGroups(prev => [...prev, ...data.photoGroups]);
      } else {
        // Replace existing groups
        setPhotoGroups(data.photoGroups);
      }
      
      setPagination(data.pagination);
      
      // Check if we've reached the end
      if (!data.pagination.hasNextPage) {
        setHasReachedEnd(true);
      }
      
    } catch (err) {
      console.error("Error fetching photos:", err);
      setError("Unable to load photos. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch more photos for infinite scroll
  const fetchMorePhotos = async () => {
    if (pagination.hasNextPage && !hasReachedEnd) {
      await fetchPhotoGroups(pagination.currentPage + 1, true);
    }
  };

  // Use the infinite scroll hook
  const { isFetching } = useInfiniteScroll({
    fetchMore: fetchMorePhotos,
    hasNextPage: pagination.hasNextPage && !hasReachedEnd,
    threshold: 1000,
    throttleMs: 100
  });

  useEffect(() => {
    fetchPhotoGroups(1, false);
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

        {/* Pagination Info */}
        {!loading && !error && pagination.totalGroups > 0 && (
          <div className="text-center mb-6">
            <span className="text-sm text-gray-500">
              Showing {photoGroups.length} of {pagination.totalGroups} photo groups
            </span>
          </div>
        )}

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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading photos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <>
            <PhotoGallery photoGroups={photoGroups} />
            
            {/* Loading indicator for infinite scroll */}
            {isFetching && (
              <div className="text-center mt-8 py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading more photos...</p>
              </div>
            )}
            
            {/* End of content indicator */}
            {hasReachedEnd && photoGroups.length > 0 && (
              <div className="text-center mt-8 py-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-600">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  You've seen all {pagination.totalGroups} photo groups!
                </div>
              </div>
            )}
            
            {/* Back to top button when user has scrolled */}
            <BackToTopButton />
          </>
        )}
      </div>
    </Layout>
  );
}

// Back to top button component
function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-primary hover:bg-primary-dark text-white p-3 rounded-full shadow-lg transition-all duration-300 z-40"
          aria-label="Back to top"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </>
  );
}