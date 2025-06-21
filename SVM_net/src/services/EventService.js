// src/services/EventService.js
// Handles event pub/sub and manages active script engines using an event queue.
import ScriptParser from '../core/ScriptParser';
import jsyaml from 'js-yaml'; // Import jsyaml for parsing YAML files
import { getAIDialogueCompletion, getAIDecisionCompletion } from './AIService';

// --- State ---
const subscribers = {};
const activeEngines = new Map(); // Map<scriptId, ScriptParser instance>
let eventQueue = []; // Queue for events to be published asynchronously
let isQueueProcessingScheduled = false; // Flag to prevent multiple setTimeout calls
// Add getter logic back
let worldStateGetter = () => {
    // console.warn("worldStateGetter not registered in EventService!"); // Less noisy default
    return {};
return {};
};
let initialActiveEnginesFromStorage = new Map(); // For Stage C: Store initial progress from ScriptContext

// For Stage C: Function for ScriptContext to register initial loaded progress
export function registerInitialActiveEngines(initialEngines) {
  if (!worldStateGetter) {
    console.error("[EventService] Cannot register initial engines because worldStateGetter is not set.");
    return;
  }
  if (!(initialEngines instanceof Map)) {
      console.warn("[EventService] registerInitialActiveEngines received non-Map data:", initialEngines);
      return;
  }

  console.log('[EventService] Initial active engines from storage being re-activated:', initialEngines);
  for (const [scriptId, stepDetails] of initialEngines.entries()) {
    if (scriptId && stepDetails?.stepId) {
      // Call activateScriptEngine to correctly re-create the engine.
      // Note: We pass null for scriptData to let the function load it itself.
      activateScriptEngine(scriptId, null, stepDetails.stepId).catch(error => {
          console.error(`[EventService] Failed to re-activate engine for script '${scriptId}' from storage:`, error);
      });
    }
  }
}
// Store user inputs for AI decision context, associated with personas or script steps
let userInputs = {};
subscribe('userInputUpdated', (data) => {
    if (data.persona) { // Restore the missing 'if (data.persona)' condition
      // Normalize persona key to avoid mismatches due to spaces or formatting
      const normalizedPersona = data.persona.replace(/\s+/g, '');
      userInputs[normalizedPersona] = data.input;
      console.log(`EventService: Received user input update event for persona "${data.persona}" (normalized: "${normalizedPersona}") at ${new Date().toISOString()}: "${data.input}"`);
    } else {
      userInputs['default'] = data.input;
      console.log(`EventService: Received default user input update event at ${new Date().toISOString()}: "${data.input}"`);
    }
  });
  // Debug event to log current state of user inputs
  subscribe('debugUserInputs', () => {
    console.log(`EventService: Current user inputs state at ${new Date().toISOString()}:`, userInputs);
  });

// --- Registration Function ---
export function registerWorldStateGetter(getter) {
   if (typeof getter === 'function') {
       worldStateGetter = getter;
       console.log("EventService: World state getter registered.");
   } else {
       console.error("EventService: Invalid world state getter provided.");
   }
}

// --- Pub/Sub Functions ---

export function subscribe(eventName, callback) {
  if (!subscribers[eventName]) subscribers[eventName] = [];
  subscribers[eventName].push(callback);
}

export function unsubscribe(eventName, callback) {
  if (!subscribers[eventName]) return;
  subscribers[eventName] = subscribers[eventName].filter(cb => cb !== callback);
}

/**
 * Publish an event. Notifies direct subscribers immediately,
 * forwards to active engines (injecting current worldState),
 * and queues any subsequent events for async processing.
 * @param {string} eventName
 * @param {any} data - Original event data (should NOT contain worldState)
 * @param {string | null} sourceEvent - Optional source event name to prevent loops
 * @returns {Promise<void>}
 */
