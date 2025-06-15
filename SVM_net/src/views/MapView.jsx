// src/views/MapView.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { subscribe, unsubscribe } from '../services/EventService';
// import AIChatPanel from '../components/AIChatPanel';
import TaskOfferPanel from '../components/TaskOfferPanel';
import mapboxgl from 'mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { useWorldStateContext } from '../context/WorldStateContext'; // Import WorldState context hook
// Removed CSS import, will be moved to main.jsx
// Removed direct import of svmData, will use props instead.

// IMPORTANT: Replace with your actual Mapbox Access Token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function MapView({ onSelectSvm, activeTask, apiKey }) { // REMOVED svms prop
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]); // Ref to store current markers
  // Set initial coordinates to somewhere in Hong Kong
  const [lng, setLng] = useState(114.26);
  const [lat, setLat] = useState(22.31);
  const [zoom, setZoom] = useState(12);
  const { svms } = useWorldStateContext(); // Get svms from WorldStateContext
  const [aiMessage, setAiMessage] = useState("Initializing AI subsystems...");
  const [isMapLoaded, setIsMapLoaded] = useState(false); // State to track map load status
  const [scriptStep, setScriptStep] = useState(null);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [taskOffer, setTaskOffer] = useState(null);

  // Mock AI messages
  const mockAiMessages = [
    "Route optimization: Porter #7 rerouted for efficiency (+12%).",
    "Inventory alert: SVM-02 low on 'Cyber Cola'. Replenish task created.",
    "Demand forecast: High traffic expected near Central Plaza. Pre-stocking recommended.",
    "System status: All SVMs operational. Network integrity at 99.8%.",
    "Energy grid analysis: Peak hours approaching. Optimizing SVM power consumption.",
    "Security alert: Minor tampering detected SVM-05. Alerting authorities.",
    "Weather update: Rain expected. Adjusting delivery drone routes.",
    "Social trend analysis: 'Synth-Pop Soda' gaining popularity. Adjusting stock levels.",
  ];

  // Function to get a random message
  const getRandomAiMessage = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * mockAiMessages.length);
    return mockAiMessages[randomIndex];
  }, [mockAiMessages]); // Dependency array includes mockAiMessages

  // Subscribe to scriptStep events for dialogue/taskOffer
  useEffect(() => {
    const handler = ({ scriptId, step }) => {
      if (step.type === 'dialogue') {
        setScriptStep(step);
        setShowScriptDialog(true);
      }
      if (step.type === 'taskOffer') {
        setTaskOffer(step);
      }
      if (step.type === 'updateWorldState' && step.target === 'svm' && step.id != null) {
        onSelectSvm(step.id);
      }
    };
    subscribe('scriptStep', handler);
    return () => unsubscribe('scriptStep', handler);
  }, [onSelectSvm]);
  
  // close panels when underlying map changes
  useEffect(() => {
    if (activeTask) {
      setShowScriptDialog(false);
      setTaskOffer(null);
    }
  }, [activeTask]);

  // Update AI message periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAiMessage(getRandomAiMessage());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [getRandomAiMessage]); // Dependency array includes getRandomAiMessage

  // Map Initialization
  useEffect(() => {
    // Initialize map only once
    if (map.current) return;

    console.log('Attempting to initialize map...');

    // Check for WebGL support
    if (!mapboxgl.supported()) {
      console.error('Your browser does not support Mapbox GL');
      const fallbackText = document.getElementById('map-fallback-text');
      if (fallbackText) {
        fallbackText.innerHTML = 'Your browser does not support Mapbox GL.';
      }
      return;
    }

    // Initialize map
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Restore dark style
        center: [lng, lat],
        zoom: zoom,
        preserveDrawingBuffer: true,
        antialias: true,
        attributionControl: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Once map is loaded, hide fallback
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        const fallbackText = document.getElementById('map-fallback-text');
        if (fallbackText) {
          fallbackText.style.display = 'none';
        }
        // Set map loaded state to true
        setIsMapLoaded(true);

        // Marker logic moved to separate effect
      }); // End map.on('load')

        // Removed misplaced/remnant commented code from map load callback

      // Error handling

      // Error handling
      map.current.on('error', (e) => {
         console.error('Mapbox error:', e.error);
         const fallbackText = document.getElementById('map-fallback-text');
         if (fallbackText) {
           fallbackText.innerHTML = `Map Error: ${e.error?.message || 'Unknown error'}`;
           fallbackText.style.display = 'block';
         }
      });

    } catch (error) { // Catch initialization errors
      console.error('Error initializing Mapbox:', error);
      const fallbackText = document.getElementById('map-fallback-text');
      if (fallbackText) {
        fallbackText.innerHTML = `Initialization Error: ${error.message || 'Unknown error'}`;
        fallbackText.style.display = 'block';
      }
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array ensures map initializes only once


  // Effect for updating markers when svms or activeTask changes
  useEffect(() => {
    // Ensure map is initialized and loaded before adding/updating markers
    if (!map.current || !map.current.isStyleLoaded() || !isMapLoaded) return;

    // 1. Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = []; // Reset the ref array

    // 2. Add new markers based on current svms prop
    // Filter SVMs based on mapVisibility before creating markers
    const visibleSvms = svms.filter(svm => svm.mapVisibility === true);
    
    // console.log("Updating markers. Visible SVMs:", visibleSvms);
    visibleSvms.forEach((svm) => { // Iterate over visibleSvms
      console.log(`[MapView] Processing SVM ID: ${svm.id}, Name: ${svm.name}, Visible: ${svm.mapVisibility}`);
      // --- Removed Temporary Diagnostic Log for ID 3 ---
      const markerEl = document.createElement('div');

      // Base styles
      markerEl.style.width = '16px';
      markerEl.style.height = '16px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.border = '2px solid';
      markerEl.style.cursor = 'pointer';
      markerEl.style.transition = 'box-shadow 0.3s'; // Only transition box-shadow for now
      // Removed position: relative as it might interfere with Mapbox positioning

      // Status-based styles
      if (svm.status === 'Online') {
        markerEl.style.backgroundColor = '#10B981'; // green-500
        markerEl.style.borderColor = '#6EE7B7'; // green-300
        markerEl.style.boxShadow = '0 0 10px rgba(52,211,153,0.7)';
      } else {
        markerEl.style.backgroundColor = '#EF4444'; // red-600
        markerEl.style.borderColor = '#F87171'; // red-400
        markerEl.style.boxShadow = '0 0 10px rgba(239,68,68,0.7)';
      }

      // Active task target highlighting
      const isTaskTarget = activeTask?.relatedSvmId === svm.id;
      if (isTaskTarget) {
        markerEl.style.borderColor = '#FBBF24'; // amber-400
        markerEl.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.9)';
        // Removed animation style as it likely conflicts with Mapbox positioning
        // markerEl.style.animation = 'pulse 1.5s infinite';
      }

      // Hover effects (using CSS classes might be cleaner long-term)
      markerEl.onmouseover = () => {
        if (isTaskTarget) {
          markerEl.style.boxShadow = '0 0 20px rgba(251, 191, 36, 1)';
        } else {
          markerEl.style.boxShadow = svm.status === 'Online'
            ? '0 0 15px rgba(52,211,153,1)'
            : '0 0 15px rgba(239,68,68,1)';
        }
        // Removed transform: scale(1.2) on hover
      };
      markerEl.onmouseout = () => {
        if (isTaskTarget) {
          markerEl.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.9)';
        } else {
          markerEl.style.boxShadow = svm.status === 'Online'
            ? '0 0 10px rgba(52,211,153,0.7)'
            : '0 0 10px rgba(239,68,68,0.7)';
        }
         // Removed transform: scale(1) on mouseout
      };

      // Create and add marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([svm.longitude, svm.latitude])
        .addTo(map.current);

      // Click listener
      markerEl.addEventListener('click', () => {
        onSelectSvm(svm.id);
      });

      // Store marker instance for cleanup
      markersRef.current.push(marker);
    });

  }, [JSON.stringify(svms), activeTask, isMapLoaded]); // Dependencies: svms (stringified), activeTask, and map load status

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-100">Map</h1>

      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{
          height: '600px',
          width: '100%',
          position: 'relative',
          borderRadius: '0.25rem',
          marginBottom: '1rem',
          overflow: 'hidden',
          backgroundColor: '#111827'
        }}
      >
        {/* Fallback text */}
        <div id="map-fallback-text" style={{
          position: 'absolute',
          zIndex: 5,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center',
          padding: '20px',
          display: 'block'
        }}>
          Loading Map...
        </div>
      </div>

      {/* AI Analysis Panel */}
      {/* <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        border: '1px solid #06B6D4',
        borderRadius: '8px',
        padding: '12px',
        color: '#E5E7EB',
        maxWidth: '250px',
        zIndex: 10,
        backdropFilter: 'blur(5px)',
        boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          color: '#22D3EE',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          borderBottom: '1px solid #374151',
          paddingBottom: '4px'
        }}>
          AI Analysis Feed
        </h4>
        <p style={{ fontSize: '0.8rem', margin: '0 0 4px 0' }}>
          <span style={{ color: '#6EE7B7' }}>[+]</span> Predicted surge: Energy drinks near Tech Park (+45%)
        </p>
        <p style={{ fontSize: '0.8rem', margin: '0 0 4px 0' }}>
          <span style={{ color: '#F87171' }}>[-]</span> Anomaly detected: SVM-03 offline unexpectedly. Dispatching task...
        </p>
         <p style={{ fontSize: '0.8rem', margin: '0', color: '#A5B4FC' }}>
          <span style={{ fontWeight: 'bold' }}>[*]</span> {aiMessage}
        </p>
      </div> */}
{/* Removed the old SVM list */}
{/* Script-driven AI Chat Panel */}
{/* <AIChatPanel
  isVisible={showScriptDialog}
  onClose={() => setShowScriptDialog(false)}
  activeTask={activeTask}
  svmData={svms}
  apiKey={apiKey}
/> */}
<TaskOfferPanel
  offer={taskOffer}
  onClose={() => setTaskOffer(null)}
/>
</div>

  );
}

export default MapView;