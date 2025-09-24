
import { syncLikesToServer } from "../lib/likeSync";
import { useState, useEffect } from "react";
import LazyMedia from "./LazyMedia"; // Updated import
import {
  isPhotoLiked,
  togglePhotoLike,
  toggleGroupLike,
  getLikedPhotos,
} from "../lib/galleryUtils";

// Add these new props to the component function
export default function PhotoGallery({ photoGroups, onGroupDeleted, onPhotoDeleted }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPhotos, setGroupPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load liked photos from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedLikes = localStorage.getItem("likedPhotos");
        setLikedPhotos(storedLikes ? JSON.parse(storedLikes) : {});
      } catch (error) {
        console.error("Error loading liked photos:", error);
        setLikedPhotos({});
      }
    }
  }, []);

  // Sync likes with server when component mounts or unmounts
  useEffect(() => {
    // Sync likes when component mounts
    syncLikesToServer();

    // Sync likes when component unmounts
    return () => {
      syncLikesToServer();
    };
  }, []);

  // Fetch all photos in a group when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      const fetchGroupPhotos = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/photos/${selectedGroup.id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch group photos");
          }

          const photos = await response.json();
          console.log("Fetched group photos:", photos); // Debug log

          if (photos && photos.length > 0) {
            setGroupPhotos(photos);
            setCurrentPhotoIndex(0);
          } else {
            // If the API returns an empty array, use the selected group as fallback
            setGroupPhotos([
              {
                id: selectedGroup.id,
                url: selectedGroup.url,
                name: selectedGroup.name,
                caption: selectedGroup.caption,
                uploaded_at: selectedGroup.uploaded_at,
                is_video: selectedGroup.is_video || false,
                likes_count: selectedGroup.total_likes || 0,
              },
            ]);
            setCurrentPhotoIndex(0);
          }
        } catch (error) {
          console.error("Error fetching group photos:", error);
          // Fallback to just showing the selected photo
          setGroupPhotos([
            {
              id: selectedGroup.id,
              url: selectedGroup.url,
              name: selectedGroup.name,
              caption: selectedGroup.caption,
              uploaded_at: selectedGroup.uploaded_at,
              is_video: selectedGroup.is_video || false,
              likes_count: selectedGroup.total_likes || 0,
            },
          ]);
        } finally {
          setLoading(false);
        }
      };

      fetchGroupPhotos();
    }
  }, [selectedGroup]);

  if (!photoGroups || photoGroups.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No photos have been uploaded yet.</p>
      </div>
    );
  }

  const openModal = (group) => {
    setSelectedGroup(group);
  };

  const closeModal = () => {
    setSelectedGroup(null);
    setGroupPhotos([]);
    setCurrentPhotoIndex(0);
  };

    // Add Password Prompt Modal Component
  const PasswordPromptModal = ({ item, type, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Admin Password Required</h3>
        <p className="text-gray-600 mb-4">
          Enter the admin password to delete this {type}.
          {type === 'group' && item.photoCount > 1 && (
            <span className="block mt-2 font-medium text-red-600">
              This will delete all {item.photoCount} photos in this group.
            </span>
          )}
        </p>
        
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(''); // Clear error when typing
            }}
            placeholder="Enter admin password"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onConfirm();
              }
            }}
            autoFocus
          />
          {passwordError && (
            <p className="text-red-600 text-sm mt-2">{passwordError}</p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={deleteLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            disabled={deleteLoading || !password.trim()}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );

  const goToNextPhoto = () => {
    if (currentPhotoIndex < groupPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else {
      // Loop back to the first photo
      setCurrentPhotoIndex(0);
    }
  };

  const goToPrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else {
      // Loop to the last photo
      setCurrentPhotoIndex(groupPhotos.length - 1);
    }
  };

  const downloadCurrentPhoto = async () => {
  if (groupPhotos.length === 0 || !groupPhotos[currentPhotoIndex]) return;

  const currentPhoto = groupPhotos[currentPhotoIndex];
  const photoUrl = currentPhoto.url;

  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isMobile) {
      // Fetch the image as a blob
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      
      if (isIOS) {
        // iOS-specific handling - prioritize Web Share API for "Save to Photos"
        if (navigator.share && navigator.canShare) {
          const fileName = currentPhoto.originalname || 
            `wedding-${currentPhoto.is_video ? "video" : "photo"}-${currentPhoto.name.replace(/\s+/g, "-")}-${currentPhotoIndex + 1}${currentPhoto.is_video ? ".mp4" : ".jpg"}`;
          
          const file = new File([blob], fileName, { type: blob.type });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Wedding Photo',
                text: currentPhoto.caption || 'Wedding moment'
              });
              return; // Success! Stop here - don't try other methods
            } catch (shareError) {
              if (shareError.name !== 'AbortError') {
                console.log('Share failed:', shareError);
                // Only continue to fallback if it wasn't just cancelled by user
                throw shareError;
              }
              // If user cancelled, just return without trying other methods
              return;
            }
          }
        }
        
        // iOS fallback: Open in new tab with instructions (no download attribute)
        // const newWindow = window.open(photoUrl, '_blank');
        // if (!newWindow) {
        //   alert('Please allow popups and try again, or long-press the image to save to Photos');
        // }
        
      } else {
        // Android and other mobile browsers - use download link
        const url = URL.createObjectURL(blob);
        const fileName = currentPhoto.originalname || 
          `wedding-${currentPhoto.is_video ? "video" : "photo"}-${currentPhoto.name.replace(/\s+/g, "-")}-${currentPhotoIndex + 1}${currentPhoto.is_video ? ".mp4" : ".jpg"}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } else {
      // Desktop behavior - standard download
      const fileName = currentPhoto.originalname || 
        `wedding-${currentPhoto.is_video ? "video" : "photo"}-${currentPhoto.name.replace(/\s+/g, "-")}-${currentPhotoIndex + 1}${currentPhoto.is_video ? ".mp4" : ".jpg"}`;
      
      const link = document.createElement("a");
      link.href = photoUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
  } catch (error) {
    console.error('Download failed:', error);
    
    // Ultimate fallback: open in new tab
    const newWindow = window.open(photoUrl, '_blank');
    if (!newWindow) {
      alert('Please allow popups and try again, or long-press the image to save to Photos');
    }
  }
};

  // Handle liking/unliking a photo
  const toggleLike = (photoId, event) => {
    event.stopPropagation();

    const newLikedPhotos = { ...likedPhotos };
    newLikedPhotos[photoId] = !newLikedPhotos[photoId];

    // Update state
    setLikedPhotos(newLikedPhotos);

    // Save to localStorage and queue for server sync
    togglePhotoLike(photoId, newLikedPhotos[photoId]);

    // Update the likes_count in the UI immediately for better UX
    if (groupPhotos.length > 0) {
      const updatedPhotos = groupPhotos.map((photo) => {
        if (photo.id === photoId) {
          return {
            ...photo,
            likes_count:
              (photo.likes_count || 0) + (newLikedPhotos[photoId] ? 1 : -1),
          };
        }
        return photo;
      });
      setGroupPhotos(updatedPhotos);
    }
  };

  // Handle liking/unliking a group of photos
  const toggleGroupLikes = (group, event) => {
    event.stopPropagation();

    // Get all photo IDs in the group
    const photoIds = group.photos
      ? group.photos.map((photo) => photo.id)
      : [group.id];

    // Check if any photo in the group is already liked
    const anyLiked = photoIds.some((id) => likedPhotos[id]);

    // Toggle all photos in the group
    const newLikedPhotos = { ...likedPhotos };

    photoIds.forEach((id) => {
      newLikedPhotos[id] = !anyLiked;
    });

    // Update state
    setLikedPhotos(newLikedPhotos);

    // Save to localStorage and queue for server sync
    toggleGroupLike(photoIds, !anyLiked);
  };

  // Check if a photo is liked
  const isLiked = (photoId) => {
    return !!likedPhotos[photoId];
  };

  const isGroupLiked = (group) => {
    // First check if the group itself is liked (for single photo groups)
    if (isLiked(group.id)) {
      return true;
    }

    // Then check if any photos in the group are liked
    if (group.photos && group.photos.length > 0) {
      return group.photos.some((photo) => isLiked(photo.id));
    }

    // Fallback: if no photos array but photoCount > 1, we need to fetch the group
    // For now, just check the main group ID
    return false;
  };

const deleteGroup = async (group) => {
  setDeleteLoading(true);
  try {
    const response = await fetch('/api/photos/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        groupId: group.id,
        password: password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        setPasswordError('Incorrect password. Please try again.');
        return;
      }
      throw new Error(errorData.error || 'Failed to delete group');
    }

    const result = await response.json();
    console.log('Group deleted:', result);

    // Close modal if it was open
    if (selectedGroup && selectedGroup.id === group.id) {
      closeModal();
    }

    // Notify parent component
    if (onGroupDeleted) {
      onGroupDeleted(group.id);
    }

    // Reset states
    setShowPasswordPrompt(null);
    setShowDeleteConfirm(null);
    setPassword('');
    setPasswordError('');
  } catch (error) {
    console.error('Error deleting group:', error);
    setPasswordError('Failed to delete group. Please try again.');
  } finally {
    setDeleteLoading(false);
  }
};

const deletePhoto = async (photoId) => {
  setDeleteLoading(true);
  try {
    const response = await fetch(`/api/photos/${selectedGroup.id}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        photoId,
        password: password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        setPasswordError('Incorrect password. Please try again.');
        return;
      }
      throw new Error(errorData.error || 'Failed to delete photo');
    }

    const result = await response.json();
    console.log('Photo deleted:', result);

    // Update local state
    const updatedPhotos = groupPhotos.filter(photo => photo.id !== photoId);
    setGroupPhotos(updatedPhotos);

    // Adjust current photo index if necessary
    if (currentPhotoIndex >= updatedPhotos.length) {
      setCurrentPhotoIndex(Math.max(0, updatedPhotos.length - 1));
    }

    // If group is now empty, close modal and notify parent
    if (result.groupEmpty) {
      closeModal();
      if (onGroupDeleted) {
        onGroupDeleted(selectedGroup.id);
      }
    } else if (onPhotoDeleted) {
      onPhotoDeleted(photoId, selectedGroup.id);
    }

    // Reset states
    setShowPasswordPrompt(null);
    setShowDeleteConfirm(null);
    setPassword('');
    setPasswordError('');
  } catch (error) {
    console.error('Error deleting photo:', error);
    setPasswordError('Failed to delete photo. Please try again.');
  } finally {
    setDeleteLoading(false);
  }
};