export function publish(eventName, data, sourceEvent = null) {
  // Log entry immediately
  console.log(`[EventService PUBLISH ENTRY] Received event: '${eventName}'`);
  return new Promise((resolve) => {
    if (sourceEvent && sourceEvent === eventName) {
      resolve();
      return;
    }
    // console.log(`[Event Published] Event: ${eventName}, Data:`, data);

    // 1. Notify regular subscribers immediately
    const subs = subscribers[eventName] || [];
    subs.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`Error in subscriber for event ${eventName}:`, e);
      }
    });

    // 2. Forward event to active script engines
    const eventsToPublishLater = [];
    // Get the CURRENT world state using the registered getter
    const currentWorldState = worldStateGetter();

    // Log before iterating engines
    console.log(`[EventService] Publishing event '${eventName}'. Data:`, JSON.stringify(data), `Active engines count: ${activeEngines.size}`); // Stringify data for better logging

    // Prevent duplicate engine initialization by skipping engine notification for game_start
    // The script loading is handled by the 'game_start' subscriber directly.
    if (eventName === 'game_start') {
      console.log(`[EventService] Skipping engine notification loop for 'game_start' event.`);
    } else {
      console.log(`[EventService] Entering engine notification loop for event '${eventName}'...`);
      activeEngines.forEach((engine, scriptId) => { // <<<< ITERATES OVER ENGINES
        // Log each engine being notified
        console.log(`[EventService] --> Notifying engine '${scriptId}' with event '${eventName}'.`);
        if (!engine.isFinished()) {
          // Prevent specific internal events from being re-processed by the script engine itself,
          // especially if the engine is currently on a step that might react to or re-trigger them.
          if (eventName === 'SYNC_DATA_TO_BACKEND' || eventName === 'DATA_SYNC_COMPLETE' || eventName === 'requestWorldStateUpdate') {
            console.log(`[EventService] Skipping notification of engine '${scriptId}' for internal/feedback event '${eventName}'.`);
          } else {
            const stepBeforeNotify = engine.getCurrentStep();
            const stepIdBeforeNotify = stepBeforeNotify?.stepId;
            console.log(`[EventService] Engine '${scriptId}' current step before notify: ${stepIdBeforeNotify}`);

            // Create data object for notify, INCLUDING current world state
            const notifyData = { ...(data || {}), worldState: currentWorldState };

            engine.notify(eventName, notifyData); // << Calls engine.notify
            console.log(`[EventService] Called notify on engine '${scriptId}'.`); // Log after calling notify

            const isFinishedAfterNotify = engine.isFinished();
          const stepAfterNotify = engine.getCurrentStep();
          const stepIdAfterNotify = stepAfterNotify?.stepId;

          // Handle state transitions and queue subsequent events
          if (!stepBeforeNotify && isFinishedAfterNotify) {
               activeEngines.delete(scriptId);
               eventsToPublishLater.push({ name: 'scriptFinished', data: { scriptId } });
          } else if (stepBeforeNotify && isFinishedAfterNotify) {
               activeEngines.delete(scriptId);
               eventsToPublishLater.push({ name: 'scriptFinished', data: { scriptId } });
          } else if (!isFinishedAfterNotify && stepIdAfterNotify !== stepIdBeforeNotify) {
            if (stepAfterNotify) {
               // Pass the SAME worldState snapshot used for this notify cycle
               eventsToPublishLater.push({ name: 'scriptStep', data: { scriptId, step: stepAfterNotify, worldState: currentWorldState } });
            } else {
                console.warn(`Script '${scriptId}' step changed from ${stepIdBeforeNotify} but new step is null/invalid after event '${eventName}'.`);
            }
          }
        } // End of the 'else' for the eventName check
        } else {
           console.log(`[EventService] Engine '${scriptId}' is finished, removing.`);
           activeEngines.delete(scriptId);
        }
      }); // End of activeEngines.forEach
    }

    // 3. Queue subsequent events for processing
    if (eventsToPublishLater.length > 0) {
        eventQueue.push(...eventsToPublishLater);
        scheduleQueueProcessing();
    }
    resolve(); // Resolve the promise immediately
 }); // End Promise wrapper
}

