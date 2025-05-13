import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function Photos() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [heic2anyLoaded, setHeic2anyLoaded] = useState(false);

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
          // Check if file is HEIC/HEIF
          const isHeic =
            file.name.toLowerCase().endsWith(".heic") ||
            file.name.toLowerCase().endsWith(".heif") ||
            file.type === "image/heic" ||
            file.type === "image/heif";

          if (isHeic && heic2anyLoaded) {
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
            // For non-HEIC files or if heic2any isn't loaded, create preview directly
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
  }, [selectedFiles, heic2anyLoaded]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array and append to existing files
      const newFiles = Array.from(e.target.files);

      // Limit total files to 10
      const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 10);
      setSelectedFiles(updatedFiles);

      // Reset the file input so the same file can be selected again if needed
      e.target.value = null;
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setMessage("Please select at least one photo to upload!");
      return;
    }

    if (selectedFiles.length > 10) {
      setMessage(
        "You can only upload up to 10 photos at once. Please remove some photos."
      );
      return;
    }

    setUploading(true);
    setProgress(10); // Start with 10% to show activity
    setMessage("");

    const formData = new FormData();

    // Add all selected files to the form data
    // For HEIC files that were converted client-side, use the converted blob if available
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
        // Use original file for non-HEIC files or if conversion failed
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

      if (response.ok) {
        const result = await response.json();
        setMessage(
          `Successfully uploaded ${result.count} photo${
            result.count !== 1 ? "s" : ""
          }!`
        );
        e.target.reset();
        setSelectedFiles([]);
      } else {
        const error = await response.json();
        setMessage(`Failed to upload photos: ${error.error}`);
      }
    } catch (error) {
      setMessage("Error uploading photos: " + error.message);
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  return (
    <Layout title="Share Your Photos">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Share Your Wedding Memories
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Add Photos (up to 10)
            </label>
            <div className="flex items-center space-x-2">
              <label
                htmlFor="photos"
                className="cursor-pointer px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
              >
                Choose Files
              </label>
              <span className="text-sm text-gray-500">
                {selectedFiles.length} of 10 photos selected
              </span>
            </div>
            <input
              type="file"
              id="photos"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF, HEIC (iPhone photos)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Selected Photos:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="h-32 bg-gray-100 rounded overflow-hidden">
                      {preview.isLoading ? (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          <span className="ml-2 text-xs text-gray-500">
                            Converting HEIC...
                          </span>
                        </div>
                      ) : (
                        <img
                          src={preview.url || "/placeholder-image.jpg"}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {preview.isHeic &&
                        !preview.isLoading &&
                        !preview.error && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                            HEIC
                          </div>
                        )}
                      {preview.error && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                          Error
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove photo"
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
                    htmlFor="photos"
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

          <div>
            <label htmlFor="caption" className="block text-sm font-medium">
              Caption (will be applied to all photos)
            </label>
            <textarea
              id="caption"
              name="caption"
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white ${
              selectedFiles.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Photos"}
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

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.includes("Error") || message.includes("Failed")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </Layout>
  );
}
