
// Queue for storing pending like/unlike operations
let likeQueue = { likes: [], unlikes: [] };
let syncInProgress = false;
let syncInterval = null;

// Initialize the sync service
export function initLikeSync(intervalMs = 60000) { // Default: sync every minute
  if (typeof window === 'undefined') return;
  
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Set up periodic sync
  syncInterval = setInterval(() => {
    syncLikesToServer();
  }, intervalMs);
  
  // Also sync on page unload to catch final changes
  window.addEventListener('beforeunload', () => {
    syncLikesToServer(true); // Force immediate sync
  });
  
  return () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    window.removeEventListener('beforeunload', syncLikesToServer);
  };
}

// Add a like to the sync queue
export function queueLike(photoId) {
  // Remove from unlikes if it's there
  likeQueue.unlikes = likeQueue.unlikes.filter(id => id !== photoId);
  
  // Add to likes if not already there
  if (!likeQueue.likes.includes(photoId)) {
    likeQueue.likes.push(photoId);
  }
}

// Add an unlike to the sync queue
export function queueUnlike(photoId) {
  // Remove from likes if it's there
  likeQueue.likes = likeQueue.likes.filter(id => id !== photoId);
  
  // Add to unlikes if not already there
  if (!likeQueue.unlikes.includes(photoId)) {
    likeQueue.unlikes.push(photoId);
  }
}

// Sync likes to the server
export async function syncLikesToServer(immediate = false) {
  // Skip if sync is already in progress or queue is empty
  if (syncInProgress || (likeQueue.likes.length === 0 && likeQueue.unlikes.length === 0)) {
    return;
  }
  
  try {
    syncInProgress = true;
    
    // Create a copy of the current queue
    const queueToSync = { 
      likes: [...likeQueue.likes], 
      unlikes: [...likeQueue.unlikes] 
    };
    
    // Clear the queue
    likeQueue.likes = [];
    likeQueue.unlikes = [];
    
    // Send to server
    const response = await fetch('/api/photos/sync-likes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queueToSync),
      // For immediate sync (e.g., on page unload), use keepalive
      keepalive: immediate
    });
    
    if (!response.ok) {
      // If sync failed, put items back in queue
      likeQueue.likes = [...likeQueue.likes, ...queueToSync.likes];
      likeQueue.unlikes = [...likeQueue.unlikes, ...queueToSync.unlikes];
      console.error('Failed to sync likes with server');
    }
  } catch (error) {
    console.error('Error syncing likes:', error);
    // Put items back in queue on error
    likeQueue.likes = [...likeQueue.likes, ...queueToSync?.likes || []];
    likeQueue.unlikes = [...likeQueue.unlikes, ...queueToSync?.unlikes || []];
  } finally {
    syncInProgress = false;
  }
}