/**
 * Load a script by its trigger event.
 * @param {string} triggerEvent - The trigger event to match scripts against.
 * @returns {Promise<void>}
 */
async function loadScriptByTrigger(triggerEvent) {
 try {
   // Attempt to load scripts from local assets for packaged app
   const scriptId = getScriptIdByTrigger(triggerEvent);
   if (!scriptId) {
     console.log(`No script found with trigger event: ${triggerEvent}`);
     return;
   }
   console.log(`Loading script with trigger event: ${triggerEvent}, scriptId: ${scriptId}`);
   // Check if engine for this scriptId already exists to prevent duplicate initialization
   if (activeEngines.has(scriptId)) {
     console.log(`Script ${scriptId} is already active, skipping initialization`);
     return;
   }

   // --- Path Logic for fetching scripts ---
   // In development, Vite serves `public` at the root. So `/scripts/...` works if files are in `public/scripts/...`.
   // In production build, files from `public` are copied to the root of `dist`.
   // So, `scripts/...` (relative to index.html) or `/scripts/...` (absolute from domain root) should work.
   // We'll prioritize the absolute path from the domain root.
   
   const primaryPath = `/scripts/events/${scriptId}.yaml`;
   const alternativePath = `scripts/events/${scriptId}.yaml`; // Relative to index.html, for some server configs

   console.log(`[EventService] Attempting to fetch script '${scriptId}' from primary path: ${primaryPath}`);
   let response = await fetch(primaryPath);
   
   if (!response.ok) {
     console.log(`[EventService] Fetch failed for ${primaryPath} (Status: ${response.status}), trying alternative path: ${alternativePath}`);
     response = await fetch(alternativePath);
     if (!response.ok) {
       // One last attempt for very old structures or unusual dev server setups, though less likely needed.
       const legacyPath1 = `./public/scripts/events/${scriptId}.yaml`;
       console.log(`[EventService] Fetch failed for ${alternativePath} (Status: ${response.status}), trying legacy path: ${legacyPath1}`);
       response = await fetch(legacyPath1);
       if (!response.ok) {
          const legacyPath2 = `/public/scripts/events/${scriptId}.yaml`;
          console.log(`[EventService] Fetch failed for ${legacyPath1} (Status: ${response.status}), trying legacy path: ${legacyPath2}`);
          response = await fetch(legacyPath2);
          if (!response.ok) {
              throw new Error(`Failed to fetch script ${scriptId}.yaml from all attempted paths. Last status: ${response.statusText} for ${legacyPath2}`);
          }
       }
      }
    }
  // REMOVED THE EXTRA '}' that was here. The 'if (!response.ok)' block for primaryPath now correctly ends.
  const yamlText = await response.text();
   const scriptData = jsyaml.load(yamlText);
   if (scriptData.scriptId !== scriptId) {
     console.warn(`Loaded script ID '${scriptData.scriptId}' != requested '${scriptId}'.`);
   }
   // Ensure the entry field is set in the script data object if it exists in the YAML
   if (scriptData.hasOwnProperty('entry')) {
     console.log(`Script ${scriptData.scriptId} has entry point defined as step ${scriptData.entry}`);
   } else {
     console.log(`No entry point defined in parsed data for script ${scriptData.scriptId}, checking raw YAML`);
     // Manually extract entry from raw YAML text if not in parsed object
     // Log a snippet of YAML text for debugging
     console.log(`Raw YAML snippet for ${scriptData.scriptId}:`, yamlText.substring(0, Math.min(yamlText.length, 200)) + (yamlText.length > 200 ? "..." : ""));
     // Normalize the YAML text to handle potential encoding or line break issues
     const normalizedYamlText = yamlText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
     // Split into lines to search for entry field
     const lines = normalizedYamlText.split('\n');
     let entryFound = false;
     for (let i = 0; i < lines.length; i++) {
       const line = lines[i].trim();
       console.log(`Line ${i + 1}: "${line}"`);
       const entryMatch = line.match(/^[^#]*entry\s*:\s*(\d+)/i);
       if (entryMatch && entryMatch[1]) {
         scriptData.entry = parseInt(entryMatch[1], 10);
         console.log(`Extracted entry point step ${scriptData.entry} from raw YAML line ${i + 1} for script ${scriptData.scriptId}`);
         entryFound = true;
         break;
       }
     }
     if (!entryFound) {
       console.log(`No entry point found in raw YAML for script ${scriptData.scriptId}, defaulting to first step`);
     }
   }
   console.log("[EventService] Parsed Script content:", scriptData);
   // Check if engine for this scriptId already exists to prevent duplicate initialization
   const existingEngine = activeEngines.get(scriptData.scriptId);
   if (!existingEngine) {
     console.log(`[EventService] No active engine found for ${scriptData.scriptId}. Activating new engine.`);
     activateScriptEngine(scriptData.scriptId, scriptData, null); // Call activateScriptEngine only if not already active
     console.log(`[EventService] activateScriptEngine called for ${scriptData.scriptId}`);
   } else {
     console.log(`[EventService] Script ${scriptData.scriptId} is already active. Skipping activation.`);
   }
 } catch (error) {
   console.error(`Failed to load script with trigger ${triggerEvent}:`, error);
   // Fallback to a hardcoded script or notify user of missing asset
   alert(`Script with trigger ${triggerEvent} could not be loaded. Ensure script files are included in the app build.`);
 }
}

/**
 * Get the script ID associated with a trigger event.
 * @param {string} triggerEvent - The trigger event to match.
 * @returns {string|null} - The script ID if found, null otherwise.
 */
function getScriptIdByTrigger(triggerEvent) {
 // This function would ideally check a configuration or metadata file to map trigger events to script IDs
 // For now, we'll use a simple mapping based on known scripts
 const triggerToScriptMap = {
   'game_start': 'HK_2085_Love_Isaac' // Reverted filename
 };
 console.log(`[EventService] Mapped trigger '${triggerEvent}' to scriptId: '${triggerToScriptMap[triggerEvent] || null}'`);
 return triggerToScriptMap[triggerEvent] || null;
}

// Subscribe to game_start event to load scripts with trigger set to game_start
subscribe('game_start', () => {
 console.log("EventService: Received game_start event, checking for scripts to load");
 loadScriptByTrigger('game_start');
});

/**
 * Manually activate a script engine with the raw script data object.
 * @param {string} scriptId
 * @param {object} scriptData - The raw script data object.
 * @returns {Promise<void>}
 */
export async function activateScriptEngine(scriptId, scriptData, initialStepIdOverride) {
  if (!scriptId) {
    console.error("activateScriptEngine requires a scriptId.");
    throw new Error("activateScriptEngine requires a scriptId.");
  }

  // Use the provided getWorldState or fallback to the module-level getter.
  const finalGetWorldState = worldStateGetter;

  try {
    let data = scriptData;
    // If scriptData is not provided, fetch it.
    if (!data) {
      console.log(`[EventService] scriptData for '${scriptId}' is null, fetching...`);
      // This logic is simplified from loadScriptByTrigger. A more robust implementation
      // would check multiple paths or have a centralized fetcher.
      const path = `/scripts/events/${scriptId}.yaml`;
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch script ${scriptId}.yaml from path: ${path} (Status: ${response.status})`);
      }
      const yamlText = await response.text();
      data = jsyaml.load(yamlText);
    }

    if (!data) {
        throw new Error(`Could not load script data for ${scriptId}`);
    }

    const executionTree = ScriptParser.buildTreeFromData(data, scriptId);
    if (!executionTree) {
      throw new Error(`[EventService] Failed to build execution tree for script '${scriptId}'`);
    }

    // The override is now passed directly as a parameter.
    if(initialStepIdOverride) {
        console.log(`[EventService activateScriptEngine] An initialStepIdOverride was provided for script ${scriptId}: ${initialStepIdOverride}`);
    }

    console.log('[EventService] About to instantiate ScriptParser.');
    const engine = new ScriptParser(executionTree, initialStepIdOverride);
    engine.setWorldStateGetter(finalGetWorldState); // Use the new setter

    if (engine.isFinished()) {
      console.error(`[EventService] ScriptParser initialized for '${scriptId}' but was immediately finished. Attempted start step: ${engine.current} (Override was: ${initialStepIdOverride}, Entry was: ${executionTree?.entry}).`);
      throw new Error(`ScriptParser failed to initialize or was immediately finished for script '${scriptId}' (started at step ${engine.current})`);
    }

    activeEngines.set(scriptId, engine);
    console.log(`Script engine created and activated for '${scriptId}'`);

    const firstStep = engine.getCurrentStep();
    if (firstStep) {
      const initialState = finalGetWorldState();
      eventQueue.push({ name: 'scriptStep', data: { scriptId, step: firstStep, worldState: initialState } });
      scheduleQueueProcessing();
    }
    // Async function resolves automatically
  } catch (e) {
    console.error(`Error during ScriptParser instance creation or activation for '${scriptId}':`, e);
    // Re-throw the error to be caught by the caller (e.g., in registerInitialActiveEngines)
    throw e;
  }
}

// processAIDialogue, processAIDecision, setupAIEventHandlers remain the same

/**
 * Process AI Dialogue request
 * @param {object} data - The event data containing prompt, persona, etc.
 * @param {string} apiKey - The OpenRouter API key
 * @returns {Promise<void>}
 */
export async function processAIDialogue(data, provider, apiKey, language = 'en') { // Signature updated
  try {
    if (!data || !data.prompt) {
      console.error("Invalid data for AI dialogue request:", data);
      return;
    }
    console.log("[EventService] Processing AI dialogue request. Raw data:", JSON.stringify(data)); // Log raw data
    const persona = data.persona;
    const owner = data.owner;
    console.log(`[EventService] Extracted - Persona: "${persona}", Owner: "${owner}"`); // Log extracted values before fallback
    const finalCharacter = persona || 'AI';
    const finalOwner = owner || persona || 'AI'; // Determine final owner with fallback
    console.log(`[EventService] Determined - Final Character: "${finalCharacter}", Final Owner: "${finalOwner}"`); // Log final values

    const { appendLanguageInstruction } = await import('./AIContext.js');
    const promptWithLanguage = appendLanguageInstruction(data.prompt, language);
    // 确保即使是第一条AI消息，也包含聊天历史记录
    const chatHistory = data.history || [];
    // Call AIService.getAIDialogueCompletion with correct provider and apiKey
    const dialogueText = await getAIDialogueCompletion(
      provider, // Pass provider
      apiKey,   // Pass apiKey
      promptWithLanguage,
      persona || null,
      chatHistory
    );
    console.log(`[EventService] AI generated dialogue text: "${dialogueText}"`);
    console.log(`[EventService] Publishing 'aiDialogueReady' - Script: ${data.scriptId}, Step: ${data.stepId}, Character: ${finalCharacter}, Owner: ${finalOwner}`);
    publish('aiDialogueReady', {
      scriptId: data.scriptId,
      stepId: data.stepId,
      text: dialogueText,
      character: finalCharacter, // Use determined final character
      owner: finalOwner // Use determined final owner
    }); // End publish call for aiDialogueReady
  } catch (error) { // Correctly placed catch block
    console.error("Error processing AI dialogue:", error);
    publish('aiError', {
      scriptId: data.scriptId,
      stepId: data.stepId,
      error: error.message
    });
  }
} // End processAIDialogue function

/** // Moved JSDoc comment start here
 * Process AI Decision request
 * @param {object} data - The event data containing prompt, options, etc.
 * @param {string} apiKey - The OpenRouter API key
 * @returns {Promise<void>}
 */
export async function processAIDecision(data, provider, apiKey) { // Signature updated
  try {
    if (!data || !data.prompt || !data.options) {
      console.error("Invalid data for AI decision request:", data);
      return;
    }
    console.log(`Processing AI decision request for script: "${data.scriptId}", step: ${data.stepId} at ${new Date().toISOString()}`);
    // Enhance the prompt to include the latest user input if available and persona context if provided
    let enhancedPrompt = data.prompt;
    if (data.persona) {
      enhancedPrompt = `${data.prompt}\nContext: This decision is being made in the context of interactions with '${data.persona}'. Consider only the relevant chat history or input associated with this persona if available.`;
    }
    let relevantInput = null;
    if (data.persona) {
      // Normalize persona key to match stored input
      const normalizedPersona = data.persona.replace(/\s+/g, '');
      if (userInputs[normalizedPersona]) {
        relevantInput = userInputs[normalizedPersona];
        console.log(`Relevant user input found for persona "${data.persona}" (normalized: "${normalizedPersona}") at ${new Date().toISOString()}: "${relevantInput}"`);
      } else {
        console.log(`No user input found for persona "${data.persona}" (normalized: "${normalizedPersona}") at ${new Date().toISOString()}. Current user inputs state:`, userInputs);
      }
    }
    if (!relevantInput && userInputs['default']) {
      relevantInput = userInputs['default'];
      console.log(`Default user input used for AI decision at ${new Date().toISOString()}: "${relevantInput}"`);
    }
    if (relevantInput) {
      enhancedPrompt = `${enhancedPrompt}\nRelevant user input: "${relevantInput}"\nUse this input to evaluate the user's response or guess if relevant to the decision. Make sure your response is only the number of the nextStep for the chosen option.`;
    } else {
      enhancedPrompt = `${enhancedPrompt}\nNote: No relevant user input is available. Make a decision based on the provided options and context. Assume the user has not provided a specific guess or input if no further information is given. Make sure your response is only the number of the nextStep for the chosen option.`;
      console.log(`No relevant user input available for AI decision at ${new Date().toISOString()}. Current user inputs state:`, userInputs);
    }
    // Call AIService.getAIDecisionCompletion with correct provider and apiKey
    const nextStep = await getAIDecisionCompletion(
      provider, // Pass provider
      apiKey,   // Pass apiKey
      enhancedPrompt,
      data.options,
      data.defaultNextStep || null
    );
    publish('aiDecisionResult', {
      scriptId: data.scriptId,
      stepId: data.stepId,
      nextStep: nextStep
    });
  } catch (error) {
    console.error("Error processing AI decision:", error);
    publish('aiError', {
      scriptId: data.scriptId,
      stepId: data.stepId,
      error: error.message
    });
  }
}

/**
 * Update the latest user input for AI decision context
 * @param {object} data - Object containing input and optional persona
 */
export function updateLatestUserInput(data) {
  if (data && typeof data.input === 'string') {
    if (data.persona) {
      // Normalize persona key to avoid mismatches
      const normalizedPersona = data.persona.replace(/\s+/g, '');
      userInputs[normalizedPersona] = data.input;
      console.log(`EventService: Updated user input for persona "${data.persona}" (normalized: "${normalizedPersona}") via updateLatestUserInput at ${new Date().toISOString()}: "${data.input}"`);
    } else {
      userInputs['default'] = data.input;
      console.log(`EventService: Updated default user input via updateLatestUserInput at ${new Date().toISOString()}: "${data.input}"`);
    }
  } else {
    console.warn("EventService: Invalid user input provided for update via updateLatestUserInput.");
  }
}

/**
 * Setup AI event handlers
 * @param {string} apiKey - The OpenRouter API key
 */
export function setupAIEventHandlers(provider, apiKey, language = 'en') { // Signature updated
  if (!provider || !apiKey) { // Check both
    console.warn("AI Provider or API key not provided for AI event handlers. AI features may not work.");
    return;
  }
  subscribe('requestAIDialogue', (data) => {
    processAIDialogue(data, provider, apiKey, language); // Pass provider and apiKey
  });
  subscribe('requestAIDecision', (data) => {
    processAIDecision(data, provider, apiKey); // Pass provider and apiKey
  });
  console.log("AI event handlers set up successfully with provider:", provider);
}


/**
 * Notify active script engines directly (e.g., for UI choices).
 * Fetches current world state and includes it in the notification data.
 * @param {string} scriptId
 * @param {string} eventName
 * @param {any} eventSpecificData - Data specific to this event (e.g., { choice: 'Accept' })
 * @returns {Promise<void>}
 */
export function notifyScript(scriptId, eventName, eventSpecificData) {
 return new Promise((resolve) => {
    const engine = activeEngines.get(scriptId);
    if (engine && !engine.isFinished()) {
        // Fetch current state and combine with event-specific data
        const currentWorldState = worldStateGetter();
        const notifyData = { ...(eventSpecificData || {}), worldState: currentWorldState };

        // Log before calling notify directly
        console.log(`[EventService - notifyScript] Notifying engine '${scriptId}' directly with event '${eventName}'. Data:`, notifyData);
        engine.notify(eventName, notifyData); // Pass combined data
        console.log(`[EventService - notifyScript] Called notify on engine '${scriptId}'.`);

       // Subsequent scriptStep/scriptFinished events are handled by the main publish loop
       resolve(); // Resolve immediately
   } else {
       console.warn(`Attempted to notify non-active or finished script '${scriptId}'`);
       resolve(); // Resolve immediately if script not active/finished
   }
 }); // End Promise wrapper for notifyScript
}

/**
 * Get IDs of currently active scripts.
 * @returns {Array<string>}
 */
export function getActiveScriptContext() {
  return Array.from(activeEngines.keys());
}

/**
 * Get the current step object for a specific script.
 * @param {string} scriptId
 * @returns {object | null}
 */
export function getCurrentScriptStep(scriptId) {
   const engine = activeEngines.get(scriptId);
   if (engine && !engine.isFinished()) {
       return engine.getCurrentStep();
   }
   return null;
}

/**
 * Resets the internal state of the EventService.
 * ONLY FOR USE IN TESTING ENVIRONMENTS.
 */
export function _resetForTesting() {
    eventQueue = []; // Clear queue
    isQueueProcessingScheduled = false; // Reset flag
    // Clear subscribers
   for (const eventName in subscribers) {
       delete subscribers[eventName];
   }
   // Clear active engines
   activeEngines.clear();
   // Reset worldStateGetter to default placeholder
   worldStateGetter = () => { return {}; };
   // console.log('[EventService Test Reset] State cleared.');
}

// --- Internal Queue Processing ---

function scheduleQueueProcessing() {
    if (!isQueueProcessingScheduled) {
        isQueueProcessingScheduled = true;
        setTimeout(processEventQueue, 0);
    }
}

function processEventQueue() {
    isQueueProcessingScheduled = false;
    const currentQueue = [...eventQueue];
    eventQueue = [];

    currentQueue.forEach(event => {
        if (event) {
            try {
                // Call publish directly. It now queues further events.
                // Pass the worldState snapshot that was relevant when this event was queued
                publish(event.name, event.data);
            } catch (e) {
                console.error(`Error processing event from queue: ${event.name}`, e);
            }
        }
    });

    if (eventQueue.length > 0) {
        scheduleQueueProcessing();
    }
}