
importScripts('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js');

self.onmessage = async function(e) {
  const { fileData, fileId, quality = 0.6 } = e.data;
  
  try {
    const blob = new Blob([fileData]);
    const jpegBlob = await heic2any({
      blob: blob,
      toType: "image/jpeg",
      quality: quality,
    });
    
    // Convert blob to array buffer for transfer
    const arrayBuffer = await jpegBlob.arrayBuffer();
    
    self.postMessage({
      success: true,
      fileId: fileId,
      data: arrayBuffer,
      type: jpegBlob.type
    });
  } catch (error) {
    self.postMessage({
      success: false,
      fileId: fileId,
      error: error.message
    });
  }
};
