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
    this.getWorldState = () => {
      console.warn("ScriptParser: getWorldState called before it was set. Returning empty object.");
      return {};
    };
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

  setWorldStateGetter(getter) {
    if (typeof getter !== 'function') {
      console.error('ScriptParser FATAL: Attempted to set WorldStateGetter with a non-function. Received:', getter);
      return;
    }
    this.getWorldState = getter;
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
      const interactiveTypes = [
        'dialogue', // Waits for player to click through
        'aiDialogue', // Waits for AI to respond and player to close
        'waitForEvent', // Waits for an external event
        'WAIT_FOR_TASK_COMPLETED', // Waits for task completion
        'WAIT_FOR_PUZZLE_SOLVED', // Waits for puzzle completion
        'aiDecision', // Waits for AI service to respond
        'choices' // Waits for player to make a choice
      ];
      return interactiveTypes.includes(stepType);
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
    console.log(`[ScriptParser] Received event '${eventName}'. Starting processing loop.`);
    if (this.finished) {
      console.log(`[ScriptParser] Engine is finished. Ignoring event.`);
      return;
    }

    let worldState = data.worldState || (this.getWorldState ? this.getWorldState() : {});
    this.lastEventData = data || null; // Store data from the triggering event

    let canContinue = true;
    let loopCount = 0; // Safety break for the loop
    const MAX_LOOPS = 50;

    while (canContinue && loopCount < MAX_LOOPS) {
      loopCount++;
      const step = this.getCurrentStep();
      if (!step) {
        this.finished = true;
        console.log(`[ScriptParser] No current step found. Finishing script.`);
        break;
      }
      
      console.log(`[ScriptParser LOOP #${loopCount}] Processing Step: ${step.stepId}, Type: ${step.type}`);

      this._stateUpdatePublished = false; // Reset for each step in the loop
      let nextStepId = this._executeStep(step, worldState, this.lastEventData, eventName);
      
      const requiresInteraction = this._stepRequiresInteraction(step.type);

      if (requiresInteraction) {
        console.log(`[ScriptParser] Step ${step.stepId} (${step.type}) requires interaction. Pausing execution loop.`);
        canContinue = false; // Stop the loop and wait for the next event
      }
      
      if (nextStepId !== null && typeof nextStepId !== 'undefined') {
        const previousStepId = this.current;
        this.current = nextStepId;

        if (!this.tree.steps[this.current]) {
          console.error(`ScriptEngine Error: Invalid next stepId ${this.current} from step ${previousStepId}. Finishing script.`);
          this.finished = true;
          publish('scriptFinished', { scriptId: this.tree.scriptId });
          break;
        }

        console.log(`[ScriptParser] Advanced from ${previousStepId} to ${this.current}.`);
        this.lastEventData = null; // Clear event data after a transition
        eventName = 'scriptStep'; // Subsequent steps in the loop are triggered internally
        worldState = this.getWorldState ? this.getWorldState() : worldState; // Refresh world state
      } else {
        // No next step determined, so the script logic is paused.
        console.log(`[ScriptParser] No immediate next step from ${step.stepId}. Pausing.`);
        canContinue = false;
      }

      if (loopCount >= MAX_LOOPS) {
        console.error(`[ScriptParser] Maximum loop count of ${MAX_LOOPS} reached. Breaking to prevent infinite loop. Problem might be in script logic around step ${step.stepId}.`);
        this.finished = true;
        break;
      }
    }

    // After the loop, if we're on a step that needs to publish something (like a dialogue), do it now.
    const finalStep = this.getCurrentStep();
    if (finalStep && !this.finished) {
      console.log(`[ScriptParser] Loop finished. Final step is ${finalStep.stepId}. Publishing 'scriptStep' event.`);
      const stepForPublish = { ...finalStep, audio: finalStep.audio || null };
      if (stepForPublish.persona) stepForPublish.persona = normalizePersonaId(stepForPublish.persona);
      if (stepForPublish.owner) stepForPublish.owner = normalizePersonaId(stepForPublish.owner);
      const finalOwner = stepForPublish.owner || stepForPublish.persona;

      publish('scriptStep', {
        scriptId: this.tree.scriptId,
        step: { ...stepForPublish, owner: finalOwner },
        worldState: worldState
      });
    }
  }

  _executeStep(step, worldState, eventData, eventName) {
    let next = null;

    // --- Resolve Placeholders ---
    let resolvedPrompt = step.prompt;
    if ((step.type === 'aiDialogue' || step.type === 'aiDecision') && step.prompt) {
        resolvedPrompt = this._resolvePlaceholders(step.prompt, worldState, eventData);
    }
    let resolvedText = step.text;
    if (step.type === 'dialogue' && step.text) {
        resolvedText = this._resolvePlaceholders(step.text, worldState, eventData);
    }

    // --- Process Step Logic ---
    switch (step.type) {
      case 'dialogue':
      case 'choices':
        if (step.choices) {
          if (eventName === 'playerChoiceMade' && eventData.nextStep) {
            next = eventData.nextStep;
          }
        } else if (eventName === 'dialogueClosed') {
          next = step.next;
        }
        break;
      case 'aiDialogue':
        if (eventName === 'scriptStep') {
          const normalizedAiDialoguePersona = normalizePersonaId(step.persona);
          const normalizedAiDialogueOwner = normalizePersonaId(step.owner || step.persona);
          const history = worldState.chatHistories ? (worldState.chatHistories[normalizedAiDialogueOwner] || []) : [];
          publish('requestAIDialogue', {
            scriptId: this.tree.scriptId, stepId: this.current, prompt: resolvedPrompt,
            persona: normalizedAiDialoguePersona, owner: normalizedAiDialogueOwner, history: history, audio: step.audio || null
          });
        } else if (eventName === 'dialogueClosed') {
          next = step.next;
        }
        break;
      case 'WAIT_FOR_TASK_COMPLETED':
        if (eventName === 'task_completed' && eventData?.taskId === step.taskId) {
            next = step.nextStep;
        } else if (worldState.completedTasks?.find(t => t.taskId === step.taskId)) {
            next = step.nextStep;
        } else {
            next = step.stepIdOnWait !== undefined ? step.stepIdOnWait : null;
        }
        break;
      case 'waitForEvent':
        if (eventName === step.eventName && (!step.condition || this._evaluateConditionClause(step.condition, worldState, eventData))) {
            next = step.nextStep;
        }
        break;
      case 'branch':
        const finalResult = this._evaluateConditionClause(step.condition, worldState, eventData);
        next = finalResult ? step.onTrue : step.nextStepOnTrue;
        if (!finalResult) {
            next = step.onFalse !== undefined ? step.onFalse : step.nextStepOnFalse;
        }
        break;
      case 'WAIT_FOR_PUZZLE_SOLVED':
        if (eventName === 'puzzle_solved' && eventData?.puzzleId === step.puzzleId) {
            next = step.nextStep;
        } else if (worldState.currentPuzzleState?.[step.puzzleId]?.status === 'solved') {
            next = step.nextStep;
        } else {
            next = step.stepIdOnWait !== undefined ? step.stepIdOnWait : null;
        }
        break;
      case 'aiDecision':
         if (eventName === 'scriptStep') {
           const normalizedAiDecisionPersona = normalizePersonaId(step.persona);
           publish('requestAIDecision', {
             scriptId: this.tree.scriptId, stepId: this.current, prompt: resolvedPrompt,
             persona: normalizedAiDecisionPersona, options: step.options, defaultNextStep: step.defaultNextStep
           });
         } else if (eventName === 'aiDecisionResult' && eventData?.nextStep) {
           next = eventData.nextStep;
         }
         break;
      // --- Default handler for all automatic, non-interactive steps ---
      default:
        if (!this._stepRequiresInteraction(step.type)) {
          if (!this._stateUpdatePublished) {
              this._executeAutomaticAction(step, worldState, eventData);
              this._stateUpdatePublished = true;
          }
          next = step.nextStep !== undefined ? step.nextStep : step.next;
        }
        if (step.endScript === true) {
            this.finished = true;
            publish('scriptFinished', { scriptId: this.tree.scriptId });
            return null;
        }
        break;
    }
    return next;
  }

  _executeAutomaticAction(step, worldState, eventData) {
      console.log(`[ScriptParser EXECUTE AUTO] Running action for type: ${step.type}`);
      switch (step.type) {
          case 'UNLOCK_TASK':
              publish('requestWorldStateUpdate', { target: 'tasks', action: 'unlock', payload: { taskId: step.taskId } });
              console.log(`[ScriptParser] Published unlock for task '${step.taskId}'.`);
              break;
          case 'updateWorldState':
              let resolvedValue = step.value;
              if (typeof resolvedValue === 'string') resolvedValue = this._resolvePlaceholders(resolvedValue, worldState, eventData);
              else if (typeof resolvedValue === 'object' && resolvedValue !== null) resolvedValue = this._resolveObjectPlaceholders(resolvedValue, worldState, eventData);
              publish('requestWorldStateUpdate', { target: step.target, id: step.id, property: step.property, value: resolvedValue });
              break;
          case 'UNLOCK_CLUE':
              publish('requestWorldStateUpdate', { target: 'discoveredClues', action: 'addById', payload: { clueId: step.clueId } });
              break;
          case 'ACTIVATE_PUZZLE':
              publish('requestWorldStateUpdate', { target: 'puzzleControl', action: 'activatePuzzle', payload: { puzzleId: step.puzzleId } });
              break;
          case 'DISPLAY_SVM_CONTENT': { // Added block scope
              let displayValue = null;
              if (step.contentType === 'text') displayValue = { type: 'text', content: step.contentValueOrKey };
              else if (step.contentType === 'image') displayValue = { type: 'image', mediaKey: step.contentValueOrKey };
              else if (step.contentType === 'audio') displayValue = { type: 'audio', mediaKey: step.contentValueOrKey };
              if (displayValue) {
                  publish('requestWorldStateUpdate', { target: 'svm', id: step.svmId, property: 'currentDisplay', value: displayValue });
              }
              break;
            }
          case 'UPDATE_PUZZLE_STATE': { // Added block scope
              let resolvedVal = step.value;
              if (typeof resolvedVal === 'string') resolvedVal = this._resolvePlaceholders(resolvedVal, worldState, eventData);
              else if (typeof resolvedVal === 'object' && resolvedVal !== null) resolvedVal = this._resolveObjectPlaceholders(resolvedVal, worldState, eventData);
              publish('requestWorldStateUpdate', { target: 'puzzleStateProperty', action: 'set', payload: { puzzleId: step.puzzleId, path: step.path, value: resolvedVal } });
              break;
            }
          case 'TRIGGER_DATA_SYNC':
              publish('SYNC_DATA_TO_BACKEND', step.payload || {});
              break;
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