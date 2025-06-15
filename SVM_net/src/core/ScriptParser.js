// src/core/ScriptParser.js
// Final attempt to fix placeholder/condition logic

import Ajv from 'ajv';
import { publish } from '../services/EventService';
import { normalizePersonaId } from '../utils/personaUtils.js';

const scriptSchema = null; // Schema validation disabled

/**
 * Safely gets a value from an object using a dot-separated path string.
 * Handles array access by ID using bracket notation like 'svms[7].name'.
 * @param {object} obj - The object to traverse.
 * @param {string} path - The dot/bracket notation path.
 * @returns {any} The value found, or undefined if path is invalid.
 */
function getPathValue(obj, path) {
    if (!path || typeof path !== 'string' || !obj) {
        return undefined;
    }

    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length; i++) {
        if (current === undefined || current === null) {
            // console.warn(`Cannot access property on null/undefined for path: ${path}`);
            return undefined; 
        }

        const part = parts[i];
        const indexMatch = part.match(/^(\w+)\[(\d+)\]$/); // e.g., svms[7] or player.inventory[0]

        if (indexMatch) {
            const [_, baseName, indexStr] = indexMatch;
            const idOrIndex = parseInt(indexStr, 10);

            // Access the base property (e.g., 'svms' or 'inventory')
            const targetArrayOrObject = current[baseName];

            if (targetArrayOrObject === undefined || targetArrayOrObject === null) {
                // console.warn(`Cannot find base property '${baseName}' in path '${path}'`);
                return undefined;
            }

            if (Array.isArray(targetArrayOrObject)) {
                // Find item by ID in array (assuming index means ID for relevant arrays like svms)
                // For inventory, treat index as array index
                if (baseName === 'svms') { // Special handling for svms array (lookup by ID)
                     current = targetArrayOrObject.find(item => item && item.id === idOrIndex);
                } else { // Assume standard array index access otherwise (e.g., inventory[0])
                     current = targetArrayOrObject[idOrIndex];
                }

            } else if (typeof targetArrayOrObject === 'object' && targetArrayOrObject[idOrIndex] !== undefined) {
                 // Handle case where tests might use object keyed by ID
                 current = targetArrayOrObject[idOrIndex]; // Access object by key
            } else {
                // console.warn(`Property '${baseName}' is not an array or object with key/id '${idOrIndex}' in path '${path}'`);
                return undefined; // Cannot find by ID
            }

            if (current === undefined) {
                // console.warn(`Item with index/id '${idOrIndex}' not found in '${baseName}' for path '${path}'`);
                return undefined; // Item not found
            }
        } else {
            // Regular property access
            if (!Object.prototype.hasOwnProperty.call(current, part)) {
                // console.warn(`Property '${part}' not found in path '${path}'`);
                return undefined;
            }
            current = current[part];
        }
    }
    return current;
}


export default class ScriptParser {
  tree = null;
  current = null;
  finished = false;
  _stateUpdatePublished = false;
  lastEventData = null; // Store data from the event that caused the last step transition

  constructor(executionTree, initialStepIdOverride = null) {
    if (executionTree && executionTree.scriptId && executionTree.steps && executionTree.entry !== undefined) {
        this.tree = executionTree;
        let startStepId = this.tree.entry; // Default to script's entry point

        if (initialStepIdOverride !== null && typeof initialStepIdOverride !== 'undefined') {
            if (this.tree.steps[initialStepIdOverride]) {
                console.log(`[ScriptParser constructor] Overriding entry point for script ${this.tree.scriptId}. Original entry: ${this.tree.entry}, New start step: ${initialStepIdOverride}`);
                startStepId = initialStepIdOverride;
            } else {
                console.warn(`[ScriptParser constructor] initialStepIdOverride ${initialStepIdOverride} not found in script ${this.tree.scriptId}. Falling back to entry point ${this.tree.entry}.`);
                // startStepId remains this.tree.entry
            }
        }
        
        this.current = startStepId;
        this.finished = this.current === null || !this.tree.steps[this.current];
        
        if (this.finished && this.current !== null) {
             console.error(`ScriptParser init error: Start step ${this.current} (either entry or override) not found in tree for ${executionTree.scriptId}`);
        } else if (!this.finished) {
            console.log(`[ScriptParser constructor] Initialized script ${this.tree.scriptId} to start at step ${this.current}.`);
        }
    } else {
      console.error("ScriptParser constructor called without a valid executionTree structure!", executionTree);
      this.tree = null;
      this.current = null;
      this.finished = true;
    }
  }

