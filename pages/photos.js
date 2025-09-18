import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";

export default function Photos() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [heic2anyLoaded, setHeic2anyLoaded] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState({}); // Track already converted files
  const videoRefs = useRef({}); // Refs for video elements

  // Load heic2any library on component mount
  useEffect(() => {
    const loadHeic2any = async () => {
      try {
        await import("heic2any");
        setHeic2anyLoaded(true);
      } catch (error) {
        console.error("Failed to load heic2any library:", error);
        setHeic2anyLoaded(false);
      }
    };

    loadHeic2any();
  }, []);

  // Generate previews when selected files change
  useEffect(() => {
    // Clean up previous preview URLs to avoid memory leaks
    if (previews.length > 0) {
      previews.forEach((preview) => {
        if (!preview.isPlaceholder && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    }

    // Create new preview URLs with HEIC conversion
    const generatePreviews = async () => {
      const newPreviews = [];

      for (const file of selectedFiles) {
        try {
          // Generate a unique key for this file
          const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
          
          // Check if file is a video
          const isVideo = file.type.startsWith('video/') || 
                         /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(file.name);
          
          // Check if file is HEIC/HEIF
          const isHeic =
            file.name.toLowerCase().endsWith(".heic") ||
            file.name.toLowerCase().endsWith(".heif") ||
            file.type === "image/heic" ||
            file.type === "image/heif";

          // For videos, create preview directly
          if (isVideo) {
            newPreviews.push({
              file: file,
              url: URL.createObjectURL(file),
              isVideo: true
            });
          }
          // If this HEIC file was already converted, use the cached result
          else if (isHeic && heic2anyLoaded && convertedFiles[fileKey]) {
            newPreviews.push({
              file: file,
              convertedBlob: convertedFiles[fileKey].blob,
              url: URL.createObjectURL(convertedFiles[fileKey].blob),
              isLoading: false,
              isHeic: true,
            });
          } else if (isHeic && heic2anyLoaded) {
            try {
              // Dynamically import heic2any
              const heic2anyModule = await import("heic2any");
              const heic2any = heic2anyModule.default;

              // Show loading state for this preview
              newPreviews.push({
                file: file,
                url: null,
                isLoading: true,
                isHeic: true,
              });
              setPreviews([...newPreviews]);

              // Convert HEIC to JPEG for preview
              const jpegBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.8,
              });

              // Cache the converted blob
              setConvertedFiles(prev => ({
                ...prev,
                [fileKey]: { blob: jpegBlob }
              }));

              // Update the preview with the converted image
              const previewIndex = newPreviews.length - 1;
              newPreviews[previewIndex] = {
                file: file, // Keep original file for upload
                convertedBlob: jpegBlob, // Store converted blob for potential use
                url: URL.createObjectURL(jpegBlob),
                isLoading: false,
                isHeic: true,
              };
            } catch (error) {
              console.error("Error converting HEIC file for preview:", error);
              // Fallback to a placeholder image
              newPreviews.push({
                file: file,
                url: "/placeholder-image.jpg", // Add a placeholder to your public folder
                isPlaceholder: true,
                isHeic: true,
                error: true,
              });
            }
          } else {
            // For regular image files, create preview directly
            newPreviews.push({
              file: file,
              url: URL.createObjectURL(file),
              isHeic: isHeic,
            });
          }
        } catch (error) {
          console.error("Error creating preview:", error);
          // Add a generic error preview
          newPreviews.push({
            file: file,
            url: "/placeholder-image.jpg",
            isPlaceholder: true,
            error: true,
          });
        }
      }

      setPreviews(newPreviews);
    };

    if (selectedFiles.length > 0) {
      generatePreviews();
    } else {
      setPreviews([]);
    }

    // Clean up function to revoke object URLs when component unmounts
    return () => {
      previews.forEach((preview) => {
        if (!preview.isPlaceholder && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [selectedFiles, heic2anyLoaded, convertedFiles]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array
      const newFiles = Array.from(e.target.files);
      
      // Check file sizes
      const oversizedFiles = newFiles.filter(file => file.size > 95 * 1024 * 1024); // 95MB to be safe
      if (oversizedFiles.length > 0) {
        setMessage(`Some files exceed the 95MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        // Filter out oversized files
        const validFiles = newFiles.filter(file => file.size <= 95 * 1024 * 1024);
        
        // Limit total files to 10
        const updatedFiles = [...selectedFiles, ...validFiles].slice(0, 10);
        setSelectedFiles(updatedFiles);
      } else {
        // Limit total files to 10
        const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 10);
        setSelectedFiles(updatedFiles);
      }

      // Reset the file input so the same file can be selected again if needed
      e.target.value = null;
    }
  };

  const removeFile = (indexToRemove) => {
    const fileToRemove = selectedFiles[indexToRemove];
    if (fileToRemove) {
      // Generate the same unique key used for caching
      const fileKey = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
      
      // Clean up the preview URL if it exists
      if (previews[indexToRemove] && previews[indexToRemove].url && !previews[indexToRemove].isPlaceholder) {
        URL.revokeObjectURL(previews[indexToRemove].url);
      }
      
      // Remove from convertedFiles cache if it exists
      setConvertedFiles(prev => {
        const updated = {...prev};
        delete updated[fileKey];
        return updated;
      });
    }
    
    // Remove the file from selectedFiles
    setSelectedFiles(prevFiles => 
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    
    // Remove the preview
    setPreviews(prevPreviews => 
      prevPreviews.filter((_, index) => index !== indexToRemove)
    );
    
    // Show success message
    setMessage("File removed successfully");
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setMessage("Please select at least one photo or video to upload!");
      return;
    }

    if (selectedFiles.length > 10) {
      setMessage(
        "You can only upload up to 10 files at once. Please remove some files."
      );
      return;
    }

    setUploading(true);
    setProgress(10); // Start with 10% to show activity
    setMessage("");

    const formData = new FormData();

    // Add all selected files to the form data
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const preview = previews[i];

      if (preview && preview.isHeic && preview.convertedBlob) {
        // Create a new File object from the converted blob with a .jpg extension
        const convertedFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
        const convertedFile = new File(
          [preview.convertedBlob],
          convertedFileName,
          {
            type: "image/jpeg",
            lastModified: file.lastModified,
          }
        );
        formData.append("photos", convertedFile);
      } else {
        // Use original file for videos and non-HEIC images
        formData.append("photos", file);
      }
    }

    // Add other form fields
    formData.append("name", e.target.name.value);
    formData.append("caption", e.target.caption.value);

    try {
      setProgress(30); // Update progress

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(70); // Update progress

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload photos");
      }

      const result = await response.json();
      setProgress(100); // Complete progress

      // Clear form and show success message
      setSelectedFiles([]);
      setPreviews([]);
      e.target.reset();
      setMessage(
        `Success! ${result.count} ${
          result.count === 1 ? "file" : "files"
        } uploaded.`
      );
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      // Scroll to top to show the message
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Function to play/pause video previews
  const toggleVideoPlay = (index) => {
    const videoElement = videoRefs.current[index];
    if (!videoElement) return;
    
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  // Function to set video ref
  const setVideoRef = (element, index) => {
    if (element) {
      videoRefs.current[index] = element;
    }
  };

  return (
    <Layout title="Share Your Wedding Photos">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Share Your Wedding Photos & Videos
        </h1>

        {message && (
          <div
            className={`p-4 mb-6 rounded-md ${
              message.includes("Success") || message.includes("removed")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Your Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label
              htmlFor="caption"
              className="block text-sm font-medium text-gray-700"
            >
              Caption (Optional)
            </label>
            <input
              type="text"
              name="caption"
              id="caption"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Add a caption for your photos & videos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photos & Videos
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,video/*,.heic,.heif"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, HEIC, MP4, MOV up to 95MB (max 10 files)
                </p>
              </div>
            </div>
          </div>

          {/* Preview section */}
          {previews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selected Files ({previews.length}/10)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative border rounded-md overflow-hidden group"
                  >
                    {preview.isLoading ? (
                      <div className="h-32 flex items-center justify-center bg-gray-100">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : preview.isVideo ? (
                      <div className="h-32 relative">
                        <video
                          ref={(el) => setVideoRef(el, index)}
                          src={preview.url}
                          className="h-full w-full object-cover"
                          onClick={() => toggleVideoPlay(index)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                          <div className="bg-black bg-opacity-50 rounded-full p-2">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-6 w-6 text-white" 
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
                      <img
                        src={preview.url || "/placeholder-image.jpg"}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                    )}
                    {preview.isHeic &&
                      !preview.isLoading &&
                      !preview.error && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                          HEIC
                        </div>
                      )}
                    {preview.isVideo && (
                      <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded">
                        VIDEO
                      </div>
                    )}
                    {preview.error && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                        Error
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove file"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {preview.file.name}
                    </p>
                  </div>
                ))}
                {selectedFiles.length < 10 && (
                  <label
                    htmlFor="file-upload"
                    className="h-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400"
                  >
                    <div className="text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">Add more</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white ${
              selectedFiles.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}