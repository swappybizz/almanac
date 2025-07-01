// components/QrScanner.js

'use client'; // Still essential for client-side hooks and APIs

import { useEffect, useRef, useState } from 'react';
// We no longer need to import 'next/dynamic'

const QrScannerComponent = () => {
  // Ref to attach to the video element
  const videoRef = useRef(null);
  
  // Ref to hold the scanner instance, so we can call stop/destroy in cleanup.
  const scannerRef = useRef(null);
  
  // State to store the scanned data
  const [scanResult, setScanResult] = useState('');
  
  // State to control the visibility of the notification
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // This effect will run when the component mounts
  useEffect(() => {
    // This is an async function to handle the dynamic import
    const initializeScanner = async () => {
      if (videoRef.current) {
        // Dynamically import the QrScanner library
        // The .default is crucial because qr-scanner uses a default export
        const QrScanner = (await import('qr-scanner')).default;

        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('Decoded QR code:', result.data);
            
            // To prevent the notification from re-triggering constantly,
            // we can check if the new scan result is different from the last one.
            if (result.data !== scanResult) {
              setScanResult(result.data);
              setIsNotificationVisible(true);

              setTimeout(() => {
                setIsNotificationVisible(false);
              }, 3000);
            }
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: false,
            highlightCodeOutline: false,
          }
        );

        // Store the scanner instance in the ref
        scannerRef.current = qrScanner;

        // Start scanning
        try {
          await qrScanner.start();
        } catch (err) {
          console.error('Failed to start QR scanner', err);
        }
      }
    };
    
    initializeScanner();

    // Cleanup function: this will be called when the component unmounts
    return () => {
      if (scannerRef.current) {
        console.log('Stopping QR scanner...');
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [scanResult]); // Re-added scanResult to dependencies to allow re-scanning new codes after the first one

  return (
    <div className="relative w-full h-screen bg-black">
      <video 
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        muted
        playsInline 
      />

      <div 
        className={`
          absolute top-0 left-1/2 -translate-x-1/2 mt-4 p-3 rounded-lg shadow-lg
          bg-white/90 backdrop-blur-sm text-gray-800
          transition-all duration-500 ease-in-out
          max-w-sm w-11/12 break-words
          ${isNotificationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}
        `}
      >
        <p className="text-sm font-medium text-center">
          <strong className="font-bold">QR Detected:</strong> {scanResult}
        </p>
      </div>
    </div>
  );
};

export default QrScannerComponent;