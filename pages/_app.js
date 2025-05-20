import '../styles/globals.css';
import { useEffect } from 'react';
import { initLikeSync } from '../lib/likeSync';

function MyApp({ Component, pageProps }) {
  // Initialize like sync service
  useEffect(() => {
    // Start sync service with 60-second interval
    const cleanupSync = initLikeSync(60000);
    
    // Clean up on unmount
    return cleanupSync;
  }, []);
  
  return <Component {...pageProps} />;
}

export default MyApp;