  static buildTreeFromData(scriptData, scriptIdForError = 'unknown') {
    if (scriptSchema) { /* ... schema validation ... */ }
    return ScriptParser._buildExecutionTreeInternal(scriptData);
  }

  static _buildExecutionTreeInternal(data) {
    const stepsSource = data?.steps;
    const isStepsObject = typeof stepsSource === 'object' && stepsSource !== null && !Array.isArray(stepsSource);
    const stepsArray = isStepsObject ? Object.values(stepsSource) : (Array.isArray(stepsSource) ? stepsSource : []);

    if (!data || !stepsSource || stepsArray.length === 0) {
      console.error(`Invalid script data in buildExecutionTree: 'steps' is missing, empty, or not a valid array/object.`, data);
      return { scriptId: data?.scriptId || 'unknown', title: data?.title, trigger: data?.trigger, steps: {}, entry: null };
    }

    const firstStep = stepsArray[0];
    const entryPoint = data.entry !== undefined ? data.entry : (firstStep && typeof firstStep.stepId !== 'undefined' ? firstStep.stepId : null);

    const tree = {
      scriptId: data.scriptId,
      title: data.title,
      trigger: data.trigger,
      steps: {},
      entry: entryPoint
    };

    if (data.entry !== undefined) {
      console.log(`Script ${data.scriptId} has entry point set to ${data.entry} during tree building.`);
    } else {
      console.log(`No entry point defined for script ${data.scriptId} in data, using first step ${entryPoint || 'none'}.`);
    }

    if (tree.entry === null && stepsArray.length > 0) {
        console.warn(`First step in script ${data.scriptId} is invalid or missing stepId.`);
    }

    stepsArray.forEach(step => {
      if (!step || typeof step.stepId === 'undefined') {
         console.warn(`Skipping invalid step in script ${data.scriptId}:`, step);
         return;
      }
      tree.steps[step.stepId] = {
        ...step,
        choices: step.choices || null, // <--- 新增
        next: ScriptParser._resolveInternal(step, 'nextStep'),
        onTrue: ScriptParser._resolveInternal(step, 'nextStepOnTrue'),
        onFalse: ScriptParser._resolveInternal(step, 'nextStepOnFalse'),
        onAccept: ScriptParser._resolveInternal(step, 'nextStepOnAccept'),
        onDecline: ScriptParser._resolveInternal(step, 'nextStepOnDecline')
      };
    });
    return tree;
  }