const DeleteConfirmModal = ({ item, type, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this {type}? This action cannot be undone.
        {type === 'group' && item.photoCount > 1 && (
          <span className="block mt-2 font-medium text-red-600">
            This will delete all {item.photoCount} photos in this group.
          </span>
        )}
      </p>
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={deleteLoading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          disabled={deleteLoading}
        >
          {deleteLoading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photoGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition hover:scale-105 relative group" // Added "group" class
          >
            {/* Add this delete button right after the opening div */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm({ type: 'group', item: group });
              }}
              className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              aria-label="Delete photo group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            
            <div
              className="h-48 overflow-hidden relative"
              onClick={() => openModal(group)}
            >
              {/* Handle video-only groups differently */}
              {group.isVideoOnly ? (
                <div className="w-full h-full relative">
                  <LazyMedia
                    src={group.url}
                    isVideo={true}
                    className="w-full h-full object-cover"
                    videoProps={{
                      muted: true,
                      playsInline: true,
                      preload: "metadata",
                      onMouseEnter: (e) => e.target.play(),
                      onMouseLeave: (e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }
                    }}
                  />
                  {/* Video overlay indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black bg-opacity-50 rounded-full p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <LazyMedia
                  src={group.url}
                  alt={group.caption || "Wedding photo"}
                  className="w-full h-full object-cover"
                  isVideo={false}
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              )}
              
              {/* Show media type indicators */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {group.photos && group.photos.some(photo => photo.is_video) && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">
                    VIDEO
                  </span>
                )}
                {group.photos && group.photos.some(photo => !photo.is_video) && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    PHOTO
                  </span>
                )}
              </div>
              
              {group.photoCount > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                  +{group.photoCount - 1} more
                </div>
              )}
            </div>
            <div className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 truncate">
                  {group.caption || "Wedding Moment"}
                </p>
                <p className="text-sm text-gray-500">By {group.name}</p>
              </div>

              <div className="flex items-center">
                {/* Like count display */}
                {group.total_likes > 0 && (
                  <span className="text-sm text-gray-500 mr-2">
                    {group.total_likes}
                  </span>
                )}

                {/* Like button for photo group */}
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all"
                  onClick={(e) => toggleGroupLikes(group, e)}
                  aria-label={
                    isGroupLiked(group)
                      ? "Unlike this photo group"
                      : "Like this photo group"
                  }
                  aria-pressed={isGroupLiked(group)}
                >
                  {isGroupLiked(group) ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedGroup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-lg overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="h-[70vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : groupPhotos.length > 0 ? (
              <>
                <div className="relative">
                  {/* Add this delete button for individual photos */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm({ 
                        type: 'photo', 
                        item: groupPhotos[currentPhotoIndex] 
                      });
                    }}
                    className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                    aria-label="Delete this photo"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>

                  {groupPhotos[currentPhotoIndex].is_video ? (
                    <LazyMedia
                      src={groupPhotos[currentPhotoIndex].url}
                      isVideo={true}
                      className="w-full max-h-[70vh] object-contain"
                      videoProps={{
                        controls: true,
                        autoPlay: true,
                        playsInline: true
                      }}
                    />
                  ) : (
                    <LazyMedia
                      src={groupPhotos[currentPhotoIndex].url}
                      alt={
                        groupPhotos[currentPhotoIndex].caption ||
                        "Wedding photo"
                      }
                      className="w-full max-h-[70vh] object-contain"
                      isVideo={false}
                    />
                  )}

                  {/* Navigation buttons */}
                  {groupPhotos.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPrevPhoto();
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextPhoto();
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Photo counter */}
                  {groupPhotos.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                      {currentPhotoIndex + 1} / {groupPhotos.length}
                    </div>
                  )}

                  {/* Like button for current photo - MADE LARGER AND MORE VISIBLE */}
                  <button
                    className="absolute bottom-4 right-4 p-3 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(groupPhotos[currentPhotoIndex].id, e);
                    }}
                  >
                    {isLiked(groupPhotos[currentPhotoIndex].id) ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    )}
                  </button>

                  <button
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                    onClick={closeModal}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">
                      {groupPhotos[currentPhotoIndex].caption ||
                        "Wedding Moment"}
                    </h3>

                    {/* Like status indicator */}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {isLiked(groupPhotos[currentPhotoIndex].id) ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Liked
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          Not liked
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Shared by {groupPhotos[currentPhotoIndex].name}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {new Date(
                      groupPhotos[currentPhotoIndex].uploaded_at
                    ).toLocaleDateString()}
                  </p>

                  {/* Media type indicator */}
                  <div className="mt-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {groupPhotos[currentPhotoIndex].is_video ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          Video
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Photo
                        </>
                      )}
                    </span>
                  </div>

                  {/* Download button */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={downloadCurrentPhoto}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      { /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
  ? `Save ${groupPhotos[currentPhotoIndex].is_video ? "Video" : "Photo"}` 
  : `Download ${groupPhotos[currentPhotoIndex].is_video ? "Video" : "Photo"}`
}
                    </button>

                    {/* Like button as a regular button too */}
                    <button
                      onClick={(e) =>
                        toggleLike(groupPhotos[currentPhotoIndex].id, e)
                      }
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                        isLiked(groupPhotos[currentPhotoIndex].id)
                          ? "text-white bg-red-500 hover:bg-red-600"
                          : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {isLiked(groupPhotos[currentPhotoIndex].id)
                        ? "Unlike"
                        : "Like"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[70vh] flex items-center justify-center">
                <p className="text-gray-500">No media found in this group.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          item={showDeleteConfirm.item}
          type={showDeleteConfirm.type}
          onConfirm={() => {
            setShowDeleteConfirm(null);
            setShowPasswordPrompt(showDeleteConfirm);
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <PasswordPromptModal
          item={showPasswordPrompt.item}
          type={showPasswordPrompt.type}
          onConfirm={() => {
            if (showPasswordPrompt.type === 'group') {
              deleteGroup(showPasswordPrompt.item);
            } else {
              deletePhoto(showPasswordPrompt.item.id);
            }
          }}
          onCancel={() => {
            setShowPasswordPrompt(null);
            setPassword('');
            setPasswordError('');
          }}
        />
      )}
    </div>
  );
}
