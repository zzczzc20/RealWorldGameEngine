# Phased Implementation Plan for Puzzle System & SVM Enhancements

This document outlines a detailed, step-by-step approach to developing the immersive puzzle system and enhancing SVM functionalities as conceptualized in the main `architecture_plan.md`. Each step aims for a manageable engineering effort, includes specific testing methods, and details necessary script adaptations. LLM Function Calling features are deferred to later stages to prioritize core mechanics.

## Phase 1: Core Data Structures & State Foundation

This phase lays the groundwork by defining and integrating the fundamental data structures and state management mechanisms for clues and puzzle progression within the `WorldStateContext`.

### Step 1.1: Define and Integrate `Clue` Object & `discoveredClues` State

*   **Tasks:**
    1.  In `WorldStateContext.jsx`, define the `Clue` object structure as detailed in `architecture_plan.md` (including `id`, `puzzleId`, `title`, `type`, `content`, `description`, `source`, `timestamp`, `isViewed`, `relatedEntities`).
    2.  Initialize `discoveredClues: []` as part of the `WorldStateContext`'s initial state.
    3.  Implement an `addDiscoveredClue(clueObject)` function within `WorldStateContext`. This function should:
        *   Accept a `Clue` object as an argument.
        *   Check if a clue with the same `id` already exists in the `discoveredClues` array to prevent duplicates.
        *   If new, add the `clueObject` to the `discoveredClues` array.
        *   Potentially sort clues by `timestamp` or `puzzleId` upon addition.
    4.  Ensure the `discoveredClues` array is correctly persisted to and loaded from `localStorage` as part of the `worldState`.
*   **Testing Methods:**
    1.  **Manual Context Function Call (via DevTools):**
        *   Expose `addDiscoveredClue` (e.g., via `window.devHooks.addClue = addDiscoveredClueFromContext`).
        *   In the browser console, call `window.devHooks.addClue({ id: 'testClue001', puzzleId: 'mingTak', title: 'Test Clue 1', type: 'text', content: 'This is a test.', source: 'dev', timestamp: Date.now() });`.
        *   Verify `worldState.discoveredClues` in React DevTools or by logging it. Test adding duplicate IDs.
    2.  **`localStorage` Verification:**
        *   After adding clues, inspect `localStorage` (Application tab in DevTools) to confirm `worldState.discoveredClues` is saved.
        *   Modify/delete the `localStorage` entry and reload to test persistence and loading logic.
*   **Script Adaptation:** Not applicable for this step, as it's foundational state management. Script interaction comes later.
*   **Documentation Update:** Finalize `Clue` object structure in `architecture_plan.md`. Mark step as complete.

### Step 1.2: Define and Integrate `currentPuzzleState`

*   **Tasks:**
    1.  In `WorldStateContext.jsx`, initialize `currentPuzzleState: {}` as part of the initial state. This will be an object where keys are `puzzleId`s.
    2.  Implement an `updatePuzzleState(puzzleId, pathOrUpdateObject, valueOrUndefined)` function in `WorldStateContext`.
        *   If `pathOrUpdateObject` is a string (e.g., "stage" or "variables.isDoorOpen"), use it as a path to set `valueOrUndefined`. Consider using a utility for safe nested property setting.
        *   If `pathOrUpdateObject` is an object, merge it into the state for the given `puzzleId`.
        *   Ensure the state for a `puzzleId` is initialized if it doesn't exist.
    3.  Ensure `currentPuzzleState` is correctly persisted to and loaded from `localStorage`.
*   **Testing Methods:**
    1.  **Manual Context Function Call (via DevTools):**
        *   Expose `updatePuzzleState` (e.g., `window.devHooks.updatePuzzleState`).
        *   Call `window.devHooks.updatePuzzleState('mingTakPuzzle', 'stage', 1);`
        *   Call `window.devHooks.updatePuzzleState('mingTakPuzzle', 'variables.foundKey', true);`
        *   Call `window.devHooks.updatePuzzleState('anotherPuzzle', { isActive: true, score: 100 });`
        *   Verify `worldState.currentPuzzleState` in React DevTools or console.
    2.  **`localStorage` Verification:** As in Step 1.1.
*   **Script Adaptation:** Not applicable for this step.
*   **Documentation Update:** Finalize `updatePuzzleState` function signature and behavior in `architecture_plan.md`. Mark step as complete.

## Phase 2: Basic Script-Driven Clue Mechanics

This phase focuses on enabling scripts to grant clues to the player and providing a basic UI for viewing these clues.

### Step 2.1: Implement `UNLOCK_CLUE <clueId>` Script Action

*   **Tasks:**
    1.  Create `src/data/cluesDatabase.js`. This file will export an object or Map where keys are `clueId`s and values are the full `Clue` object definitions. Example:
        ```javascript
        // src/data/cluesDatabase.js
        export const cluesDB = {
          mingTak_note01: { id: 'mingTak_note01', puzzleId: 'mingTak', title: '地铁站的便条', type: 'text', content: '“在明德商场，寻找时间的守护者。”', source: 'script_pickup', timestamp: 0 /* will be set on unlock */, isViewed: false },
          // ... more clues
        };
        ```
    2.  In `ScriptParser.js`, add a new case to handle `step.type === 'UNLOCK_CLUE'`.
    3.  The handler should:
        *   Retrieve `step.clueId`.
        *   Import `cluesDB` from `cluesDatabase.js`.
        *   Look up the `Clue` object definition using `clueId`.
        *   If found, create a copy of the clue object, set its `timestamp` to `Date.now()`, and set `isViewed` to `false`.
        *   Call the `addDiscoveredClue` function from `WorldStateContext` with this new clue object.
        *   (Optional but recommended) Publish an event via `EventService.publish('clue_unlocked', { clueId: step.clueId, clue: newClueObject });`.
