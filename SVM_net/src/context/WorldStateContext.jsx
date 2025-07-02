import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import initialSvms from '../data/svmData';
import { subscribe, unsubscribe, publish } from '../services/EventService';
import PERSONAS from '../data/personaData';
import { getClueById } from '../data/cluesDatabase';
import { puzzlesDB } from '../data/puzzlesDatabase.js';
import { normalizePersonaId } from '../utils/personaUtils.js'; // Import the new utility
import { logDataToBackend } from '../services/DataSyncService.js'; // Import the data sync service
import tasks from '../data/taskData.js'; // Import task data to check initiallyVisible property

const WorldStateContext = createContext(null);

export function useWorldStateContext() {
  const context = useContext(WorldStateContext);
  if (context === null) {
    throw new Error('useWorldStateContext must be used within a WorldStateProvider');
  }
  return context;
}

// Custom hook to keep a ref in sync with a state value
const useRefSyncState = (initialState) => {
  const [state, setState] = useState(initialState);
  const ref = useRef(state);

  const setStateAndRef = useCallback((newStateOrUpdater) => {
    const isFunction = typeof newStateOrUpdater === 'function';
    setState(prevState => {
      const nextState = isFunction ? newStateOrUpdater(prevState) : newStateOrUpdater;
      ref.current = nextState;
      return nextState;
    });
  }, []);

  return [state, setStateAndRef, ref];
};