  static _resolveInternal(step, key) {
    const value = step[key];
    // Allow both number and non-empty string types for step IDs
    if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) {
      return value;
    }
    // Handle endScript case where the key (like nextStep) might be legitimately undefined
    if (step.endScript === true && typeof value === 'undefined') {
      return null;
    }
    // If value is an empty string or any other type not handled (e.g. undefined when not endScript), return null
    return null;
  }
 
  _stepRequiresInteraction(stepType) {
      return ['dialogue', 'aiDialogue', 'waitForEvent', 'branch', 'aiDecision'].includes(stepType);
  }

  _isInteractionEventForStep(step, eventName, data = {}) {
      if (!step) return false;
      const worldState = data?.worldState || {};
      switch (step.type) {
          case 'dialogue':
          case 'aiDialogue': return eventName === 'dialogueClosed';
          case 'waitForEvent':
              if (eventName !== step.eventName) return false;
              if (step.condition) {
                  return this._evaluateConditionClause(step.condition, worldState, data);
              }
              return true;
          case 'branch': return eventName === 'scriptStep';
          case 'aiDecision': return eventName === 'aiDecisionResult';
          default: return false;
      }
  }

  getCurrentStep() {
    if (this.finished || !this.tree || this.current === null || !this.tree.steps[this.current]) {
      if (!this.finished && this.current !== null) {
         this.finished = true;
      }
      return null;
    }
    return this.tree.steps[this.current];
  }

  notify(eventName, data = {}) {
     console.log(`[ScriptParser NOTIFY CALLED] Current step ID before processing: ${this.current}, Event: ${eventName}, Script ID: ${this.tree?.scriptId}`); // ADD THIS LINE
     // Log entry state
     // console.log(`[ScriptParser ENTRY] Event: '${eventName}', Current Step ID: ${this.current}, Finished: ${this.finished}`); // Original log, can be kept or removed

     if (this.finished) {
         console.log(`[ScriptParser EXIT] Engine finished.`);
         return;
     }

     const currentWorldState = data?.worldState || {};
     const eventData = data || {};

     const step = this.getCurrentStep();
     if (!step) {
         console.log(`[ScriptParser EXIT] No valid current step object found for ID: ${this.current}`);
         return;
     }

     // Use eventData from the previous step if available for condition checks
     const dataForCondition = this.lastEventData || eventData;
     // Clear lastEventData after retrieving it for use in this step's evaluation
     if (this.lastEventData) {
         // console.log(`[ScriptParser] Using lastEventData for step ${this.current}:`, this.lastEventData);
         this.lastEventData = null;
     }


     console.log(`[ScriptParser] Current step: ${this.current}, Type: ${step.type}, Event: ${eventName}`);

     let next = null;
     this._stateUpdatePublished = false;

     // --- 新增：处理玩家选择事件 ---
     if (step.choices && eventName === 'playerChoiceMade') {
       const chosenNextStep = eventData.nextStep;
       // 验证玩家的选择是否合法
       if (step.choices.some(c => c.nextStep === chosenNextStep)) {
         console.log(`[ScriptParser] Player choice made. Proceeding to step: ${chosenNextStep}`);
         next = chosenNextStep;
       } else {
         console.warn(`[ScriptParser] Invalid choice received: ${chosenNextStep}. Ignoring.`);
       }
     }
     // --------------------------------

     // --- Resolve Placeholders (Just before use) ---
     let resolvedPrompt = step.prompt;
     if ((step.type === 'aiDialogue' || step.type === 'aiDecision') && step.prompt) {
         resolvedPrompt = this._resolvePlaceholders(step.prompt, currentWorldState, eventData);
         if (resolvedPrompt !== step.prompt) {
             this.tree.steps[this.current] = { ...step, prompt: resolvedPrompt };
         }
     }
     let resolvedText = step.text;
      if (step.type === 'dialogue' && step.text) {
          resolvedText = this._resolvePlaceholders(step.text, currentWorldState, eventData);
          if (resolvedText !== step.text) {
              this.tree.steps[this.current] = { ...step, text: resolvedText };
          }
      }


     // --- Process Step Logic ---
     switch (step.type) {
       case 'dialogue':
         // 如果当前步骤有选项，它不应该通过 dialogueClosed 事件推进。
         // 它必须等待 'playerChoiceMade' 事件。
         if (step.choices) {
           // 什么都不做，等待选择事件
         } else if (eventName === 'dialogueClosed') {
           next = step.next;
         }
         break;
       case 'aiDialogue':
         if (eventName === 'scriptStep') {
           // 发布 requestAIDialogue 事件时，尝试包含聊天历史记录
           // 由于 ScriptParser 无法直接访问聊天历史记录，我们需要通过 EventService 获取
           const normalizedAiDialoguePersona = normalizePersonaId(step.persona);
           const normalizedAiDialogueOwner = normalizePersonaId(step.owner || step.persona);
           publish('requestAIDialogue', {
             scriptId: this.tree.scriptId,
             stepId: this.current,
             prompt: resolvedPrompt,
             persona: normalizedAiDialoguePersona,
             owner: normalizedAiDialogueOwner,
             history: [],
             audio: step.audio || null // 包含音频字段
           }, eventName);
         } else if (eventName === 'dialogueClosed') {
           next = step.next;
         }
         break;
       case 'UNLOCK_TASK':
         if (!this._stateUpdatePublished) {
           if (step.taskId) {
             publish('requestWorldStateUpdate', {
               target: 'tasks',
               action: 'unlock',
               payload: {
                 taskId: step.taskId
               }
             }, eventName);
             this._stateUpdatePublished = true;
             console.log(`[ScriptParser] Step ${this.current}: Requested to unlock task '${step.taskId}'.`);
           } else {
             console.warn(`[ScriptParser] Step ${this.current} (UNLOCK_TASK): Missing taskId.`);
           }
         }
         next = step.nextStep;
         break;
       case 'WAIT_FOR_TASK_COMPLETED':
         const taskIdToWaitFor = step.taskId;
         let isTaskCompleted = false;

         // Check if the current event is the 'task_completed' event for the specific task this step is waiting for
         if (eventName === 'task_completed' && eventData && eventData.taskId === taskIdToWaitFor) {
           console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_TASK_COMPLETED): Received 'task_completed' event for target task '${taskIdToWaitFor}'.`);
           isTaskCompleted = true;
         } else {
           // Check the current world state to see if the task is already completed
           const taskState = currentWorldState.completedTasks && currentWorldState.completedTasks.find(t => t.taskId === taskIdToWaitFor);
           if (taskState) {
             console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_TASK_COMPLETED): Task '${taskIdToWaitFor}' is already marked as completed in worldState.`);
             isTaskCompleted = true;
           }
         }

         if (isTaskCompleted) {
           next = step.nextStep;
           console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_TASK_COMPLETED): Task '${taskIdToWaitFor}' is completed. Proceeding to step '${next}'.`);
           // Store event data if this step was unblocked by the task_completed event
           if (eventName === 'task_completed' && eventData && eventData.taskId === taskIdToWaitFor) {
             this.lastEventData = eventData;
           }
         } else {
           // Task is not completed
           if (typeof step.stepIdOnWait !== 'undefined' && step.stepIdOnWait !== null) {
             next = step.stepIdOnWait;
             console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_TASK_COMPLETED): Task '${taskIdToWaitFor}' not completed. Diverting to stepIdOnWait: '${next}'.`);
           } else {
             // No stepIdOnWait, so the script pauses on this step
             console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_TASK_COMPLETED): Task '${taskIdToWaitFor}' not completed. Pausing and waiting for 'task_completed' event.`);
           }
         }
         break;
       case 'waitForEvent':
         // Ensure the event name matches what the step is waiting for
         if (eventName === step.eventName) {
           // Check condition using the actual event data that arrived
           console.log(`[ScriptParser] waitForEvent received matching event '${eventName}' at step ${this.current}. Evaluating condition with eventData:`, eventData);
           if (!step.condition || this._evaluateConditionClause(step.condition, currentWorldState, eventData)) { // Use current eventData here
               console.log(`[ScriptParser] waitForEvent '${eventName}' condition PASSED at step ${this.current}.`);
               next = step.nextStep;
               // Store the event data that satisfied this wait, so the *next* step can use it
               this.lastEventData = eventData;
               // console.log(`[ScriptParser] Storing lastEventData for step ${next}:`, eventData);
           } else {
               console.log(`[ScriptParser] waitForEvent '${eventName}' received, but condition FAILED at step ${this.current}. Condition:`, step.condition);
           }
         } else {
             // Log only if the current step IS a waitForEvent, but the incoming event doesn't match
             if (step.type === 'waitForEvent') {
                console.log(`[ScriptParser] waitForEvent ignored event '${eventName}' (waiting for '${step.eventName}') at step ${this.current}`);
             }
         }
         break;
       case 'branch':
         // Evaluate condition using dataForCondition (might be from previous event)
         const finalResult = this._evaluateConditionClause(step.condition, currentWorldState, dataForCondition);
         console.log(`[ScriptParser] Branch step ${this.current} condition result: ${finalResult}`); // Log branch result
         next = finalResult ? step.nextStepOnTrue : step.nextStepOnFalse;
         break;
       case 'updateWorldState':
         if (!this._stateUpdatePublished) {
           let resolvedValue = step.value;
           if (typeof resolvedValue === 'string') {
             resolvedValue = this._resolvePlaceholders(resolvedValue, currentWorldState, eventData);
           } else if (typeof resolvedValue === 'object' && resolvedValue !== null) {
             resolvedValue = this._resolveObjectPlaceholders(resolvedValue, currentWorldState, eventData);
           }
           
           let eventPayload = {
             target: step.target,
             id: step.id,
             property: step.property,
             value: resolvedValue,
             merge: resolvedValue?._update_ === true
           };

           if (step.target === 'persona' && step.id) {
             const authoritativePersonaId = normalizePersonaId(step.id);
             if (authoritativePersonaId !== step.id) {
               console.log(`[ScriptParser] Normalizing persona ID for updateWorldState: '${step.id}' to '${authoritativePersonaId}'`);
             }
             eventPayload.id = authoritativePersonaId;
           }
           
           console.log(`[ScriptParser] Publishing 'requestWorldStateUpdate' with payload:`, JSON.stringify(eventPayload));
           publish('requestWorldStateUpdate', eventPayload, eventName);
           this._stateUpdatePublished = true;
         }
         next = step.nextStep; // Use nextStep consistently
         break;
       case 'UNLOCK_CLUE':
         if (!this._stateUpdatePublished) {
           if (step.clueId) {
             publish('requestWorldStateUpdate', {
               target: 'discoveredClues',
               action: 'addById',
               payload: {
                 clueId: step.clueId
               }
             }, eventName); // Pass eventName for context if needed by publish
             this._stateUpdatePublished = true;
             console.log(`[ScriptParser] Step ${this.current}: Requested to unlock clue '${step.clueId}'.`);
           } else {
             console.warn(`[ScriptParser] Step ${this.current} (UNLOCK_CLUE): Missing clueId.`);
           }
         }
         next = step.nextStep; // UNLOCK_CLUE proceeds to nextStep
         break;
       case 'aiDecision':
         if (eventName === 'scriptStep') {
           const normalizedAiDecisionPersona = normalizePersonaId(step.persona);
           publish('requestAIDecision', {
             scriptId: this.tree.scriptId,
             stepId: this.current,
             prompt: resolvedPrompt,
             persona: normalizedAiDecisionPersona,
             options: step.options,
             defaultNextStep: step.defaultNextStep
           }, eventName);
         } else if (eventName === 'aiDecisionResult' && eventData?.nextStep) {
           next = eventData.nextStep; // This comes from AIService
           console.log(`[ScriptParser] AI decision result received for step ${this.current}, transitioning to step ${next}`);
         }
         // Do not use defaultNextStep immediately for other events; wait for aiDecisionResult
         // This prevents premature transition before AI decision is received
         break;
       case 'DISPLAY_SVM_CONTENT':
         if (!this._stateUpdatePublished) {
           if (step.svmId && typeof step.contentValueOrKey === 'string') {
             let displayValue = null;
             if (step.contentType === 'text') {
               displayValue = {
                 type: 'text',
                 content: step.contentValueOrKey
               };
               console.log(`[ScriptParser] Step ${this.current}: Requested to display text on SVM '${step.svmId}': "${step.contentValueOrKey}"`);
             } else if (step.contentType === 'image') {
               displayValue = {
                 type: 'image', // Indicate to SvmDetailView this is an image type
                 mediaKey: step.contentValueOrKey // Pass the mediaKey
               };
               console.log(`[ScriptParser] Step ${this.current}: Requested to display image with mediaKey '${step.contentValueOrKey}' on SVM '${step.svmId}'.`);
             } else if (step.contentType === 'audio') {
               displayValue = {
                 type: 'audio', // Indicate to SvmDetailView this is an audio type
                 mediaKey: step.contentValueOrKey // Pass the mediaKey for audio
               };
               console.log(`[ScriptParser] Step ${this.current}: Requested to play audio with mediaKey '${step.contentValueOrKey}' on SVM '${step.svmId}'.`);
             }

             if (displayValue) {
               publish('requestWorldStateUpdate', {
                 target: 'svm',
                 id: step.svmId,
                 property: 'currentDisplay',
                 value: displayValue
               }, eventName);
               this._stateUpdatePublished = true;
             } else {
               console.warn(`[ScriptParser] Step ${this.current} (DISPLAY_SVM_CONTENT): Unsupported contentType ('${step.contentType}') or invalid parameters. SVM ID: ${step.svmId}, ContentType: ${step.contentType}, ContentValue: ${step.contentValueOrKey}`);
             }
           } else {
             // This else handles missing svmId or contentValueOrKey
             console.warn(`[ScriptParser] Step ${this.current} (DISPLAY_SVM_CONTENT): Missing svmId or contentValueOrKey. SVM ID: ${step.svmId}, ContentValue: ${step.contentValueOrKey}`);
           }
         }
         next = step.nextStep; // Proceed to the next step
         break;
       case 'ACTIVATE_PUZZLE': // New action type for Step 3.3
         if (!this._stateUpdatePublished) {
           if (step.puzzleId && typeof step.puzzleId === 'string') {
             publish('requestWorldStateUpdate', {
               target: 'puzzleControl', // Changed target to 'puzzleControl' for consistency with WorldStateContext
               action: 'activatePuzzle',    // The action to be performed by WorldStateContext
               payload: {
                 puzzleId: step.puzzleId
               }
             }, eventName);
             this._stateUpdatePublished = true;
             console.log(`[ScriptParser] Step ${this.current}: Requested to activate puzzle '${step.puzzleId}'.`);
           } else {
             console.warn(`[ScriptParser] Step ${this.current} (ACTIVATE_PUZZLE): Missing or invalid puzzleId.`);
           }
         }
         next = step.nextStep;
         break;
       case 'WAIT_FOR_PUZZLE_SOLVED': // New action type for Step 3.4
         const puzzleIdToWaitFor = step.puzzleId;
         let isPuzzleSolved = false;

         // Check if the current event is the 'puzzle_solved' event for the specific puzzle this step is waiting for.
         if (eventName === 'puzzle_solved' && eventData && eventData.puzzleId === puzzleIdToWaitFor) {
           console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_PUZZLE_SOLVED): Received 'puzzle_solved' event for target puzzle '${puzzleIdToWaitFor}'.`);
           isPuzzleSolved = true;
         } else {
           // If not directly triggered by the event, check the current world state.
           // This handles cases where the script lands on this step and the puzzle is already solved,
           // or if other events trigger a re-evaluation.
           const puzzleState = currentWorldState.currentPuzzleState && currentWorldState.currentPuzzleState[puzzleIdToWaitFor];
           if (puzzleState && puzzleState.status === 'solved') {
             console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_PUZZLE_SOLVED): Puzzle '${puzzleIdToWaitFor}' is already marked as 'solved' in worldState.`);
             isPuzzleSolved = true;
           }
         }

         if (isPuzzleSolved) {
           next = step.nextStep;
           console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_PUZZLE_SOLVED): Puzzle '${puzzleIdToWaitFor}' is solved. Proceeding to step '${next}'.`);
           // If this step was unblocked specifically by the 'puzzle_solved' event, store its data.
           if (eventName === 'puzzle_solved' && eventData && eventData.puzzleId === puzzleIdToWaitFor) {
               this.lastEventData = eventData;
               // console.log(`[ScriptParser] Storing lastEventData from puzzle_solved for next step:`, eventData);
           }
         } else {
           // Puzzle is not solved.
           if (typeof step.stepIdOnWait !== 'undefined' && step.stepIdOnWait !== null) {
             next = step.stepIdOnWait;
             console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_PUZZLE_SOLVED): Puzzle '${puzzleIdToWaitFor}' not solved. Diverting to stepIdOnWait: '${next}'.`);
           } else {
             // No stepIdOnWait, so the script effectively "pauses" on this step.
             // 'next' remains null for this notify call. It will re-evaluate when another event comes in.
             console.log(`[ScriptParser] Step ${this.current} (WAIT_FOR_PUZZLE_SOLVED): Puzzle '${puzzleIdToWaitFor}' not solved. Pausing and waiting for 'puzzle_solved' event.`);
           }
         }
         break;
       case 'UPDATE_PUZZLE_STATE': // New action type for Step 4.1
         if (!this._stateUpdatePublished) {
           if (step.puzzleId && typeof step.puzzleId === 'string' &&
               step.path && typeof step.path === 'string' &&
               typeof step.value !== 'undefined') {
             
             let resolvedValue = step.value;
             // Resolve placeholders in value if it's a string or an object containing strings
             if (typeof resolvedValue === 'string') {
               resolvedValue = this._resolvePlaceholders(resolvedValue, currentWorldState, eventData);
             } else if (typeof resolvedValue === 'object' && resolvedValue !== null) {
               resolvedValue = this._resolveObjectPlaceholders(resolvedValue, currentWorldState, eventData);
             }

             publish('requestWorldStateUpdate', {
               target: 'puzzleStateProperty', // This target should be handled by WorldStateContext
               action: 'set', // The action to perform
               payload: {
                 puzzleId: step.puzzleId,
                 path: step.path,       // Dot-notation path within the puzzle object e.g., "variables.keyFound"
                 value: resolvedValue   // The new value for the path
               }
             }, eventName);
             this._stateUpdatePublished = true;
             console.log(`[ScriptParser] Step ${this.current} (UPDATE_PUZZLE_STATE): Requested update for puzzle '${step.puzzleId}', path '${step.path}' to value:`, resolvedValue);
           } else {
             console.warn(`[ScriptParser] Step ${this.current} (UPDATE_PUZZLE_STATE): Missing or invalid parameters. Required: puzzleId, path, value. Received step:`, step);
           }
         }
         next = step.nextStep; // Proceed to the next step after publishing
         break;

       case 'TRIGGER_DATA_SYNC': // New action type for requesting data synchronization
         // This action primarily publishes an event that other services (like WorldStateContext) will listen to.
         // It doesn't directly modify world state here but signals an intent.
         // We can use _stateUpdatePublished to ensure the event is published only once if the step is re-evaluated
         // without advancing, though for a sync trigger, multiple triggers might be acceptable depending on design.
         // For consistency with other event-publishing actions, let's manage it.
         if (!this._stateUpdatePublished) {
           console.count('[ScriptParser] TRIGGER_DATA_SYNC action execution count'); // Add this log
           console.log(`[ScriptParser] Step ${this.current} (${step.type}): Publishing SYNC_DATA_TO_BACKEND event with payload:`, step.payload || {});
           publish('SYNC_DATA_TO_BACKEND', step.payload || {}); // step.payload can be used to pass options
           this._stateUpdatePublished = true;
         }
         next = step.nextStep;
         break;

       default:
         // console.warn(`[ScriptParser] Unknown step type: ${step.type} at step ${this.current}`);
         break;
     }

     // --- Advance Step ---
     const previousStepId = this.current;
     if (next !== null && typeof next !== 'undefined') {
       this.current = next;
       const nextStepExists = this.tree.steps[this.current];
       if (!nextStepExists) {
         console.error(`ScriptEngine Error: Invalid next stepId ${this.current} from step ${previousStepId}. Finishing script.`);
         this.finished = true; this.current = null;
         publish('scriptFinished', { scriptId: this.tree.scriptId });
       } else {
         console.log(`[ScriptParser] Transitioning from step ${previousStepId} to step ${this.current} due to event '${eventName}'`);
         
         const stepForPublish = { ...nextStepExists, audio: nextStepExists.audio || null };
         if (stepForPublish.persona) stepForPublish.persona = normalizePersonaId(stepForPublish.persona);
         if (stepForPublish.owner) stepForPublish.owner = normalizePersonaId(stepForPublish.owner);
         // Ensure owner fallback uses normalized persona if owner is not defined
         const finalOwner = stepForPublish.owner || stepForPublish.persona;

         publish('scriptStep', {
           scriptId: this.tree.scriptId,
           step: { ...stepForPublish, owner: finalOwner },
           worldState: currentWorldState
         });
       }
     } else if (step.choices && eventName !== 'playerChoiceMade') {
         // 如果步骤有选项，并且当前事件不是选择事件，则脚本暂停。
         // `next` 保持为 null，脚本不会前进。
         console.log(`[ScriptParser] Step ${this.current} is paused, waiting for player choice.`);
     } else if (step.endScript === true) {
       const isInteractionEvent = this._isInteractionEventForStep(step, eventName, eventData);
       if (isInteractionEvent) {
         console.log(`[ScriptParser] Script ending at step ${this.current} due to endScript flag and interaction event '${eventName}'`);
         this.finished = true; this.current = null;
         publish('scriptFinished', { scriptId: this.tree.scriptId });
       }
     }

     if (this.current === null && !this.finished) {
         this.finished = true;
         publish('scriptFinished', { scriptId: this.tree.scriptId });
     }
  }

  isFinished() { return this.finished; }
  reset() { this.current = this.tree?.entry || null; this.finished = this.current === null || !this.tree?.steps?.[this.current]; this._stateUpdatePublished = false; }

  _resolvePlaceholders(text, worldState, eventData = null) {
    if (!text || typeof text !== 'string') return text;
    if (!worldState) return text;

    const placeholderRegex = /\$\{([^}]+)\}/g;
    return text.replace(placeholderRegex, (match, path) => {
      // DEBUG LOG: Log the specific value being accessed for player.credits
      if (path === 'player.credits') {
          console.log(`[ScriptParser._resolvePlaceholders] Accessing path: ${path}, WorldState Credits:`, worldState?.player?.credits);
      }
      try {
        let sourceObject = path.startsWith('eventData.') && eventData ? eventData : worldState;
        let currentPath = path.startsWith('eventData.') ? path.substring('eventData.'.length) : path;
        let currentVal = getPathValue(sourceObject, currentPath); // Use helper

        if (currentVal === undefined || currentVal === null) return ''; // Return empty string for unresolved paths
        if (typeof currentVal === 'object') return JSON.stringify(currentVal);
        return String(currentVal);
      } catch (error) {
        console.error(`Error resolving placeholder ${match}:`, error);
        return ''; // Return empty string on error
      }
    });
  }

  _resolveObjectPlaceholders(obj, worldState, eventData = null) {
    if (!obj || typeof obj !== 'object') return obj;
    const isUpdateMarker = obj._update_ === true;
    const result = { ...obj };
    if (isUpdateMarker) delete result._update_;

    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        const value = result[key];
        if (typeof value === 'string') {
          result[key] = this._resolvePlaceholders(value, worldState, eventData);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this._resolveObjectPlaceholders(value, worldState, eventData);
        }
      }
    }
    if (isUpdateMarker) result._update_ = true; 
    return result;
  }

  // Modified to accept specific data source for evaluation
  _evaluateConditionClause(clause, worldState, dataForCondition = null) {
    // Use dataForCondition instead of eventData directly passed to notify
    const eventData = dataForCondition; // Rename for clarity within this function

    if (!worldState && !eventData) return false; // Need at least one data source

    if (clause.operator && clause.clauses) {
      // Pass the same dataForCondition down recursively
      const results = clause.clauses.map(subClause => this._evaluateConditionClause(subClause, worldState, dataForCondition));
      if (clause.operator === 'AND') return results.every(r => r === true);
      if (clause.operator === 'OR') return results.some(r => r === true);
      return false;
    }

    const { target, id, property, operator, value } = clause;
    let sourceObject;
    let remainingPropertyPath = property;

    // Determine source object based on target
    if (target === 'eventData' && eventData) {
        console.log(`[EvalCond] Target is eventData. Evaluating property: '${property}'. Event data:`, eventData); // Log eventData access
        sourceObject = eventData;
        // This check is likely unnecessary if property is just 'outcome'
        // if (property?.startsWith('eventData.')) {
        //      remainingPropertyPath = property.substring('eventData.'.length);
        // }
    } else if (target && worldState?.[target]) {
        sourceObject = worldState[target];
        // Navigate into sub-object if ID is provided
        if (id !== undefined && typeof sourceObject === 'object' && sourceObject !== null) {
            // Special handling for 'svms' array: find by id
            if (target === 'svms' && Array.isArray(sourceObject)) {
                 sourceObject = sourceObject.find(item => item?.id === id);
            } 
            // Handling for objects keyed by id (like in some tests)
            else if (sourceObject[id] !== undefined) { 
                 sourceObject = sourceObject[id];
            } else { 
                 return false; // ID not found in object or array
            }
        }
    } else { 
        return false; // Invalid target or missing state
    }

    if (sourceObject === undefined || sourceObject === null) return false; // Target object (or sub-object) not found

    // Get the final value using the remaining path
    let actualValue = getPathValue(sourceObject, remainingPropertyPath);

    // Perform comparison
    switch (operator) {
      case '===': case '==': return actualValue === value;
      case '!==': case '!=': return actualValue !== value;
      case '>': return actualValue > value;
      case '>=': return actualValue >= value;
      case '<': return actualValue < value;
      case '<=': return actualValue <= value;
      case 'contains':
        if (Array.isArray(actualValue)) {
          if (typeof value === 'object' && value?.id !== undefined) {
            return actualValue.some(item => item?.id === value.id);
          }
          return actualValue.includes(value);
        } else if (typeof actualValue === 'string') {
          return actualValue.includes(value);
        }
        return false;
      case 'not_contains':
        if (Array.isArray(actualValue)) {
          if (typeof value === 'object' && value?.id !== undefined) {
            return !actualValue.some(item => item?.id === value.id);
          }
          return !actualValue.includes(value);
        } else if (typeof actualValue === 'string') {
          return !actualValue.includes(value);
        }
        return true;
      default:
        console.warn(`Unsupported operator: ${operator}`);
        return false;
    }
  }
}