*   **Testing Methods:**
    1.  **Modify Existing Startup Script (e.g., `HK_2085_Love_Isaac.yaml`):**
        *   Instead of creating a separate test script, the `UNLOCK_CLUE` action is added as an initial step to a script that runs automatically on application startup (like `HK_2085_Love_Isaac.yaml`, typically triggered by the `game_start` event).
        *   **Example Modification (in `HK_2085_Love_Isaac.yaml`):**
            ```yaml
            # ... (scriptId, title, trigger: event 'game_start') ...
            entry: 0  # Update script entry point to the new step 0
            steps:
              - stepId: 0 # New initial step
                type: UNLOCK_CLUE
                clueId: mingTak_note01 # Must exist in src/data/cluesDatabase.js
                nextStep: 1          # Proceeds to the original first step of the script
              - stepId: 1          # Original first step of HK_2085_Love_Isaac.yaml
                type: dialogue
                # ... rest of the original step 1 definition ...
              # ... other original steps ...
            ```
    2.  **Trigger by Application Reload/Restart:**
        *   After modifying the startup script, simply reload or restart the application. The script containing the `UNLOCK_CLUE` action will execute automatically.
    3.  **Verification Steps:**
        *   **Console Log Analysis:**
            *   Observe logs from `ScriptParser` confirming execution of the `UNLOCK_CLUE` step (e.g., `"[ScriptParser] Step 0: Requested to unlock clue 'mingTak_note01'."`).
            *   Observe logs from `WorldStateContext` (within `handleStateUpdate` and `addDiscoveredClue`) confirming the `requestWorldStateUpdate` for `target: 'discoveredClues'` was received, the clue was fetched from `cluesDatabase.js`, and successfully added to the `discoveredClues` state (e.g., `"[WorldStateContext via request] Added clue mingTak_note01..."`).
            *   Observe logs for the `clue_unlocked` event being published by `WorldStateContext` (e.g., `"[WorldStateContext -> publishEvent] Publishing clue_unlocked"` with correct payload).
        *   **`localStorage` Inspection:**
            *   Open browser Developer Tools (usually F12) -> Application tab -> Local Storage.
            *   Inspect the `worldState` key. Verify that the `discoveredClues` array within the JSON value now contains the `mingTak_note01` object, with a valid `timestamp` and `isViewed: false`.
        *   **React DevTools (Optional):**
            *   If using React DevTools, inspect the `WorldStateProvider`'s context value to directly see the `discoveredClues` array and confirm the new clue is present.
*   **Script Adaptation (`UNLOCK_CLUE`):**
    *   **Syntax:**
        ```yaml
        - type: UNLOCK_CLUE
          clueId: <string_clue_id_from_cluesDatabase>
          nextStep: <step_id>
        ```
    *   **Behavior:** Adds the predefined clue specified by `clueId` to the player's `discoveredClues` in `WorldStateContext`. Sets a discovery timestamp.
*   **Documentation Update:** Detail `UNLOCK_CLUE` action, `cluesDatabase.js` structure, and `clue_unlocked` event in `architecture_plan.md`.

### Step 2.2: Implement Basic Read-Only `PlayerClueLogView.jsx`

*   **Tasks:**
    1.  Create a new React component: `src/components/PlayerClueLogView.jsx`.
    2.  This component should:
        *   Subscribe to `WorldStateContext` to get the `discoveredClues` array.
        *   Render a list of discovered clues. For each clue, display its `title`.
        *   When a clue `title` is clicked, toggle the display of its `content` (if `type === 'text'`). For other types (e.g., `image_url`), initially just display the `type` and `content` (URL string).
        *   Provide a mechanism (e.g., a button in `App.jsx` or `Navbar.jsx`) to toggle the visibility of this `PlayerClueLogView`.
*   **Testing Methods:**
    1.  **Manual UI Test:**
        *   Use the test script from Step 2.1 to unlock one or more text clues.
        *   Open the `PlayerClueLogView`.
        *   Verify all unlocked clues' titles are listed.
        *   Click on a clue title to see if its text content is displayed/hidden correctly.
        *   Unlock an image clue (add one to `cluesDatabase.js` and unlock via script) and verify its title, type, and URL string are shown.
*   **Script Adaptation:** No new script actions. Scripts written in Step 2.1 are used for testing.
*   **Documentation Update:** Describe the initial features and UI of `PlayerClueLogView.jsx` in `architecture_plan.md`.

### Step 2.3: Implement `DISPLAY_SVM_CONTENT <svmId> text "<direct_text>"` Script Action

*   **Tasks:**
    1.  In `ScriptParser.js`, add a handler for `step.type === 'DISPLAY_SVM_CONTENT'`.
    2.  Initially, this action will only support `contentType: 'text'` where `contentValueOrKey` is the direct text to display.
        ```yaml
        - type: DISPLAY_SVM_CONTENT
          svmId: <target_svm_id>
          contentType: text # Literal 'text'
          contentValueOrKey: "This is the message to display on the SVM."
          nextStep: <step_id>
        ```
    3.  The handler should call a new function in `WorldStateContext` like `setSvmDisplayContent(svmId, displayData)`.
    4.  `setSvmDisplayContent` updates the target SVM object in `worldState.svms` by adding/updating a property, e.g., `svms[svmId].currentDisplay = { type: 'text', content: "..." }`.
    5.  Modify `SvmDetailView.jsx`:
        *   It should read `currentDisplay` from its corresponding SVM data in `WorldStateContext`.
        *   If `currentDisplay.type === 'text'`, it should render `currentDisplay.content`.
