// src/context/ScriptContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// Re-enable EventService imports
import {
  subscribe,
  unsubscribe,
  getActiveScriptContext,
  getCurrentScriptStep,
  registerInitialActiveEngines // For Stage C: Import function to register initial progress
} from '../services/EventService';

const ScriptContext = createContext(null); // Initialize with null

export function useScriptContext() {
  const context = useContext(ScriptContext);
  if (context === null) {
    // This error means you forgot to wrap your component in ScriptProvider
    throw new Error('useScriptContext must be used within a ScriptProvider');
  }
  return context;
}

export function ScriptProvider({ children }) {
  const loadInitialActiveEngineDetails = () => {
    // TEMPORARY: Clear localStorage for debugging script start and world state
    // localStorage.removeItem('scriptActiveEngineDetails');
    // localStorage.removeItem('worldState');
    console.log("[ScriptContext] TEMPORARY DEBUG: Cleared scriptActiveEngineDetails and worldState from localStorage.");

    try {
      const savedDetails = localStorage.getItem('scriptActiveEngineDetails');
      if (savedDetails) {
        const parsedArray = JSON.parse(savedDetails);
        if (Array.isArray(parsedArray)) {
          console.log("[ScriptContext] Loaded scriptActiveEngineDetails from localStorage:", new Map(parsedArray));
          return new Map(parsedArray);
        }
      }
    } catch (e) {
      console.error("Failed to load scriptActiveEngineDetails from localStorage:", e);
    }
    console.log("[ScriptContext] No scriptActiveEngineDetails found in localStorage, initializing with empty Map.");
    return new Map();
  };

  // Store details of active engines: Map<scriptId, currentStepObject | null>
  const [activeEngineDetails, setActiveEngineDetails] = useState(loadInitialActiveEngineDetails);

  // Effect to save activeEngineDetails to localStorage whenever it changes
  useEffect(() => {
    try {
      const serializableDetails = Array.from(activeEngineDetails.entries());
      localStorage.setItem('scriptActiveEngineDetails', JSON.stringify(serializableDetails));
      console.log("[ScriptContext] Saved scriptActiveEngineDetails to localStorage:", activeEngineDetails);
    } catch (e) {
      console.error("Failed to save scriptActiveEngineDetails to localStorage:", e);
    }
  }, [activeEngineDetails]);

  // Helper function to compare maps (simple value comparison)
  // Prevents unnecessary state updates if the content is identical
  const mapEquals = (map1, map2) => {
    if (map1.size !== map2.size) return false;
    for (let [key, val] of map1) {
      // Simple reference check for step object might be enough for performance
      if (!map2.has(key) || map2.get(key) !== val) {
        return false;
      }
    }
    return true;
  };

  // Function to update the state based on current active engines from EventService
  // useCallback is used here to memoize the function if it were passed down,
  // but primarily used in useEffect dependency array.
  const refreshActiveEngines = useCallback(() => {
    const activeIds = getActiveScriptContext(); // Get current active script IDs
    const newDetails = new Map();
    activeIds.forEach(scriptId => {
      const step = getCurrentScriptStep(scriptId); // Get the current step for each active script
      newDetails.set(scriptId, step);
    });

    // Only update state if the details have actually changed
    // Only update state if the details have actually changed
    setActiveEngineDetails(prevDetails => {
        // if (mapEquals(prevDetails, newDetails)) { // Temporarily comment out for debugging persistence
        //     console.log("[ScriptContext refreshActiveEngines] mapEquals returned true, returning prevDetails");
        //     return prevDetails;
        // }
        console.log("[ScriptContext refreshActiveEngines] Forcing update with newDetails:", newDetails);
        return newDetails; // Update state with new details
    });
  }, []); // Empty dependency array as it relies on functions from EventService, not props/state

  useEffect(() => {
    // Handler for script step updates from EventService
    const handleScriptStep = ({ scriptId, step, worldState }) => { // Include worldState if needed for logging
      console.log(`[ScriptContext] Received scriptStep event for scriptId: ${scriptId}. Step data:`, JSON.stringify(step)); // Log received step
      setActiveEngineDetails(prevDetails => {
        console.log("[ScriptContext] Updating activeEngineDetails. Previous state:", prevDetails);
        const newDetails = new Map(prevDetails);
        // Log the step object being set
        console.log(`[ScriptContext] Setting step for ${scriptId}:`, JSON.stringify(step));
        newDetails.set(scriptId, step); // Store the received step object
        console.log("[ScriptContext] Prepared newDetails state:", newDetails);
        // Prevent update if map content is identical (using simple reference check in mapEquals)
        // const areEqual = mapEquals(prevDetails, newDetails); // Temporarily comment out for debugging persistence
        // console.log(`[ScriptContext handleScriptStep] mapEquals result: ${areEqual}`);
        // if (areEqual) {
        //     console.log("[ScriptContext handleScriptStep] Skipping state update as maps appear equal by reference.");
        //     return prevDetails;
        // }
        console.log("[ScriptContext handleScriptStep] Forcing update with newDetails.");
        return newDetails;
      });
    };

    // Handler for script finishing from EventService
    const handleScriptFinished = ({ scriptId }) => {
       // console.log("ScriptContext: Received scriptFinished", scriptId);
       setActiveEngineDetails(prevDetails => {
         if (!prevDetails.has(scriptId)) return prevDetails; // No change needed
         const newDetails = new Map(prevDetails);
         newDetails.delete(scriptId);
         return newDetails;
       });
    };

    // Initial refresh when the provider mounts
    refreshActiveEngines();

    // Subscribe to events from EventService
    subscribe('scriptStep', handleScriptStep);
    subscribe('scriptFinished', handleScriptFinished);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribe('scriptStep', handleScriptStep);
      unsubscribe('scriptFinished', handleScriptFinished);
    };
  }, [refreshActiveEngines]); // Include refreshActiveEngines
 
  // For Stage C: Register the initially loaded activeEngineDetails with EventService on mount
  useEffect(() => {
    // activeEngineDetails at this point is the state after loadInitialActiveEngineDetails has run.
    // This effect runs once on mount.
    if (activeEngineDetails && activeEngineDetails.size > 0) {
      console.log("[ScriptContext] Component mounted. Registering initial active engines with EventService:", activeEngineDetails);
      registerInitialActiveEngines(activeEngineDetails);
    } else {
      console.log("[ScriptContext] Component mounted. No initial active engines from localStorage to register, or map is empty.");
      // Optionally, register an empty map if EventService expects a call regardless
      // registerInitialActiveEngines(new Map());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only once after initial render. activeEngineDetails is stable from useState init.

  // Define the context value provided to consuming components
  const value = {
    activeEngineDetails, // The Map containing active script IDs and their current steps
  };

  // Return the provider component
  return (
    <ScriptContext.Provider value={value}>
      {children}
    </ScriptContext.Provider>
  );
} // End of ScriptProvider component definition