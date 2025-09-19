// Helper functions for the photo gallery

import { queueLike, queueUnlike } from './likeSync';

/**
 * Sort photos by date (newest first)
 * @param {Array} photos - Array of photo objects
 * @returns {Array} Sorted array of photos
 */
export function sortPhotosByDate(photos) {
  if (!Array.isArray(photos)) return [];
  
  return photos.sort((a, b) => {
    const dateA = new Date(a.uploaded_at || 0);
    const dateB = new Date(b.uploaded_at || 0);
    return dateB - dateA; // Newest first
  });
}

/**
 * Group photos by upload group
 * @param {Array} photos - Array of individual photo objects
 * @returns {Array} Array of photo group objects
 */
export function groupPhotosByUploadGroup(photos) {
  if (!Array.isArray(photos)) return [];
  
  const groups = {};
  
  // Group photos by upload_group
  photos.forEach(photo => {
    const groupId = photo.upload_group || 'ungrouped';
    
    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        name: photo.name,
        caption: photo.caption,
        uploaded_at: photo.uploaded_at,
        photos: [],
        photoCount: 0
      };
    }
    
    groups[groupId].photos.push(photo);
    groups[groupId].photoCount++;
    
    // Update the group timestamp to the newest photo if applicable
    const photoDate = new Date(photo.uploaded_at || 0);
    const groupDate = new Date(groups[groupId].uploaded_at || 0);
    
    if (photoDate > groupDate) {
      groups[groupId].uploaded_at = photo.uploaded_at;
    }
  });
  
  // Convert to array and set preview properties
  return Object.values(groups).map(group => {
    // Find the first photo (not video) for preview, fallback to first item
    const previewItem = group.photos.find(photo => !photo.is_video) || group.photos[0];
    
    return {
      ...group,
      url: previewItem.url,
      is_video: previewItem.is_video,
      // Use the preview item's properties for the group
      originalname: previewItem.originalname,
      filename: previewItem.filename,
      // Add a flag to indicate if this group contains only videos
      isVideoOnly: group.photos.every(photo => photo.is_video)
    };
  }).sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
}

/**
 * Filter photos by photographer name
 * @param {Array} photos - Array of photo objects
 * @param {string} name - Name to filter by
 * @returns {Array} Filtered array of photos
 */
export function filterPhotosByName(photos, name) {
  if (!Array.isArray(photos) || !name) return photos;
  
  const searchTerm = name.toLowerCase();
  return photos.filter(photo => 
    photo.name && photo.name.toLowerCase().includes(searchTerm)
  );
}

/**
 * Filter photos by caption text
 * @param {Array} photos - Array of photo objects
 * @param {string} caption - Caption text to filter by
 * @returns {Array} Filtered array of photos
 */
export function filterPhotosByCaption(photos, caption) {
  if (!Array.isArray(photos) || !caption) return photos;
  
  const searchTerm = caption.toLowerCase();
  return photos.filter(photo => 
    photo.caption && photo.caption.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get photo statistics
 * @param {Array} photos - Array of photo objects
 * @returns {Object} Statistics object
 */
export function getPhotoStats(photos) {
  if (!Array.isArray(photos)) return { totalPhotos: 0, uniquePhotographers: 0 };
  
  const uniquePhotographers = new Set(
    photos.map(photo => photo.name).filter(Boolean)
  );
  
  return {
    totalPhotos: photos.length,
    uniquePhotographers: uniquePhotographers.size
  };
}

/**
 * Get liked photo IDs from localStorage
 * @returns {Object} Object with photo IDs as keys and boolean values
 */
export function getLikedPhotos() {
  if (typeof window === 'undefined') return {};
  
  try {
    const likedPhotos = localStorage.getItem('likedPhotos');
    return likedPhotos ? JSON.parse(likedPhotos) : {};
  } catch (error) {
    console.error('Error getting liked photos from localStorage:', error);
    return {};
  }
}

/**
 * Toggle photo like status
 * @param {string} photoId - ID of the photo to toggle
 * @param {boolean} liked - Whether the photo should be liked
 */
export function togglePhotoLike(photoId, liked) {
  if (typeof window === 'undefined') return;
  
  try {
    const likedPhotos = getLikedPhotos();
    
    if (liked) {
      likedPhotos[photoId] = true;
      // Queue for server sync
      queueLike(photoId);
    } else {
      delete likedPhotos[photoId];
      // Queue for server sync
      queueUnlike(photoId);
    }
    
    localStorage.setItem('likedPhotos', JSON.stringify(likedPhotos));
  } catch (error) {
    console.error('Error saving liked photo to localStorage:', error);
  }
}

/**
 * Check if a photo is liked
 * @param {string} photoId - ID of the photo to check
 * @returns {boolean} Whether the photo is liked
 */
export function isPhotoLiked(photoId) {
  const likedPhotos = getLikedPhotos();
  return !!likedPhotos[photoId];
}

/**
 * Toggle like status for a group of photos
 * @param {Array} photoIds - Array of photo IDs to toggle
 * @param {boolean} liked - Whether the photos should be liked
 */
export function toggleGroupLike(photoIds, liked) {
  if (!Array.isArray(photoIds) || typeof window === 'undefined') return;
  
  try {
    const likedPhotos = getLikedPhotos();
    
    photoIds.forEach(id => {
      if (liked) {
        likedPhotos[id] = true;
        // Queue for server sync
        queueLike(id);
      } else {
        delete likedPhotos[id];
        // Queue for server sync
        queueUnlike(id);
      }
    });
    
    localStorage.setItem('likedPhotos', JSON.stringify(likedPhotos));
  } catch (error) {
    console.error('Error toggling group likes in localStorage:', error);
  }
}

/**
 * Calculate pagination metadata
 * @param {number} currentPage - Current page number
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination metadata
 */
export function calculatePagination(currentPage, totalItems, itemsPerPage) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems)
  };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if user has scrolled near the bottom of the page
 * @param {number} threshold - Distance from bottom in pixels (default: 1000)
 * @returns {boolean} Whether user is near bottom
 */
export function isNearBottom(threshold = 1000) {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
  
  return distanceFromBottom < threshold;
}

/**
 * Smooth scroll to top of page
 */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