*   **Testing Methods:**
    1.  **YAML Script Test:** Create `test_display_svm_text.yaml`:
        ```yaml
        id: testDisplaySvmText
        initialStep: start
        steps:
          start:
            type: DISPLAY_SVM_CONTENT
            svmId: svm_001 # Assumes svm_001 exists in svmData.js
            contentType: text
            contentValueOrKey: "Hello from SVM 001!"
            nextStep: displayOnAnother
          displayOnAnother:
            type: DISPLAY_SVM_CONTENT
            svmId: svm_002
            contentType: text
            contentValueOrKey: "SVM 002 displays this."
            nextStep: end
          end:
            type: endScript
        ```
    2.  Trigger this script.
    3.  Navigate to the `SvmDetailView` for `svm_001` and `svm_002` (if a UI to select/view SVMs exists, otherwise use debug tools to inspect their state). Verify the correct text is displayed.
    4.  Test that displaying content on one SVM doesn't affect another.
*   **Script Adaptation (`DISPLAY_SVM_CONTENT` - Text Mode):**
    *   **Syntax:**
        ```yaml
        - type: DISPLAY_SVM_CONTENT
          svmId: <string_svm_id>
          contentType: text
          contentValueOrKey: "<string_direct_text_to_display>"
          nextStep: <step_id>
        ```
    *   **Behavior:** Sets a temporary display message on the specified SVM. This message should be visible when the player views the SVM's details.
*   **Documentation Update:** Detail the text-only `DISPLAY_SVM_CONTENT` action and the `SvmDetailView.jsx` modifications.

## Phase 3: Core Puzzle System Implementation & Enhanced Branching

This phase establishes a robust Puzzle system by leveraging and extending the existing `currentPuzzleState`. It also enhances script branching capabilities for more dynamic game flow based on puzzle and clue states.

### Step 3.1: Enhance `DISPLAY_SVM_CONTENT` for Images & SVM Data Model for Media

*(This step is marked as complete based on previous user confirmation. The description remains for context but implementation details are omitted here.)*
*   **Summary:** Enabled `DISPLAY_SVM_CONTENT` to show images referenced by a `mediaKey` from an SVM's `displayableMedia` object. `SvmDetailView.jsx` was updated to render these images.
*   **Status: COMPLETED**
*   **Cleanup Reminder**: The temporary `localStorage.removeItem` calls in `ScriptContext.jsx` should be removed now that this phase's testing is complete.

### Step 3.2: Define `Puzzle` Object, `puzzlesDatabase.js`, and Integrate Full Puzzle State into `currentPuzzleState`

*   **Objective:** Establish the foundational data structures for Puzzles and integrate their full state (including metadata, internal variables, and overall solved status) into the existing `currentPuzzleState`.
*   **Tasks:**
    1.  **Define `Puzzle` Object Structure (as stored in `puzzlesDatabase.js` and copied into `currentPuzzleState` upon activation):**
        *   `puzzleId: string` (Unique identifier)
        *   `title: string` (Display name for the puzzle)
        *   `description: string` (Brief overview or current objective for the player)
        *   `status: 'locked' | 'unsolved' | 'solved'` (Initial status in DB, typically 'locked' or 'unsolved')
        *   `solutionType: 'code' | 'observation' | 'sequence' | 'external_event'` (Defines how the puzzle is solved)
        *   `solution?: any` (e.g., for `solutionType: 'code'`, this would be the expected code string)
        *   `initialVariables?: object` (Optional: an object defining initial internal state variables for this puzzle, e.g., `{ stage: 1, attempts: 0 }`)
        *   `relatedClueIds?: string[]` (Optional: Clue IDs relevant to this puzzle)
        *   `onSolveActions?: ScriptStep[]` (Optional: A small sequence of script steps to execute immediately upon solving this puzzle, e.g., unlock a final clue, update another state, play a sound. This is an alternative to complex `waitForEvent` chains for simple post-solve actions.)
    2.  **Create `src/data/puzzlesDatabase.js`:**
        *   This file will export an object or Map (e.g., `puzzlesDB`) where keys are `puzzleId`s and values are the full `Puzzle` object definitions (representing their blueprint/initial state).
        *   Example:
            ```javascript
            // src/data/puzzlesDatabase.js
            export const puzzlesDB = {
              mingTakCodeEntry: {
                puzzleId: 'mingTakCodeEntry',
                title: '明德商场入口密码',
                description: '找到进入明德商场某个区域的密码。',
                status: 'locked', // Example: Starts locked
                solutionType: 'code',
                solution: '3157', // Example solution code
                initialVariables: { attemptsMade: 0, hintUnlocked: false },
                relatedClueIds: ['clue_dragon_riddle', 'clue_clock_shop_observation'],
                onSolveActions: [
                  { type: 'UNLOCK_CLUE', clueId: 'clue_mingTak_access_granted' },
                  { type: 'dialogue', persona: 'echo', text: '通路已开启...' }
                ]
              },
              // ... more puzzles
            };
            ```
    3.  **`WorldStateContext.jsx` - `currentPuzzleState` Adaptation:**
        *   `currentPuzzleState` (already existing from Step 1.2) will now store the **entire active `Puzzle` object** (a copy from `puzzlesDatabase.js` plus any runtime modifications like status changes or variable updates) for each activated puzzle, keyed by `puzzleId`.
        *   The existing `updatePuzzleState(puzzleId, path, value)` function (from Step 1.2, its implementation will be refined in a later step, now Step 4.1) will be used to modify sub-properties of an active puzzle within `currentPuzzleState[puzzleId]` (e.g., `currentPuzzleState.mingTakCodeEntry.variables.attemptsMade`).
        *   Ensure `currentPuzzleState` is robustly persisted to and loaded from `localStorage`.