export function WorldStateProvider({ children }) {
  const loadInitialState = () => {
    const defaultPlayerState = {
      name: 'Neon Runner',
      credits: 1000,
      inventory: [],
      reputation: {},
    };
    const defaultPersonasState = PERSONAS.reduce((acc, persona) => {
      acc[persona.id] = {
        requiresChatWindow: persona.requiresChatWindow,
        hasFavorability: persona.hasFavorability || false,
        favorability: persona.hasFavorability ? persona.initialFavorability : null,
      };
      return acc;
    }, {});
    const defaultChatHistoriesState = {};
    const defaultDiscoveredCluesState = [];
    const defaultCurrentPuzzleState = {};
    const defaultHasUnreadClues = false;
    const defaultHasUnreadPuzzles = false;
    // 根据 initiallyVisible 属性初始化已解锁任务
    const defaultUnlockedTasks = tasks
      .filter(task => task.initiallyVisible === true)
      .map(task => task.taskId);
    const defaultCompletedTasks = [];

    try {
      const savedState = localStorage.getItem('worldState');
      if (savedState) {
          const parsed = JSON.parse(savedState);
          
          // Start with a deep copy of svms from svmData.js (which includes default mapVisibility)
          let mergedSvms = initialSvms.map(svm => ({ ...svm }));

          if (parsed.svms && Array.isArray(parsed.svms)) {
              parsed.svms.forEach(savedSvm => {
                  const index = mergedSvms.findIndex(s => s.id === savedSvm.id);
                  if (index !== -1) {
                      // Merge savedSvm into the corresponding svm from initialSvms
                      // Properties from savedSvm (like status, or a saved mapVisibility) override defaults from initialSvms.
                      // Properties only in initialSvms (like a newly added mapVisibility if savedSvm is old and doesn't have it) are kept from initialSvms.
                      mergedSvms[index] = { ...mergedSvms[index], ...savedSvm };
                  }
                  // Optional: handle SVMs in savedState but not in initialSvms (e.g., add them or log warning)
                  // For now, initialSvms is considered the master list of possible SVMs.
              });
          }
          // Ensure all svms in mergedSvms have mapVisibility, defaulting to true if somehow missed.
          // This is a fallback and should ideally not be needed if initialSvms is correctly populated.
          mergedSvms.forEach(svm => {
              if (typeof svm.mapVisibility === 'undefined') {
                  console.warn(`SVM ID ${svm.id} missing mapVisibility, defaulting to true.`);
                  svm.mapVisibility = true;
              }
          });

          const finalPersonasState = { ...defaultPersonasState }; // Start with defaults

          if (parsed.personas && typeof parsed.personas === 'object') {
            for (const rawIdInSaved in parsed.personas) {
              if (Object.prototype.hasOwnProperty.call(parsed.personas, rawIdInSaved)) {
                const authoritativeId = normalizePersonaId(rawIdInSaved); // Uses default PERSONAS_DATA from personaUtils
                const savedPersonaData = parsed.personas[rawIdInSaved];

                if (authoritativeId) {
                  // Ensure the authoritative key exists in finalPersonasState (it should from defaultPersonasState)
                  if (!finalPersonasState[authoritativeId]) {
                    // This case implies normalizePersonaId found an authoritative ID
                    // that wasn't in the initial default map (e.g. if personaData.js has "NewChar"
                    // but defaultPersonasState was built before "NewChar" was added to PERSONAS array).
                    // Or, if rawIdInSaved was already authoritative but somehow missed in defaultPersonasState.
                    // Initialize if missing to avoid errors when merging.
                    finalPersonasState[authoritativeId] = {};
                  }

                  // Merge saved data into the authoritative persona object
                  finalPersonasState[authoritativeId] = {
                    ...(finalPersonasState[authoritativeId]), // Keep existing default/authoritative data
                    ...savedPersonaData                     // Override with saved data
                  };
                  
                  // Ensure favorability data from initial defaults is preserved if not in saved data
                  if (finalPersonasState[authoritativeId].hasFavorability && typeof finalPersonasState[authoritativeId].favorability !== 'number') {
                    const personaDefault = PERSONAS.find(p => p.id === authoritativeId);
                    if (personaDefault && personaDefault.hasFavorability) {
                      finalPersonasState[authoritativeId].favorability = personaDefault.initialFavorability;
                    }
                  }

                  // If the rawId from localStorage was different from the authoritativeId,
                  // and its data has now been merged into the authoritativeId entry,
                  // remove the non-authoritative entry to prevent duplicates.
                  if (rawIdInSaved !== authoritativeId && finalPersonasState[rawIdInSaved]) {
                    // Check if the non-authoritative entry was just a shallow copy of the saved data
                    // This is a bit heuristic; the main goal is to avoid { echo:..., Echo:... }
                    // A simple delete is fine if we assume the spread {...defaultPersonasState, ...parsed.personas}
                    // might have temporarily created finalPersonasState[rawIdInSaved]
                    delete finalPersonasState[rawIdInSaved];
                  }
                } else {
                  // If rawIdInSaved couldn't be normalized (normalizePersonaId returned rawIdInSaved because it wasn't in PERSONAS_DATA)
                  // This means it's an unknown/orphaned persona from localStorage.
                  // Keep it for now, as the original spread operator logic would have.
                  finalPersonasState[rawIdInSaved] = savedPersonaData;
                  console.warn(`[WorldStateContext] Persona ID '${rawIdInSaved}' from localStorage could not be normalized to an authoritative ID and was kept as is.`);
                }
              }
            }
          }
          
          const chatHistoriesState = parsed.chatHistories || defaultChatHistoriesState;
          const discoveredCluesState = parsed.discoveredClues || defaultDiscoveredCluesState;
          const currentPuzzleStateData = parsed.currentPuzzleState || defaultCurrentPuzzleState;
          const unlockedTasksState = Array.isArray(parsed.unlockedTasks) ? parsed.unlockedTasks : defaultUnlockedTasks;
          const completedTasksState = Array.isArray(parsed.completedTasks) ? parsed.completedTasks : defaultCompletedTasks;
          
          return {
              svms: mergedSvms, // Use the merged list
              activeTask: parsed.activeTask || null,
              player: {
                ...defaultPlayerState,
                ...(parsed.player || {}),
                name: parsed.player?.name !== undefined ? parsed.player.name : defaultPlayerState.name,
              },
              personas: finalPersonasState, // Use the normalized personas state
              chatHistories: chatHistoriesState,
              discoveredClues: discoveredCluesState,
              currentPuzzleState: currentPuzzleStateData,
              hasUnreadClues: parsed.hasUnreadClues || defaultHasUnreadClues,
              hasUnreadPuzzles: parsed.hasUnreadPuzzles || defaultHasUnreadPuzzles,
              unlockedTasks: unlockedTasksState,
              completedTasks: completedTasksState,
            };
          }
    } catch (e) {
      console.error('Failed to load world state from localStorage:', e);
    }
    return {
      svms: initialSvms.map(svm => ({ ...svm })),
      activeTask: null,
      player: defaultPlayerState,
      personas: defaultPersonasState,
      chatHistories: defaultChatHistoriesState,
      discoveredClues: defaultDiscoveredCluesState,
      currentPuzzleState: defaultCurrentPuzzleState,
      hasUnreadClues: defaultHasUnreadClues,
      hasUnreadPuzzles: defaultHasUnreadPuzzles,
      unlockedTasks: defaultUnlockedTasks,
      completedTasks: defaultCompletedTasks,
    };
  };
  
  const [state, setState, worldStateRef] = useRefSyncState(loadInitialState());
  const { svms, activeTask, player, personas, chatHistories, discoveredClues, currentPuzzleState, hasUnreadClues, hasUnreadPuzzles, unlockedTasks, completedTasks } = state;
  const previousInventoryRef = useRef(player.inventory);
  
  const publishEvent = useCallback((eventName, eventData) => {
      try {
          console.log(`[WorldStateContext -> publishEvent] Publishing ${eventName}`, eventData);
          publish(eventName, eventData);
      } catch (e) {
          console.error(`[WorldStateContext -> publishEvent] Error publishing event: ${eventName}`, e);
      }
  }, []);

  useEffect(() => {
    // This effect now only handles persisting to localStorage
    const stateToSave = { ...state };
    delete stateToSave._pendingEvent;
    delete stateToSave._postStateUpdateActions;
    
    // Log the specific SVM's mapVisibility before saving to localStorage
    if (stateToSave.svms) {
      const svmToLog = stateToSave.svms.find(s => s.id === 10);
      if (svmToLog) {
        console.log(`[WorldStateContext] About to save to localStorage. SVM ID 10 mapVisibility: ${svmToLog.mapVisibility}`, JSON.stringify(svmToLog));
      } else {
        console.log(`[WorldStateContext] About to save to localStorage. SVM ID 10 not found in stateToSave.svms.`);
      }
      // console.log('[WorldStateContext] Full svms state to be saved:', JSON.stringify(stateToSave.svms));
    }

    try {
      localStorage.setItem('worldState', JSON.stringify(stateToSave));
      // console.log('[WorldStateContext] Successfully saved to localStorage.');
    } catch (e) {
      console.error('Failed to save world state to localStorage:', e);
    }
  }, [state]);

  useEffect(() => {
    const handleStateUpdate = (update) => {
      console.log('[WorldStateContext] handleStateUpdate CALLED. Update object:', JSON.stringify(update)); // ADDED ENTRY LOG
      if (!update || typeof update.target === 'undefined') {
        console.warn('[WorldStateContext] handleStateUpdate received invalid or incomplete update object:', update);
        return;
      }
      const { target, id, property, value, action, payload } = update;
      console.log(`[WorldStateContext] Destructured update values. Target: ${target}, ID: ${id}, Property: ${property}, Value: ${value}, Action: ${action}, Payload: ${JSON.stringify(payload)}`); // ADDED LOG
      
      let eventToPublish = null;

      console.log('[WorldStateContext] PREPARING TO CALL setState with updater function.'); // New log before setState
      setState(prev => {
        console.log('[WorldStateContext] ENTERED setState updater function.'); // New log inside updater
        let newState = { ...prev };
        console.log(`[WorldStateContext] Inside setState. Target: ${target}`); // Log inside setState, before switch
        switch(target) {
          case 'svms': // Changed 'svm' to 'svms' to match the actual target value
            console.log(`[WorldStateContext] Entered 'svms' case. Target ID: ${id}, Property: ${property}, Value: ${value}`); // Log entering 'svms' case
            console.log(`[WorldStateContext] SVMs state before update:`, JSON.stringify(prev.svms));
            const svmIndex = prev.svms.findIndex(svm => svm.id === id);
            if (svmIndex !== -1) {
              console.log(`[WorldStateContext] SVM found for update:`, JSON.stringify(prev.svms[svmIndex]));
            } else {
              console.warn(`[WorldStateContext] SVM with ID ${id} not found for update.`);
            }
            newState.svms = prev.svms.map(svm =>
              svm.id === id ? { ...svm, [property]: value } : svm
            );
            // Log the specific SVM's mapVisibility immediately after the map operation
            const updatedSvmInNewState = newState.svms.find(s => s.id === id);
            if (updatedSvmInNewState) {
              console.log(`[WorldStateContext] SVM ID ${id} in newState.svms after map. mapVisibility: ${updatedSvmInNewState.mapVisibility}`);
            } else {
              console.log(`[WorldStateContext] SVM ID ${id} not found in newState.svms after map.`);
            }
            
            if (property === 'mapVisibility') {
              eventToPublish = { name: 'svm_map_visibility_updated', data: { id, value } };
            }
            console.log(`[WorldStateContext] SVMs state after update (entire array):`, JSON.stringify(newState.svms));
            break;
          case 'task':
            if (property === 'active') {
              if (value === null) {
                newState.activeTask = null;
              } else if (value && typeof value === 'object' && value.hasOwnProperty('_update_')) {
                const newValue = { ...value };
                delete newValue._update_;
                newState.activeTask = { ...(prev.activeTask || {}), ...newValue };
              } else {
                newState.activeTask = value;
              }
            } else if (prev.activeTask && property) {
              newState.activeTask = { ...prev.activeTask, [property]: value };
            } else {
              return prev;
            }
            break;
          case 'player':
            const currentVal = prev.player[property];
            let newPlayerValue;
            if (property === 'credits') {
              const changeAmount = typeof value === 'number' ? value : (value?._operation === 'add' ? value.value : 0);
              if (typeof changeAmount === 'number') {
                 newPlayerValue = currentVal + changeAmount;
                 eventToPublish = { name: 'player_credits_updated', data: { change: changeAmount, newTotal: newPlayerValue } };
              } else {
                 newPlayerValue = currentVal;
              }
            } else if (property === 'inventory') {
              const itemsToProcess = Array.isArray(value) ? value : [value];
              const newInventory = [...prev.player.inventory];
              let itemAddedDetails = null;
              itemsToProcess.forEach(itemToAdd => {
                  if (!itemToAdd || typeof itemToAdd.id === 'undefined' || typeof itemToAdd.quantity !== 'number') return;
                  const existingItemIndex = newInventory.findIndex(item => item.id === itemToAdd.id);
                  if (existingItemIndex > -1) {
                      newInventory[existingItemIndex].quantity += itemToAdd.quantity;
                  } else if (itemToAdd.quantity > 0) {
                      newInventory.push({ ...itemToAdd });
                  }
                  if (itemToAdd.quantity > 0 && !itemAddedDetails) itemAddedDetails = itemToAdd;
              });
              newPlayerValue = newInventory.filter(item => item.quantity > 0);
              if (itemAddedDetails) {
                 eventToPublish = { name: 'player_inventory_updated', data: { addedItemId: itemAddedDetails.id, addedQuantity: itemAddedDetails.quantity } };
              }
            } else if (property === 'reputation') {
               const newReputation = { ...prev.player.reputation };
               for (const factionId in value) {
                   if (typeof value[factionId] === 'number') {
                       newReputation[factionId] = (newReputation[factionId] || 0) + value[factionId];
                   }
               }
               newPlayerValue = newReputation;
               eventToPublish = { name: 'player_reputation_updated', data: { changes: value, newReputation: newPlayerValue } };
            } else {
              newPlayerValue = value;
            }
            newState.player = { ...prev.player, [property]: newPlayerValue };
            break;
          case 'environment':
             newState.environment = { ...(prev.environment || {}), [id]: { ...(prev.environment?.[id] || {}), [property]: value } };
             break;
          case 'persona':
             newState.personas = { ...(prev.personas || {}), [id]: { ...(prev.personas?.[id] || {}), [property]: value } };
             eventToPublish = { name: 'persona_updated', data: { id, property, value } };
             break;
          case 'discoveredClues':
            if (action === 'addById' && payload && payload.clueId) {
              const clueIdToAdd = payload.clueId;
              const clueFromDB = getClueById(clueIdToAdd);
              if (clueFromDB) {
                const alreadyExists = prev.discoveredClues.some(c => c.id === clueFromDB.id);
                if (!alreadyExists) {
                  const clueToAdd = { ...clueFromDB, timestamp: Date.now(), isViewed: false };
                  newState.discoveredClues = [...prev.discoveredClues, clueToAdd];
                  newState.hasUnreadClues = true; 
                  eventToPublish = { name: 'clue_unlocked', data: { clueId: clueToAdd.id, clue: clueToAdd } };
                }
              } else {
                console.warn(`[WorldStateContext via request] Clue with id ${clueIdToAdd} not found in cluesDatabase.`);
              }
            }
            break;
          case 'puzzleControl':
            if (action === 'activatePuzzle' && payload && payload.puzzleId) {
              const puzzleIdToActivate = payload.puzzleId;
              if (prev.currentPuzzleState[puzzleIdToActivate]) {
                // Puzzle already active, maybe just mark as new if it wasn't? Or do nothing.
                // For now, if already active, we don't reset its 'new' status unless explicitly told.
              } else {
                const puzzleFromDB = puzzlesDB[puzzleIdToActivate];
                if (puzzleFromDB) {
                  const newPuzzleActiveState = JSON.parse(JSON.stringify(puzzleFromDB));
                  newPuzzleActiveState.status = newPuzzleActiveState.status === 'locked' ? 'unsolved' : (newPuzzleActiveState.status || 'unsolved');
                  newPuzzleActiveState.variables = { ...(newPuzzleActiveState.initialVariables || {}) };
                  newState.currentPuzzleState = { ...prev.currentPuzzleState, [puzzleIdToActivate]: newPuzzleActiveState };
                  newState.hasUnreadPuzzles = true; 
                  eventToPublish = { name: 'puzzle_activated', data: { puzzleId: puzzleIdToActivate, puzzle: newState.currentPuzzleState[puzzleIdToActivate] } };
                } else {
                  console.error(`[WorldStateContext via request] Puzzle ${puzzleIdToActivate} not found in puzzlesDB.`);
                }
              }
            }
            break;
          case 'puzzleStateProperty': { // Added curly braces for scope
            if (action === 'set' && payload && typeof payload.puzzleId === 'string' && typeof payload.path === 'string' && typeof payload.value !== 'undefined') {
              const { puzzleId, path, value: newValue } = payload;
              
              if (prev.currentPuzzleState && prev.currentPuzzleState[puzzleId]) {
                const puzzleToUpdate = JSON.parse(JSON.stringify(prev.currentPuzzleState[puzzleId]));
                
                setNestedValue(puzzleToUpdate, path, newValue);
                                
                newState.currentPuzzleState = {
                  ...prev.currentPuzzleState,
                  [puzzleId]: puzzleToUpdate
                };
                eventToPublish = {
                  name: 'puzzle_variable_updated',
                  data: {
                    puzzleId,
                    path,
                    value: newValue,
                    puzzle: newState.currentPuzzleState[puzzleId]
                  }
                };
              } else {
                console.warn(`[WorldStateContext via request] puzzleStateProperty: Puzzle with ID '${puzzleId}' not found or not active for update.`);
              }
            } else {
              console.warn('[WorldStateContext via request] Invalid payload for puzzleStateProperty update. Required: puzzleId (string), path (string), value. Received:', payload);
            }
            break;
          }
          case 'tasks':
            if (action === 'unlock' && payload && payload.taskId) {
              const taskIdToUnlock = payload.taskId;
              const alreadyUnlocked = prev.unlockedTasks.includes(taskIdToUnlock);
              if (!alreadyUnlocked) {
                newState.unlockedTasks = [...prev.unlockedTasks, taskIdToUnlock];
                eventToPublish = { name: 'task_unlocked', data: { taskId: taskIdToUnlock } };
                console.log(`[WorldStateContext] Task '${taskIdToUnlock}' unlocked.`);
              }
            } else if (action === 'complete' && payload && payload.taskId) {
              const taskIdToComplete = payload.taskId;
              const alreadyCompleted = prev.completedTasks.find(t => t.taskId === taskIdToComplete);
              if (!alreadyCompleted) {
                const completedTask = {
                  taskId: taskIdToComplete,
                  completedAt: Date.now(),
                  ...payload, // Include any additional data like score, results, etc.
                };
                newState.completedTasks = [...prev.completedTasks, completedTask];
                
                // IMPORTANT: Also remove from unlockedTasks to prevent re-display in UI
                if (prev.unlockedTasks.includes(taskIdToComplete)) {
                    newState.unlockedTasks = prev.unlockedTasks.filter(id => id !== taskIdToComplete);
                }

                eventToPublish = { name: 'task_completed', data: { ...completedTask } };
                console.log(`[WorldStateContext] Task '${taskIdToComplete}' completed.`);
              }
            }
            break;
          default:
            return prev;
        }
        if (eventToPublish) {
          newState._pendingEvent = eventToPublish;
        }
        return newState;
      });
    };
    subscribe('requestWorldStateUpdate', handleStateUpdate);
    return () => unsubscribe('requestWorldStateUpdate', handleStateUpdate);
  }, []); 

  useEffect(() => {
    if (state._pendingEvent) {
      publishEvent(state._pendingEvent.name, state._pendingEvent.data);
      setState(prev => {
        const newState = { ...prev };
        delete newState._pendingEvent;
        return newState;
      });
    }
  }, [state, publishEvent]);

  useEffect(() => {
      const previousInventory = previousInventoryRef.current;
      const currentInventory = player.inventory;
      if (JSON.stringify(previousInventory) !== JSON.stringify(currentInventory)) {
          const previouslyHadHackTool = previousInventory.some(item => item.id === 'hacking_tool_corpsec');
          const currentlyHasHackTool = currentInventory.some(item => item.id === 'hacking_tool_corpsec');
          const previouslyHadSpike = previousInventory.some(item => item.id === 'data_spike');
          const currentlyHasSpike = currentInventory.some(item => item.id === 'data_spike');
          if (currentlyHasHackTool && !previouslyHadHackTool) {
              const addedItem = currentInventory.find(item => item.id === 'hacking_tool_corpsec');
              publishEvent('player_inventory_updated', { addedItemId: 'hacking_tool_corpsec', addedQuantity: addedItem?.quantity || 1 });
          }
          if (currentlyHasSpike && !previouslyHadSpike) {
              const addedItem = currentInventory.find(item => item.id === 'data_spike');
              publishEvent('player_inventory_updated', { addedItemId: 'data_spike', addedQuantity: addedItem?.quantity || 1 });
          }
          previousInventoryRef.current = currentInventory;
      }
  }, [player.inventory, publishEvent]);

  // Effect to handle data synchronization requests
  useEffect(() => {
    const handleSyncDataRequest = async (eventPayload) => {
        // Access the current state directly from the 'state' variable in the outer scope of WorldStateProvider
        // This ensures we are always using the most up-to-date state when the event is handled.
        console.log('[WorldStateContext] Received SYNC_DATA_TO_BACKEND request. Current state snapshot for sync:', {
            chatHistories: state.chatHistories,
            player: state.player,
            discoveredClues: state.discoveredClues,
            currentPuzzleState: state.currentPuzzleState,
            // svms: state.svms, // Potentially large, sync selectively
            // activeTask: state.activeTask // Sync selectively
        });
        
        const { chatHistories, player, discoveredClues, currentPuzzleState, svms, activeTask } = state;

        // Determine which data to send based on eventPayload or send a default set.
        // eventPayload might contain { dataTypes: ['chatHistories', 'playerState'] }
        const dataTypesToSync = eventPayload?.dataTypes || ['chatHistories', 'playerState', 'discoveredClues', 'currentPuzzleState'];

        const syncPromises = [];

        if (dataTypesToSync.includes('chatHistories') && chatHistories && Object.keys(chatHistories).length > 0) {
            syncPromises.push(
                logDataToBackend('chatHistories', chatHistories)
                    .catch(err => console.error('[WorldStateContext] Failed to sync chatHistories:', err))
            );
        }
        if (dataTypesToSync.includes('playerState') && player) {
            syncPromises.push(
                logDataToBackend('playerState', player)
                    .catch(err => console.error('[WorldStateContext] Failed to sync playerState:', err))
            );
        }
        if (dataTypesToSync.includes('discoveredClues') && discoveredClues && discoveredClues.length > 0) {
             syncPromises.push(
                logDataToBackend('discoveredClues', discoveredClues)
                    .catch(err => console.error('[WorldStateContext] Failed to sync discoveredClues:', err))
            );
        }
        if (dataTypesToSync.includes('currentPuzzleState') && currentPuzzleState && Object.keys(currentPuzzleState).length > 0) {
            syncPromises.push(
                logDataToBackend('currentPuzzleState', currentPuzzleState)
                    .catch(err => console.error('[WorldStateContext] Failed to sync currentPuzzleState:', err))
            );
        }
        // Example: Conditionally sync other large/optional states if specified
        if (eventPayload?.includeOptionalData) {
            if (dataTypesToSync.includes('svmsState') && svms && svms.length > 0) {
                 syncPromises.push(
                    logDataToBackend('svmsState', svms)
                        .catch(err => console.error('[WorldStateContext] Failed to sync svmsState:', err))
                );
            }
            if (dataTypesToSync.includes('activeTaskState') && activeTask) {
                 syncPromises.push(
                    logDataToBackend('activeTaskState', activeTask)
                        .catch(err => console.error('[WorldStateContext] Failed to sync activeTaskState:', err))
                );
            }
        }

        if (syncPromises.length > 0) {
            try {
                // Using Promise.allSettled to wait for all promises, regardless of individual success/failure
                const results = await Promise.allSettled(syncPromises);
                console.log('[WorldStateContext] Data sync attempt completed. Results:', results);
                
                const allSucceeded = results.every(result => result.status === 'fulfilled');
                const partialFailure = results.some(result => result.status === 'rejected');

                if (allSucceeded) {
                    publish('DATA_SYNC_COMPLETE', { status: 'success', syncedTypes: dataTypesToSync });
                } else if (partialFailure) {
                    publish('DATA_SYNC_COMPLETE', { status: 'partial_error', syncedTypes: dataTypesToSync, results });
                } else { // Should not happen if syncPromises.length > 0 and allSettled is used
                    publish('DATA_SYNC_COMPLETE', { status: 'unknown_state', syncedTypes: dataTypesToSync, results });
                }

            } catch (error) { // This catch block might be redundant with allSettled if not re-throwing
                console.error('[WorldStateContext] Error during Promise.allSettled for data sync operations:', error);
                publish('DATA_SYNC_COMPLETE', { status: 'critical_error', syncedTypes: dataTypesToSync, errorInfo: error.message });
            }
        } else {
            console.log('[WorldStateContext] No data to sync for the specified dataTypes or data was empty.');
            publish('DATA_SYNC_COMPLETE', { status: 'no_data_to_sync', syncedTypes: dataTypesToSync });
        }
    };

    subscribe('SYNC_DATA_TO_BACKEND', handleSyncDataRequest);

    return () => {
        unsubscribe('SYNC_DATA_TO_BACKEND', handleSyncDataRequest);
    };
  }, [state]); // Key dependency: 'state'. This ensures the handler always has access to the latest state.

  const updateSvmStatus = (svmId, newStatus) => {
    setState(prev => ({ ...prev, svms: prev.svms.map(svm => svm.id === svmId ? { ...svm, status: newStatus } : svm) }));
  };

  const setActiveTask = (task) => {
      setState(prev => ({ ...prev, activeTask: task }));
  };

  const updatePlayerCredits = (amount) => {
      let newTotal;
      setState(prev => {
          newTotal = prev.player.credits + amount;
          return { ...prev, player: { ...prev.player, credits: newTotal } };
      });
      publishEvent('player_credits_updated', { change: amount, newTotal });
  };

  const updatePlayerInventory = (item) => { 
      setState(prev => {
          const newInventory = [...prev.player.inventory];
          const existingItemIndex = newInventory.findIndex(i => i.id === item.id);
          if (existingItemIndex > -1) {
              newInventory[existingItemIndex].quantity += item.quantity;
          } else if (item.quantity > 0) {
              newInventory.push({ ...item });
          }
          const finalInventory = newInventory.filter(i => i.quantity > 0);
          return { ...prev, player: { ...prev.player, inventory: finalInventory } };
      });
  };

   const updatePlayerReputation = (factionId, changeAmount) => {
       let newReputationObject;
       setState(prev => {
           const currentRep = prev.player.reputation || {};
           newReputationObject = { ...currentRep, [factionId]: (currentRep[factionId] || 0) + changeAmount };
           return { ...prev, player: { ...prev.player, reputation: newReputationObject } };
       });
       publishEvent('player_reputation_updated', { changes: { [factionId]: changeAmount }, newReputation: newReputationObject });
   };

  const setChatHistories = useCallback((newChatHistories) => {
    setState(prev => ({ ...prev, chatHistories: typeof newChatHistories === 'function' ? newChatHistories(prev.chatHistories) : newChatHistories }));
  }, []);
  
  const updatePersonaFavorability = useCallback((personaId, change) => {
    if (typeof change !== 'number') return;
    
    let newFavorabilityValue;
    setState(prev => {
      const targetPersona = prev.personas[personaId];
      if (!targetPersona || !targetPersona.hasFavorability) {
        console.warn(`[WorldStateContext] Attempted to update favorability for persona '${personaId}', which does not have this feature enabled.`);
        return prev;
      }
      
      const currentFavorability = targetPersona.favorability || 0;
      newFavorabilityValue = currentFavorability + change;
      
      const newPersonas = {
        ...prev.personas,
        [personaId]: {
          ...targetPersona,
          favorability: newFavorabilityValue
        }
      };
      return { ...prev, personas: newPersonas };
    });

    publishEvent('persona_favorability_updated', {
      personaId,
      change,
      newFavorability: newFavorabilityValue
    });
  }, [publishEvent]);
 
  const addDiscoveredClue = useCallback((clueObject) => {
    if (!clueObject || typeof clueObject.id === 'undefined') return;
    setState(prev => {
        const alreadyExists = prev.discoveredClues.some(c => c.id === clueObject.id);
        if (alreadyExists) return prev;
        const clueToAdd = { ...clueObject, timestamp: clueObject.timestamp || Date.now(), isViewed: clueObject.isViewed === undefined ? false : clueObject.isViewed };
        // Note: Direct addDiscoveredClue might not trigger hasUnreadClues if not going through requestWorldStateUpdate
        // This could be enhanced if direct calls also need to set the unread flag.
        return { ...prev, discoveredClues: [...prev.discoveredClues, clueToAdd] };
    });
  }, []); 
 
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };
 
  const updatePuzzleState = useCallback((puzzleId, pathOrUpdateObject, value) => {
    if (!puzzleId) return;
    setState(prev => {
        const newCurrentPuzzleState = { ...prev.currentPuzzleState };
        if (!newCurrentPuzzleState[puzzleId]) {
            newCurrentPuzzleState[puzzleId] = {}; // Initialize if not exists
        }
        const puzzleStateCopy = JSON.parse(JSON.stringify(newCurrentPuzzleState[puzzleId])); // Deep copy

        if (typeof pathOrUpdateObject === 'string') {
            setNestedValue(puzzleStateCopy, pathOrUpdateObject, value);
        } else if (typeof pathOrUpdateObject === 'object' && pathOrUpdateObject !== null) {
            // For merging an object, ensure proper deep merge if necessary, or shallow merge like here:
            Object.keys(pathOrUpdateObject).forEach(key => {
                setNestedValue(puzzleStateCopy, key, pathOrUpdateObject[key]);
            });
        } else {
            return prev; 
        }
        newCurrentPuzzleState[puzzleId] = puzzleStateCopy;
        return { ...prev, currentPuzzleState: newCurrentPuzzleState };
    });
  }, []); 

  const attemptSolvePuzzle = useCallback((puzzleId, submittedSolution) => {
    let puzzleSolvedResult = { success: false, message: 'Puzzle not found or not active.' };
    let actionsForPostUpdate = []; 

    setState(prev => {
      const puzzle = prev.currentPuzzleState[puzzleId];
      if (!puzzle) {
        return prev;
      }
      if (puzzle.status === 'solved') {
        puzzleSolvedResult = { success: false, message: 'Puzzle already solved.' };
        return prev;
      }

      let isCorrect = false;
      if (puzzle.solutionType === 'code') {
        isCorrect = String(submittedSolution).trim() === String(puzzle.solution).trim();
      } else if (puzzle.solutionType === 'sequence') {
        isCorrect = false; 
        puzzleSolvedResult = { success: false, message: 'Sequence puzzle solving logic pending.' };
      }

      let newPuzzleData = { ...puzzle };
      let eventToPublish = null;
      actionsForPostUpdate = [];

      if (isCorrect) {
        newPuzzleData.status = 'solved';
        puzzleSolvedResult = { success: true, message: 'Puzzle solved!' };
        eventToPublish = { name: 'puzzle_solved', data: { puzzleId, solution: submittedSolution, puzzle: { ...newPuzzleData } } };
        if (newPuzzleData.onSolveActions && Array.isArray(newPuzzleData.onSolveActions)) {
          actionsForPostUpdate.push(...newPuzzleData.onSolveActions);
        }
      } else {
        if (puzzleSolvedResult.message === 'Puzzle not found or not active.') {
             puzzleSolvedResult = { success: false, message: 'Solution incorrect.' };
        }
        eventToPublish = { name: 'puzzle_solve_failed', data: { puzzleId, submittedSolution } };
        if (newPuzzleData.variables && typeof newPuzzleData.variables.attemptsMade === 'number') {
          actionsForPostUpdate.push({
            type: '_INTERNAL_UPDATE_PUZZLE_VAR', puzzleId, path: 'variables.attemptsMade', value: newPuzzleData.variables.attemptsMade + 1
          });
        }
      }
      
      const newCurrentPuzzleState = { ...prev.currentPuzzleState, [puzzleId]: newPuzzleData };
      let nextState = { ...prev, currentPuzzleState: newCurrentPuzzleState };
      if (eventToPublish) nextState._pendingEvent = eventToPublish;
      if (actionsForPostUpdate.length > 0) {
        nextState._postStateUpdateActions = [...(prev._postStateUpdateActions || []), ...actionsForPostUpdate];
      }
      return nextState;
    });
    return puzzleSolvedResult;
  }, [publishEvent]); 

  useEffect(() => {
    const actionsToRun = state._postStateUpdateActions;
    if (actionsToRun && actionsToRun.length > 0) {
      actionsToRun.forEach(action => {
        if (!action || !action.type) {
            return;
        }
        switch (action.type) {
          case 'UNLOCK_CLUE':
            if (action.clueId) {
              publishEvent('requestWorldStateUpdate', { target: 'discoveredClues', action: 'addById', payload: { clueId: action.clueId } });
            }
            break;
          case 'UPDATE_PUZZLE_STATE':
          case '_INTERNAL_UPDATE_PUZZLE_VAR':
            if (action.puzzleId && action.path) {
              // Direct updatePuzzleState call was problematic due to potential stale closures if not careful.
              // Publishing an event for this is safer if updatePuzzleState itself relies on latest prev state.
              // However, for internal updates, direct call might be fine if updatePuzzleState is robust.
              // Let's assume updatePuzzleState is robust for now.
               updatePuzzleState(action.puzzleId, action.path, action.value);
            }
            break;
          case 'dialogue':
            if (action.personaId && action.text) {
              publishEvent('dialogue_action_requested', { personaId: action.personaId, text: action.text, nextStep: action.nextStep || null });
            }
            break;
          default:
        }
      });
      setState(prev => {
        const newState = { ...prev };
        delete newState._postStateUpdateActions;
        return newState;
      });
    }
  }, [state, updatePuzzleState, publishEvent]);

  const getWorldState = useCallback(() => worldStateRef.current, []);

  const markCluesAsRead = useCallback(() => {
    setState(prev => ({ ...prev, hasUnreadClues: false }));
  }, []);

  const markPuzzlesAsRead = useCallback(() => {
    setState(prev => ({ ...prev, hasUnreadPuzzles: false }));
  }, []);
  
  const value = React.useMemo(() => ({
    svms, activeTask, player, personas, chatHistories, setChatHistories,
    discoveredClues, addDiscoveredClue, currentPuzzleState, updatePuzzleState,
    hasUnreadClues, hasUnreadPuzzles, markCluesAsRead, markPuzzlesAsRead,
    unlockedTasks, completedTasks,
    activatePuzzle: (puzzleId) => {
        publishEvent('requestWorldStateUpdate', { target: 'puzzleControl', action: 'activatePuzzle', payload: { puzzleId } });
    },
    unlockTask: (taskId) => {
        publishEvent('requestWorldStateUpdate', { target: 'tasks', action: 'unlock', payload: { taskId } });
    },
    completeTask: (taskId, additionalData = {}) => {
        console.log(`[WorldStateContext] completeTask method invoked for taskId: '${taskId}'. Publishing 'requestWorldStateUpdate'.`);
        publishEvent('requestWorldStateUpdate', { target: 'tasks', action: 'complete', payload: { taskId, ...additionalData } });
    },
    attemptSolvePuzzle,
    updateSvmStatus, setActiveTask, updatePlayerCredits, updatePlayerInventory, updatePlayerReputation,
    updatePersonaFavorability, // Add the new function here
    getWorldState
  }), [
    svms, activeTask, player, personas, chatHistories, setChatHistories,
    discoveredClues, addDiscoveredClue, currentPuzzleState, updatePuzzleState,
    hasUnreadClues, hasUnreadPuzzles, markCluesAsRead, markPuzzlesAsRead,
    unlockedTasks, completedTasks,
    attemptSolvePuzzle,
    updateSvmStatus, setActiveTask, updatePlayerCredits, updatePlayerInventory, updatePlayerReputation,
    updatePersonaFavorability, // And also in the dependency array
    getWorldState
  ]);
  
  return (
    <WorldStateContext.Provider value={value}>
      {children}
    </WorldStateContext.Provider>
  );
}
