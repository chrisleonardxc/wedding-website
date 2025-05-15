import { useState, useEffect } from "react";

export default function PhotoGallery({ photoGroups }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPhotos, setGroupPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch all photos in a group when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      const fetchGroupPhotos = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/photos/${selectedGroup.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch group photos');
          }
          
          const photos = await response.json();
          console.log('Fetched group photos:', photos); // Debug log
          
          if (photos && photos.length > 0) {
            setGroupPhotos(photos);
            setCurrentPhotoIndex(0);
          } else {
            // If the API returns an empty array, use the selected group as fallback
            setGroupPhotos([{
              id: selectedGroup.id,
              url: selectedGroup.url,
              name: selectedGroup.name,
              caption: selectedGroup.caption,
              uploaded_at: selectedGroup.uploaded_at,
              is_video: selectedGroup.is_video || false
            }]);
            setCurrentPhotoIndex(0);
          }
        } catch (error) {
          console.error('Error fetching group photos:', error);
          // Fallback to just showing the selected photo
          setGroupPhotos([{
            id: selectedGroup.id,
            url: selectedGroup.url,
            name: selectedGroup.name,
            caption: selectedGroup.caption,
            uploaded_at: selectedGroup.uploaded_at,
            is_video: selectedGroup.is_video || false
          }]);
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

  const downloadCurrentPhoto = () => {
    if (groupPhotos.length === 0 || !groupPhotos[currentPhotoIndex]) return;
    
    const currentPhoto = groupPhotos[currentPhotoIndex];
    const photoUrl = currentPhoto.url;
    
    // Create a link element
    const link = document.createElement('a');
    link.href = photoUrl;
    
    // Set the download attribute with a filename
    // Use original filename if available, or create one based on caption/name
    const fileName = currentPhoto.originalname || 
                    `wedding-${currentPhoto.is_video ? 'video' : 'photo'}-${currentPhoto.name.replace(/\s+/g, '-')}-${currentPhotoIndex + 1}${currentPhoto.is_video ? '.mp4' : '.jpg'}`;
    link.download = fileName;
    
    // Append to the document
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photoGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition hover:scale-105"
            onClick={() => openModal(group)}
          >
            <div className="h-48 overflow-hidden relative">
              <img
                src={group.url}
                alt={group.caption || "Wedding photo"}
                className="w-full h-full object-cover"
              />
              {group.photoCount > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                  +{group.photoCount - 1} more
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-medium text-gray-800 truncate">
                {group.caption || "Wedding Moment"}
              </p>
              <p className="text-sm text-gray-500">By {group.name}</p>
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
                  {groupPhotos[currentPhotoIndex].is_video ? (
                    <video
                      src={groupPhotos[currentPhotoIndex].url}
                      className="w-full max-h-[70vh] object-contain"
                      controls
                      autoPlay
                      playsInline
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={groupPhotos[currentPhotoIndex].url}
                      alt={groupPhotos[currentPhotoIndex].caption || "Wedding photo"}
                      className="w-full max-h-[70vh] object-contain"
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
                  <h3 className="text-xl font-semibold">
                    {groupPhotos[currentPhotoIndex].caption || "Wedding Moment"}
                  </h3>
                  <p className="text-gray-600">Shared by {groupPhotos[currentPhotoIndex].name}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {new Date(groupPhotos[currentPhotoIndex].uploaded_at).toLocaleDateString()}
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
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          Photo
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Download button */}
                  <button
                    onClick={downloadCurrentPhoto}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
                    Download {groupPhotos[currentPhotoIndex].is_video ? "Video" : "Photo"}
                  </button>
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
    </div>
  );
}