*   **Testing Methods:**
    1.  Manually review `puzzlesDatabase.js` and the `Puzzle` object structure.
    2.  After subsequent steps implement functions to modify `currentPuzzleState` with these full puzzle objects, verify `localStorage` persistence.
*   **Documentation Update:** Detail the `Puzzle` object structure, `puzzlesDatabase.js` format, and how `currentPuzzleState` will now store full active puzzle data in `architecture_plan.md`.

### Step 3.3: Implement `ACTIVATE_PUZZLE <puzzleId>` Script Action & `attemptSolvePuzzle` Context Function

*   **Objective:** Allow scripts to formally introduce/activate a puzzle, and provide a mechanism to attempt solving it.
*   **Tasks:**
    1.  **Implement `activatePuzzle(puzzleId)` function in `WorldStateContext.jsx`:**
        *   Takes `puzzleId`.
        *   If `currentPuzzleState[puzzleId]` already exists (i.e., puzzle already active), logs a warning and potentially updates/resets parts of it if re-activation logic is desired, or simply does nothing.
        *   If not active, retrieves the full puzzle definition (blueprint) from `puzzlesDatabase.js`.
        *   If found:
            *   Creates a deep copy of the puzzle object from the database.
            *   Sets its `status` to `'unsolved'` (or respects the initial status from DB if it's e.g. `'locked'` and activation makes it `'unsolved'`).
            *   Initializes its internal variables by creating a `variables` sub-object from `puzzleFromDB.initialVariables` (e.g., `newPuzzleState.variables = { ...puzzleFromDB.initialVariables }`).
            *   Stores this complete, activated puzzle object in `currentPuzzleState[puzzleId]`.
            *   Publishes `EventService.publish('puzzle_activated', { puzzle: currentPuzzleState[puzzleId] });`.
        *   If not found in DB, logs an error.
    2.  **Implement `attemptSolvePuzzle(puzzleId, submittedSolution)` function in `WorldStateContext.jsx`:**
        *   Takes `puzzleId` and `submittedSolution`.
        *   Retrieves `puzzle = currentPuzzleState[puzzleId]`.
        *   If no puzzle found, or if `puzzle.status === 'solved'`, return `{ success: false, message: 'Puzzle not active or already solved.' }`.
        *   If `puzzle.solutionType === 'code'`:
            *   Compare `submittedSolution` (e.g., string from keypad) with `puzzle.solution`.
            *   If match:
                *   Set `currentPuzzleState[puzzleId].status = 'solved'`.
                *   Force a state update for `currentPuzzleState` to ensure React re-renders.
                *   Publishes `EventService.publish('puzzle_solved', { puzzleId, solution: submittedSolution, puzzle: currentPuzzleState[puzzleId] });`.
                *   If `puzzle.onSolveActions` exist, iterate through them. For each action, construct a payload and publish `requestWorldStateUpdate` or other appropriate events. (This needs careful design to manage complexity. Initially, `onSolveActions` might be limited to `UNLOCK_CLUE` or simple `UPDATE_PUZZLE_STATE` for global flags, rather than arbitrary script execution).
                *   Return `{ success: true, message: 'Puzzle solved!' }`.
            *   If no match:
                *   (Optional) If `puzzle.variables.attemptsMade` exists, increment it using `updatePuzzleState`.
                *   Publishes `EventService.publish('puzzle_solve_failed', { puzzleId, submittedSolution });`.
                *   Return `{ success: false, message: 'Solution incorrect.' }`.
        *   (Future: Add handlers for other `solutionType`s like 'observation' or 'sequence' which might not involve a `submittedSolution` but rather a specific script action calling `attemptSolvePuzzle` with a predefined internal success marker).
    3.  **Implement `ACTIVATE_PUZZLE` script action in `ScriptParser.js`:**
        *   The handler for `step.type === 'ACTIVATE_PUZZLE'` should call `WorldStateContext.activatePuzzle(step.puzzleId)` (likely via a `requestWorldStateUpdate` that `WorldStateContext` handles by calling its internal `activatePuzzle`).
*   **Testing Methods:**
    1.  **`ACTIVATE_PUZZLE` Test:**
        *   Create a YAML script with an `ACTIVATE_PUZZLE "mingTakCodeEntry"` step.
        *   Run the script.
        *   **Verify:** `worldState.currentPuzzleState.mingTakCodeEntry` is created, populated with data from `puzzlesDatabase.js` (including `title`, `description`, `solution`, `initialVariables`), and its `status` is `'unsolved'`.
        *   Verify the `puzzle_activated` event is published with the correct puzzle data.
    2.  **`attemptSolvePuzzle` Test (via DevTools or a temporary UI):**
        *   Expose `attemptSolvePuzzle` from `WorldStateContext` via `window.devHooks`.
        *   First, use the script from above to activate `mingTakCodeEntry`.
        *   Call `window.devHooks.attemptSolvePuzzle('mingTakCodeEntry', 'wrong_code')`. Verify the function returns `{ success: false, ... }`, the `puzzle_solve_failed` event is published, and `currentPuzzleState.mingTakCodeEntry.status` remains `'unsolved'`. Check if `attemptsMade` (if implemented) increments.
        *   Call `window.devHooks.attemptSolvePuzzle('mingTakCodeEntry', '3157')` (assuming '3157' is the correct solution in `puzzlesDB`). Verify return `{ success: true, ... }`, `puzzle_solved` event, `currentPuzzleState.mingTakCodeEntry.status` changes to `'solved'`, and any defined `onSolveActions` (e.g., a clue unlock) are triggered.
*   **Script Adaptation (`ACTIVATE_PUZZLE`):**
    *   **Syntax:**
        ```yaml
        - type: ACTIVATE_PUZZLE
          puzzleId: <string_puzzle_id_from_puzzlesDatabase>
          nextStep: <step_id>
        ```
    *   **Behavior:** Loads the specified puzzle definition from `puzzlesDatabase.js` into `currentPuzzleState` with an 'unsolved' status, making it active for the player.
*   **Documentation Update:** Detail `activatePuzzle` and `attemptSolvePuzzle` context functions, the related events (`puzzle_activated`, `puzzle_solved`, `puzzle_solve_failed`), and the `ACTIVATE_PUZZLE` script action.

### Step 3.4: Implement `WAIT_FOR_PUZZLE_SOLVED <puzzleId>` Script Action (Gating Mechanism)

*   **Objective:** Create the primary script action that pauses script execution until a specific puzzle's status in `currentPuzzleState` is 'solved'.
*   **Tasks (in `ScriptParser.js`):**
    1.  **Add handler for `step.type === 'WAIT_FOR_PUZZLE_SOLVED'`:**
        *   **Parameters in YAML:**
            *   `puzzleId: string` (The ID of the puzzle to check)
            *   `nextStep: <step_id>` (The step to proceed to once the puzzle is solved)
            *   `stepIdOnWait: <optional_step_id>` (If provided, and puzzle is not yet solved, script jumps to this step. This step would typically contain a message and then loop back to this `WAIT_FOR_PUZZLE_SOLVED` step, or offer alternative actions.)
    2.  **Behavior in `ScriptParser.notify(eventName, data)`:**
        *   **Initial Encounter / Re-evaluation:** When the script engine's current step is `WAIT_FOR_PUZZLE_SOLVED`:
            *   Access `puzzle = worldState.currentPuzzleState[step.puzzleId]`.
            *   If `puzzle && puzzle.status === 'solved'`, then set `next = step.nextStep` (to advance the script).
            *   Else (puzzle doesn't exist in `currentPuzzleState`, or its `status` is not `'solved'`):
                *   If `step.stepIdOnWait` is defined, set `next = step.stepIdOnWait`.
                *   If `step.stepIdOnWait` is NOT defined, then `next` remains `null` for this `notify` call. The script effectively "pauses" on this step. The `ScriptParser` instance itself needs to remember it's waiting on this specific `puzzleId`.
        *   **Responding to `puzzle_solved` event:**
            *   When `EventService` dispatches a `puzzle_solved` event to all active script engines:
                *   If an engine's `currentStep` is a `WAIT_FOR_PUZZLE_SOLVED` type, and the `eventData.puzzleId` from the `puzzle_solved` event matches `this.tree.steps[this.current].puzzleId`:
                    *   This signifies the puzzle this step was waiting for is now solved.
                    *   The engine should then set `next = this.tree.steps[this.current].nextStep` and proceed with its execution cycle (which will likely involve publishing a `scriptStep` event for the new step).
*   **Testing Methods:**
    1.  **YAML Script Test:**
        ```yaml
        id: testWaitForPuzzleSolved
        entry: start_puzzle_flow
        steps:
          - stepId: start_puzzle_flow
            type: ACTIVATE_PUZZLE
            puzzleId: "gatekeeperPuzzle" # Assume this puzzle exists in puzzlesDB with solution "open_sesame"
            nextStep: approach_gate
          - stepId: approach_gate
            type: dialogue
            persona: narrator
            text: "A large, sealed gate blocks your path. A voice echoes: Only those who solve the Gatekeeper's riddle may pass."
            nextStep: wait_for_gate_puzzle
          - stepId: wait_for_gate_puzzle
            type: WAIT_FOR_PUZZLE_SOLVED
            puzzleId: "gatekeeperPuzzle"
            nextStep: gate_opens
            stepIdOnWait: still_waiting_at_gate # Optional loop/message
          - stepId: still_waiting_at_gate
            type: dialogue
            persona: narrator
            text: "The gate remains sealed. The riddle echoes in your mind."
            nextStep: wait_for_gate_puzzle # Loop back to wait
          - stepId: gate_opens
            type: dialogue
            persona: narrator
            text: "With a grinding sound, the Gatekeeper's puzzle is solved, and the gate slowly opens!"
            nextStep: end
          - stepId: end
            type: endScript
        ```
    2.  **Test Execution:**
        *   Run the script. It should activate `gatekeeperPuzzle`, show the "large, sealed gate" dialogue, then proceed to `wait_for_gate_puzzle`.
        *   If `stepIdOnWait` is used, it should show "The gate remains sealed..." and loop back. If not, it should just pause. The "gate slowly opens!" dialogue should NOT appear yet.
        *   Manually (e.g., via DevTools `attemptSolvePuzzle('gatekeeperPuzzle', 'open_sesame')`) solve the puzzle.
        *   **Verify:** After the `puzzle_solved` event is processed, the script instance waiting at `wait_for_gate_puzzle` should advance to `gate_opens`, and the corresponding dialogue should appear.
*   **Script Adaptation (`WAIT_FOR_PUZZLE_SOLVED`):**
    *   **Syntax:**
        ```yaml
        - type: WAIT_FOR_PUZZLE_SOLVED
          puzzleId: <string_puzzle_id_to_wait_for>
          nextStep: <step_id_after_puzzle_is_solved>
          stepIdOnWait: <optional_step_id_if_not_yet_solved_for_looping_or_messages>
        ```
    *   **Behavior:** Halts script execution at this step (or diverts to `stepIdOnWait`) until the specified `puzzleId` has its status changed to `'solved'` in `currentPuzzleState`. Once solved, proceeds to `nextStep`.
*   **Documentation Update:** Detail `WAIT_FOR_PUZZLE_SOLVED` action, its pausing/event-driven continuation logic, and its role as a primary gating mechanism.

### Step 3.5: Implement Basic Puzzle Display & Interaction UI

*   **Objective:** Create a foundational UI component to display information about an active puzzle and allow the player to attempt solutions, primarily to facilitate testing and debugging of the `attemptSolvePuzzle` function from Step 3.3.
*   **Tasks:**
    1.  **Create a new React component:** e.g., `src/components/PuzzleInteractionView.jsx`.
    2.  **Component Logic:**
        *   Subscribe to `WorldStateContext` to access `currentPuzzleState` and the `attemptSolvePuzzle` function.
        *   Implement a way to determine the "current" or "target" puzzle to display. This could be:
            *   A prop `puzzleId` passed to it.
            *   Logic to find the most recently activated puzzle from `currentPuzzleState` that is still `'unsolved'`.
            *   (For initial simplicity, it might always try to display a specific test puzzle like `mingTakCodeEntry` if active).
        *   If a target puzzle is identified and exists in `currentPuzzleState`:
            *   Display `puzzle.title` and `puzzle.description`.
            *   If `puzzle.status === 'unsolved'` and `puzzle.solutionType === 'code'`:
                *   Render a text input field for the code.
                *   Render a "Submit" button.
                *   On submit, call `attemptSolvePuzzle(targetPuzzle.puzzleId, enteredCode)`.
                *   Display the `message` from the result of `attemptSolvePuzzle` (e.g., "Solution correct!", "Solution incorrect.").
            *   If `puzzle.status === 'solved'`, display a success message or hide the input.
    3.  **Integration (Initial):**
        *   For ease of testing, temporarily integrate this `PuzzleInteractionView` into a visible part of the application, for example:
            *   Within `SvmDetailView.jsx`, if `selectedSvm.activePuzzleId` (a new hypothetical property on SVM data, or determined by some logic) points to an active puzzle.
            *   Or, more simply, add it to `App.jsx` as a globally accessible (perhaps toggleable) debug panel.
*   **Testing Methods:**
    1.  **Prerequisite:** Ensure the `HK_2085_Love_Isaac.yaml` script (or a dedicated test script) includes an `ACTIVATE_PUZZLE "mingTakCodeEntry"` step.
    2.  **Run Application:**
        *   The script should activate `mingTakCodeEntry`.
        *   The new `PuzzleInteractionView` (wherever integrated) should display the title and description for `mingTakCodeEntry`.
        *   A code input field and submit button should be visible.
    3.  **Test Interaction:**
        *   Enter an incorrect code (e.g., "wrong_code") and submit.
            *   **Verify:** The UI displays "Solution incorrect." `localStorage` shows `mingTakCodeEntry.status` is still `'unsolved'`. `puzzle_solve_failed` event is logged.
        *   Enter the correct code (e.g., "3157" for `mingTakCodeEntry`) and submit.
            *   **Verify:** The UI displays "Solution correct!" (or similar). `localStorage` shows `mingTakCodeEntry.status` is now `'solved'`. `puzzle_solved` event is logged. The input field might become disabled or hidden.
*   **Documentation Update:** Detail this new `PuzzleInteractionView` component, its purpose for early testing, and its basic functionalities. This step provides the groundwork for more sophisticated UI in later phases.

## Phase 4: SVM Puzzle Interactivity & Advanced UI (Formerly Phase 4 & 5)

This phase now combines the original Phase 4 (SVM `puzzleHooks`) and parts of Phase 5 (UI enhancements), building upon the basic interaction UI from Step 3.5.

### Step 4.1: `UPDATE_PUZZLE_STATE <puzzleId> <path> <value>` Script Action (Re-confirming its role)

*(This action, originally from Step 1.2 for `currentPuzzleState` and then refined, is crucial for managing the *internal* state variables of an active puzzle. Its definition and purpose are now solidified in the context of the full Puzzle object being stored in `currentPuzzleState[puzzleId]`.)*
*   **Tasks:**
    1.  Ensure the `updatePuzzleState(puzzleId, path, value)` function in `WorldStateContext.jsx` correctly modifies nested properties within `currentPuzzleState[puzzleId].variables` (or other designated sub-objects like `currentPuzzleState[puzzleId].customData`). For example, `updatePuzzleState('myPuzzle', 'variables.leverPulled', true)`.
    2.  The `ScriptParser.js` handler for `step.type === 'UPDATE_PUZZLE_STATE'` calls this context function (likely via `requestWorldStateUpdate`).
*   **Testing Methods:**
    1.  Activate a puzzle using `ACTIVATE_PUZZLE` (which populates `currentPuzzleState[puzzleId]` with initial data including `initialVariables`).
    2.  Use a script with `UPDATE_PUZZLE_STATE` to change several internal variables of that puzzle (e.g., `stage`, `flags.A`, `counters.X`).
    3.  Inspect `worldState.currentPuzzleState[puzzleId]` in DevTools to verify the variables are correctly updated.
*   **Script Adaptation (`UPDATE_PUZZLE_STATE`):**
    *   **Syntax:**
        ```yaml
        - type: UPDATE_PUZZLE_STATE
          puzzleId: <string_puzzle_id>
          path: <string_dot_notation_path_within_the_puzzle_object_in_currentPuzzleState_e.g., "variables.keyFound" or "stage">
          value: <any_json_serializable_value>
          nextStep: <step_id>
        ```
    *   **Behavior:** Modifies internal variables or sub-states of an active puzzle stored in `currentPuzzleState[puzzleId]`.
*   **Documentation Update:** Confirm the role and usage of `UPDATE_PUZZLE_STATE` for managing internal puzzle variables.

### Step 4.2: SVM `puzzleHooks` for Conditional Display & Interaction Triggers

*   **Objective:** Allow SVMs to dynamically change their displayed content (text/image from `displayableMedia`) and present interaction triggers (like "Attempt Code Entry") based on an active puzzle's overall status (`solved`/`unsolved`) or its internal state variables.
*   **Tasks:**
    1.  **Refine `PuzzleInteractionConfig` in `svmData.js` (for `puzzleHooks` on an SVM):**
        *   `hookId: string` (Unique ID for this hook on this SVM, useful for specific event targeting)
        *   `mode: 'conditional_media_display' | 'puzzle_interaction_interface'`
        *   **Conditions (Array of condition objects, ALL must be met for hook to be active):**
            ```yaml
            conditions:
              - type: puzzleStatus # Checks currentPuzzleState[puzzleId].status
                puzzleId: <string_puzzle_id>
                expectedStatus: 'unsolved' # | 'solved' | 'locked'
              - type: puzzleStateVar # Checks currentPuzzleState[puzzleId].variables.<path>
                puzzleId: <string_puzzle_id>
                path: <string_dot_path_to_variable>
                operator: <equals|notEquals|etc.>
                value: <comparison_value>
              - type: playerHasClue
                clueId: <string_clue_id>
            ```
        *   **If `mode: 'conditional_media_display'`:**
            *   `mediaKey: string` (From this SVM's `displayableMedia`)
        *   **If `mode: 'puzzle_interaction_interface'`:**
            *   `interactionType: 'code_input' | 'generic_button'`
            *   `puzzleIdToAffect: string` (The `puzzleId` this interaction is intended to solve or affect)
            *   `promptText?: string` (e.g., "Enter Code for [puzzleTitle]")
            *   `buttonText?: string` (e.g., "Submit", "Inspect Anomaly")
            *   `eventOnInteraction?: string` (For `generic_button`, the custom event name to publish)
        *   `priority?: number` (Higher wins if multiple hooks' conditions are met)
    2.  **Modify `SvmDetailView.jsx`:**
        *   Access `currentPuzzleState` and `discoveredClues` from `WorldStateContext`.
        *   When rendering, evaluate all `puzzleHooks` for the current SVM, sorted by `priority`.
        *   The first hook whose `conditions` are all met becomes the "active hook".
        *   If active hook `mode` is `conditional_media_display`: Display the content of `selectedSvm.displayableMedia[activeHook.mediaKey]`. This can override any `currentDisplay` set by a direct `DISPLAY_SVM_CONTENT` script action if the hook has higher priority or if no direct display is set.
        *   If active hook `mode` is `puzzle_interaction_interface`:
            *   If `interactionType: 'code_input'`, display prompt, input field, submit button. On submit, call `WorldStateContext.attemptSolvePuzzle(activeHook.puzzleIdToAffect, enteredValue)`. The UI should provide immediate feedback (e.g., "Checking...", "Incorrect Code", "Accepted!"). The `puzzle_solved` event (if successful) will then trigger script progression via `WAIT_FOR_PUZZLE_SOLVED`.
            *   If `interactionType: 'generic_button'`, display the button. On click, publish `EventService.publish(activeHook.eventOnInteraction, { svmId, hookId: activeHook.hookId, puzzleId: activeHook.puzzleIdToAffect });`. Scripts can `waitForEvent` on this custom event.
*   **Testing Methods:**
    1.  Configure SVMs with various `puzzleHooks` for display and interaction, with diverse conditions.
    2.  Use scripts to `ACTIVATE_PUZZLE`, `UPDATE_PUZZLE_STATE`, `UNLOCK_CLUE` to meet hook conditions.
    3.  Verify SVMs display correct media based on active hooks.
    4.  Verify interaction interfaces (keypad, button) appear/disappear correctly.
    5.  Test keypad submission: correct codes should lead to `attemptSolvePuzzle` success, `puzzle_solved` event, and script continuation via `WAIT_FOR_PUZZLE_SOLVED`. Incorrect codes should show UI feedback and fire `puzzle_solve_failed`.
    6.  Test generic buttons publishing their custom events and scripts correctly waiting for them.
*   **Documentation Update:** Detail the comprehensive `puzzleHooks` structure, condition types, interaction types, and the updated rendering/interaction logic in `SvmDetailView.jsx`.

### Step 4.3: `PlayerClueLogView.jsx` Enhancements & New `PlayerPuzzleListView.jsx` (Formerly Step 5.1)

*   **Tasks for `PlayerClueLogView.jsx`:** (As previously defined: image display in log, advanced filter/sort, full details, mark as viewed functionality linked to `WorldStateContext`).
*   **Tasks for New `PlayerPuzzleListView.jsx`:**
    1.  Create `src/components/PlayerPuzzleListView.jsx`.
    2.  Subscribes to `WorldStateContext` to get `currentPuzzleState`.
    3.  Lists all puzzles whose `puzzleId` is a key in `currentPuzzleState` (i.e., all activated puzzles).
    4.  For each puzzle, displays `puzzle.title`, `puzzle.description`, and its current `puzzle.status` (e.g., "Unsolved", "Solved").
    5.  For puzzles with `status: 'unsolved'` and `solutionType: 'code'`:
        *   Provides a button/link like "Attempt Solution".
        *   Clicking this could either:
            *   Open a modal or dedicated view for code entry for that `puzzleId`.
            *   If the puzzle is tied to a specific SVM interaction (via `puzzleHooks`), it might unlock a clue like "The solution for [Puzzle Title] must be entered at [SVM Name]."
    6.  Integrate access to this view (e.g., via Navbar).
*   **Testing Methods:** Manually test all UI features after activating/solving various puzzles and unlocking clues.
*   **Documentation Update:** Describe `PlayerPuzzleListView.jsx` and final `PlayerClueLogView.jsx` features.

### Step 4.4: Complex Puzzle Example - "Disable Security System" (Formerly Step 5.2)

*(This example demonstrates how the revised system components work together.)*
*   **Objective:** Illustrate a multi-stage puzzle using `ACTIVATE_PUZZLE`, `UPDATE_PUZZLE_STATE` (for internal puzzle variables), the basic UI from Step 3.5 (or its evolution via `puzzleHooks` from Step 4.2), `UNLOCK_CLUE` for informational pieces that help solve stages, and `WAIT_FOR_PUZZLE_SOLVED` for gating the main progression upon the final solution of the overarching puzzle.
*   **Scenario Outline (Puzzle ID: `disableMainframeSecurity`):**
    1.  **Activation & Gating:**
        *   Main Quest Script: `... -> WAIT_FOR_PUZZLE_SOLVED "disableMainframeSecurity" -> next_major_plot_point ...`
        *   Trigger Script (e.g., upon entering a new area): `ACTIVATE_PUZZLE "disableMainframeSecurity"`
        *   `puzzlesDatabase.js` for `disableMainframeSecurity`:
            ```javascript
            disableMainframeSecurity: {
              puzzleId: 'disableMainframeSecurity',
              title: 'Disable Mainframe Security',
              description: 'The corporate mainframe is protected. Find a way to bypass its defenses.',
              status: 'locked', // Activated to 'unsolved' by ACTIVATE_PUZZLE
              solutionType: 'sequence', // This puzzle is solved by completing sub-puzzles/stages
              solution: null, // Not a simple code; solved when all internal stages are met
              initialVariables: { stage: 1, coolantFlowing: false, accessKeyVerified: false, finalOverrideEngaged: false },
              onSolveActions: [{ type: 'dialogue', persona: 'echo', text: 'Mainframe security disengaged.'}]
            }
            ```
    2.  **Stage 1: Restore Coolant (Internal state: `variables.coolantFlowing`)**
        *   An SVM (`svm_coolant_control`) has a `puzzleHook` (mode: `conditional_media_display`) active if `currentPuzzleState.disableMainframeSecurity.variables.coolantFlowing === false`. It displays: "Coolant system offline. Pressure critical."
        *   Another SVM (`svm_pump_station`) has a `puzzleHook` (mode: `puzzle_interaction_interface`, `interactionType: 'code_input'`, `puzzleIdToAffect: "coolant_pump_code"`).
        *   Player solves `coolant_pump_code` (a separate, simpler puzzle activated elsewhere or found via clue).
        *   The `onSolveActions` for `coolant_pump_code` (or a script waiting for its `puzzle_solved` event) executes: `UPDATE_PUZZLE_STATE "disableMainframeSecurity" "variables.coolantFlowing" true`.
        *   Now, `svm_coolant_control` display changes (due to its `puzzleHook` condition no longer met, or a new one met) to "Coolant flow nominal." It might also unlock a clue: `UNLOCK_CLUE "clue_security_panel_location"`.
    3.  **Stage 2: Verify Access Key (Internal state: `variables.accessKeyVerified`)**
        *   Player uses `clue_security_panel_location` to find `svm_security_terminal`.
        *   `svm_security_terminal` has a `puzzleHook` (mode: `puzzle_interaction_interface`, `interactionType: 'code_input'`, `puzzleIdToAffect: "access_key_puzzle"`) active if `coolantFlowing === true`.
        *   Player solves `access_key_puzzle` (solution perhaps found via another complex clue chain).
        *   `onSolveActions` for `access_key_puzzle` (or script): `UPDATE_PUZZLE_STATE "disableMainframeSecurity" "variables.accessKeyVerified" true`.
        *   `svm_security_terminal` might now display "Access key verified. Mainframe override available at primary console."
    4.  **Stage 3: Engage Final Override (Solves `disableMainframeSecurity`)**
        *   `svm_mainframe_console` has a `puzzleHook` (mode: `puzzle_interaction_interface`, `interactionType: 'generic_button'`, `buttonText: "ENGAGE OVERRIDE"`, `eventOnInteraction: "mainframe_override_attempted"`) active if `accessKeyVerified === true`.
        *   Player clicks "ENGAGE OVERRIDE".
        *   A script `waitForEvent "mainframe_override_attempted"`. When received, it calls `WorldStateContext.attemptSolvePuzzle("disableMainframeSecurity", null)` (solution `null` because `solutionType` is `'sequence'`, implying it's solved by internal state changes rather than a code).
        *   The `attemptSolvePuzzle` function for `disableMainframeSecurity` would need custom logic: if `variables.coolantFlowing === true && variables.accessKeyVerified === true`, then it sets `status: 'solved'` and `variables.finalOverrideEngaged: true`.
    5.  **Progression:** The `puzzle_solved` event for `disableMainframeSecurity` fires. The main quest script waiting on `WAIT_FOR_PUZZLE_SOLVED "disableMainframeSecurity"` now proceeds.
*   **Tasks:** Define all puzzles/clues, configure SVMs, write YAML script.
*   **Testing:** Play through.
*   **Documentation:** Detail this multi-stage puzzle as a prime example.
*   **Documentation:** Detail this multi-stage puzzle as a prime example.

---
This revised plan (Phase 3.2 onwards, with the addition of Step 3.5 for basic UI) provides a more robust and clear framework for your puzzle system. It prioritizes early testability of core puzzle mechanics before layering on more complex SVM-specific interactions and advanced UI features. Clues serve as informational support, and SVM interactions are primarily event-driven, feeding into either clue discovery or attempts to solve these defined Puzzles.