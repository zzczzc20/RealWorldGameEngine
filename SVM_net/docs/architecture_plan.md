# IdeActuator Demo (SVM_net) - Architecture & Evolution Plan (v2.2 - Post AI Chat History Integration)

## 1. Vision & Current Status

**Vision:** Transform urban spaces into interactive game worlds using AI, smart devices (SVMs), mobile apps, and game mechanics. Create engaging, location-based experiences that blend the virtual and real.

**Current Status (v2.2):** We have built a functional frontend demo based on React, Mapbox, and Tailwind CSS. The project is in the development or testing phase, featuring multiple key functional modules such as world state management, script parsing, AI dialogue generation, map views, and task systems. Key architectural elements are in place:
    *   **Event-Driven Core:** `EventService` manages communication via a pub/sub model and an asynchronous event queue.
    *   **Script Engine:** `ScriptParser` interprets YAML scripts (`dialogue`, `aiDialogue`, `taskOffer`, `waitForEvent`, `updateWorldState`, `branch`, `aiDecision`) to drive interactive sequences.
    *   **State Management:**
        *   `ScriptContext` tracks the progress of active scripts.
        *   `WorldStateContext` provides centralized management for key game states (`svms`, `activeTask`, `player`) and publishes state change events (e.g., `player_inventory_updated`).
    *   **Context-Aware AI:** `AIChatContainer` integrates with an LLM via `AIService`. `AIContext` injects world state, script progress, and **selected language preference** into the system prompt, allowing the AI to answer context-specific questions in the chosen language (EN, ZH, JA). **Chat history integration** ensures that even the first AI message includes previous interactions for continuity.
    *   **Task Interaction:**
        *   `TaskOfferPanel` handles standard task offers (Accept/Decline).
        *   `CodeEntryTaskPanel` handles specific tasks requiring code input (defined by `type: 'CODE_ENTRY'` in `taskData.js`), publishing `task_outcome` events.
    *   **Core Gameplay Loop:** The `svm03_anomaly` and `svm05_data_heist_main` scripts demonstrate event triggering, script activation, dialogue, standard task offers, code entry task execution, state updates, event waiting (including `task_outcome`), and branching.
    *   **UI Enhancements:** Updated `AIChatContainer` to display avatars in the persona list, enhancing the chat interface's visual appeal.
    *   **Puzzle System:** Implements a comprehensive puzzle system with clue logs and interactive elements for engaging gameplay.
    *   **Map Navigation:** Provides navigational aids to enhance location-based interactions within the game world.

**Challenges & Issues:**
1.  **Incomplete Functionalities:** Some features are not fully implemented or are commented out in the code.
2.  **Optimization Needs:** Certain modules require optimization for better performance and user experience.
3.  **Temporary Code:** Presence of temporary code that needs to be replaced with permanent solutions.
4.  **Error Handling:** Unresolved error handling issues that need to be addressed for robustness.

**Next Goal:** Evolve the demo from a functional prototype towards a genuinely engaging and "fun" experience, laying the groundwork for richer gameplay and deeper AI integration.

## 2. Core Architecture (Current - v2.2 Reflected)

This architecture prioritizes decoupling and event-driven flow.

*   **Technology Stack:** React, Mapbox GL JS, Tailwind CSS, React Context (`ScriptContext`, `WorldStateContext`), Fetch API (for LLM via OpenRouter).
*   **Key Modules & Flow:**
    1.  **UI Components (`App.jsx`, `MapView`, `AIChatContainer`, `TaskOfferPanel`, `CodeEntryTaskPanel`, etc.):** Render based on state from Contexts (`ScriptContext`, `WorldStateContext`). `App.jsx` manages overall view, API key, selected language, and determines when to show `TaskOfferPanel` or `CodeEntryTaskPanel`. Components publish user interaction events (e.g., `task_outcome` from `CodeEntryTaskPanel`) or specific script notifications (e.g., `branchChoice` from `TaskOfferPanel`) via `EventService`.
    2.  **EventService (`EventService.js`):** Central hub. Receives all events (from UI, state changes, script engine).
        *   Notifies direct subscribers.
        *   Routes events to active `ScriptParser` instances.
        *   Manages `ScriptParser` lifecycle (activation/deactivation).
        *   Queues and asynchronously publishes `scriptStep` / `scriptFinished` events resulting from state changes in `ScriptParser`.
        *   Ensures chat history is passed to AI dialogue requests, even for the first message.
    3.  **ScriptParser (`ScriptParser.js`):** Executes a single YAML script instance. Receives events via its `notify` method, updates its internal step pointer (`current`), evaluates conditions (using event data or world state), and determines if it's finished based on script logic (`nextStep*`, `endScript`). Publishes `requestWorldStateUpdate`, `requestAIDialogue`, `requestAIDecision`.
    4.  **ScriptContext (`ScriptContext.jsx`):** Subscribes to `scriptStep` and `scriptFinished` events from `EventService`. Updates its `activeEngineDetails` state (Map: `scriptId` -> `currentStepObject`) to provide a reactive snapshot of script progress to the UI.
    5.  **WorldStateContext (`WorldStateContext.jsx`):** Manages centralized game state (`svms`, `activeTask`, `player`). Handles `requestWorldStateUpdate` events from `ScriptParser`. Provides state values and direct update functions (e.g., `updateSvmStatus`, `setActiveTask`, `updatePlayerInventory`) to components. **Publishes state change events** (e.g., `player_inventory_updated`) after updates occur. Persists state to `localStorage`.
    6.  **AI Services (`AIService.js`, `AIContext.js`):** `AIChatContainer` uses `WorldStateContext` and `ScriptContext` to gather context, calls `AIContext.getSystemPrompt` (passing the **selected language**) to format it, and uses `AIService.getOpenRouterCompletion` to interact with the LLM. Ensures chat history is included in AI requests.
    7.  **Scripts (YAML):** Define the specific sequences of interactions, dialogues, tasks, etc. Loaded dynamically by `EventService` based on trigger events. Can include `waitForEvent` steps listening for `task_outcome` or `player_inventory_updated`.

*   **Architecture Diagram (Conceptual - See `architecture_overview.html` for detailed SVG):**
    *(The Mermaid diagram in README.md has been updated to reflect this)*

## 3. Evolution Plan: Towards "Fun" & Deeper AI Integration (v2.3+)

To elevate the demo beyond its current state, we need to focus on richer interactions, more dynamic systems, and smarter AI.

### 3.1 Full World State Centralization & Script Interaction [COMPLETED]

*   **Goal:** Complete the migration to `WorldStateContext` and enable scripts to directly read and modify this central state.
*   **Status:** ✅ Completed. `WorldStateContext` manages core state, handles script update requests, and publishes change events. `ScriptParser` uses world state for conditions. Basic persistence is implemented.

### 3.2 AI Tool Calling / Function Calling [NEXT]

*   **Goal:** Empower the AI assistant (Echo) to not just answer questions but to *actively participate* in the game world by triggering actions, retrieving specific, real-time information, and assisting in the puzzle-solving process.
*   **Concept:** Utilize the "Function Calling" or "Tool Use" capabilities of modern LLMs.
    *   Define tools like `get_svm_details`, `get_active_task_details`, `publish_event`, `find_nearby_svms`.
    *   **New tools to support Immersive Puzzle System:**
        *   `getDiscoveredClues <puzzleId_or_tag>`: Allows Echo to know which clues the player has already found for a given puzzle, enabling more relevant hints or dialogue.
        *   `getPuzzleStage <puzzleId>`: Enables Echo to understand the player's current progress in a multi-stage puzzle.
        *   `submitPlayerTheory <puzzleId> "<theory_text>"`: (Advanced) Player can voice a theory to Echo, who uses this tool to (conceptually) check it against known facts or guide the player. The "evaluation" would be an LLM-generated response based on the theory and game state.
        *   `requestSvmAction <svmId> <actionType> [parameters]`: Allows Echo to suggest or (with player confirmation) trigger specific actions on an SVM, like displaying a hidden clue.
    *   Modify `AIService` and `AIChatContainer` to handle the tool calling request/response flow with the LLM API for these new tools.
    *   Implement local functions (likely in `EventService` or a dedicated `ToolExecutor` module) to execute the tool actions (query `WorldStateContext`, publish events, interact with SVM logic).
*   **Impact:** Transforms Echo from a reactive Q&A bot into a proactive and integral part of the gameplay and puzzle-solving experience. This is key to increasing "fun" and immersion.

### 3.3 Enhancing Gameplay & "Fun Factor"

*   **Goal:** Move beyond simple script execution towards more engaging game loops, with a strong focus on immersive puzzle-solving experiences. This involves integrating multi-faceted clues delivered via various channels (Echo AI, SVM interactions, environmental discoveries) that players must synthesize.
*   **Example Scenario:** A multi-stage puzzle starting at a subway station, where players, guided by Echo (AI) and interacting with specific SVMs, uncover clues (text, images) to find a hidden location like the "Ming Tak Shopping Centre in Hang Hau."
*   **Ideas (Leveraging World State & AI Tools for Puzzles & Immersion):**
    *   **Dynamic Events:** Use `EventService` for more varied event triggers (time, player actions, AI decisions, location proximity via GPS).
    *   **SVM as Interactive Clue Hubs & Multimedia Display:**
        *   **Clue Presentation:** SVMs can be scripted to display critical text clues, riddles, code fragments, or narrative pieces.
        *   **Image Display:** SVMs can show images relevant to the puzzle, such as photos of locations, map segments, symbols, or character portraits. This is key for visual puzzles and location identification (e.g., showing a picture of the Ming Tak Shopping Centre entrance).
        *   **(Future) Audio/Video Clues:** SVMs could play short audio messages or video clips.
        *   **Contextual Information:** Based on player progress or location, SVMs can provide relevant background information or lore.
    *   **Enhanced SVM Interactivity for Puzzles:**
        *   **Puzzle-Specific Interfaces:** SVMs could present unique UI elements for specific puzzles, extending beyond simple information display (e.g., a keypad for a code, a sequence matching game). This can build upon the `CodeEntryTaskPanel` concept.
        *   **Conditional Clue Unlocking:** Clues on an SVM might only become available after the player performs a specific action, answers a question (via Echo), or possesses a certain item/status in `WorldStateContext`.
    *   **Location-Aware SVM Content & Triggers:**
        *   SVMs in different physical (or virtual map) locations can offer unique, geographically-tied clues.
        *   Player entering a geofenced area (e.g., near Ming Tak Shopping Centre) can trigger events that update SVM content or Echo dialogues.
    *   **Echo AI as a Dynamic Guide & Reasoning Partner:**
        *   Echo (via `aiDialogue` and AI Tool Calling) can provide initial briefings, interpret player queries about clues, and offer contextual (non-obvious) hints based on `discoveredClues` and `puzzleState` in `WorldStateContext`.
        *   Echo can confirm player deductions or gently nudge them if they are on a wrong path, using tools to access game state.
    *   **Resource Management & Reputation:** (As previously listed) These can be tied into puzzle-solving (e.g., paying for a crucial hint, gaining reputation with a faction for solving parts of their mystery).
    *   **Mini-Games for Clue Decryption/Acquisition:** (As previously listed) Encrypted messages on an SVM, or "hacking" an SVM for data, can be implemented as mini-games.
    *   **Exploration Rewards:** (As previously listed) Discovering hidden SVMs or interacting with them in a specific sequence can yield vital clues.
*   **Architectural Impact & Implementation Sketch:**
    *   **`WorldStateContext`:**
        *   `discoveredClues: Clue[]`: An array to store all clues found by the player across all puzzles.
        *   `currentPuzzleState: Record<string, PuzzleInstance>`: An object जहां keys are `puzzleId`s and values are objects representing the state of that specific puzzle instance (e.g., `{ mingTakPuzzle: { stage: 1, foundSubwayClue: true, echoHintLevel: 0,商场照片已查看: false } }`).
        *   **`Clue` Object Definition (refined):**
            *   `id: string` (Unique identifier for the clue)
            *   `puzzleId: string` (Identifier of the puzzle this clue belongs to)
            *   `title: string` (Short, displayable title for the clue, e.g., "地铁站的神秘便条")
            *   `type: 'text' | 'image_url' | 'audio_url' | 'video_url' | 'location_coord'` (Type of clue content)
            *   `content: string` (The actual text, URL to media, or stringified coordinates)
            *   `description?: string` (Optional longer description or player's thoughts about the clue)
            *   `source: string` (How the clue was obtained, e.g., "Echo_dialogue_A2", "SVM_HangHauStation_display", "EnvironmentScan_MingTakEntrance", "PlayerDeduction")
            *   `timestamp: number` (When the clue was discovered)
            *   `isViewed?: boolean` (Has the player explicitly viewed this clue in their log?)
            *   `relatedEntities?: { type: 'clue'|'svm'|'location'|'character', id: string }[]` (Links to other relevant game entities)
    *   **SVM Data Model (e.g., `svmData.js` or dynamic from backend - refined):**
        *   Each SVM object could have a `puzzleInteractions: PuzzleInteractionConfig[]` array.
        *   **`PuzzleInteractionConfig` Object:**
            *   `puzzleId: string` (Which puzzle this configuration applies to)
            *   `requiredPuzzleStage?: number` (Optional: this interaction is only active if the puzzle is at this stage)
            *   `requiredPlayerFlags?: string[]` (Optional: e.g., ["hasSeenEchoHintX", "hasItemY"])
            *   `mode: 'clue_delivery' | 'media_display' | 'interactive_puzzle'` (What this SVM does for the puzzle)
            *   **If `mode: 'clue_delivery'`:**
                *   `clueIdToUnlock: string` (ID of the clue in a central Clue Database that gets added to `WorldStateContext.discoveredClues`)
                *   `displayText?: string` (Text shown on SVM before clue is "taken")
                *   `unlockMethod: 'auto_on_interaction' | 'requires_code_entry' | 'requires_ai_confirmation'`
                *   `code?: string` (If `unlockMethod` is `requires_code_entry`)
            *   **If `mode: 'media_display'`:**
                *   `mediaKey: string` (A key to look up in a `mediaAssets` object, e.g., "mingTakEntrancePhoto")
                *   `mediaAssets: { [mediaKey: string]: { type: 'image_url' | 'text_block', content: string, caption?: string } }`
            *   **If `mode: 'interactive_puzzle'`:**
                *   `interactionType: 'keypad' | 'slider_puzzle' | 'sequence_input'`
                *   `promptText?: string`
                *   `targetEventOnSuccess: string` (Event published by `SvmDetailView` on successful mini-puzzle completion)
                *   `successClueId?: string` (Optional clue unlocked upon success)
    *   **Script System (`ScriptParser`, YAML - refined actions):**
        *   `UNLOCK_CLUE <clueId>`: Adds a pre-defined clue (from a central Clue Database/Configuration) to `WorldStateContext.discoveredClues`.
        *   `DISPLAY_SVM_CONTENT <svmId> <contentType: 'text'|'image'> <contentValue_or_mediaKey>`: Instructs an SVM to display specific text directly or an image/text_block via a mediaKey (referencing its `puzzleInteractions.mediaAssets`).
        *   `UPDATE_PUZZLE_STATE <puzzleId> <path.to.variable> <value>`: (e.g., `UPDATE_PUZZLE_STATE mingTakPuzzle stage 2`).
        *   `AWAIT_SVM_EVENT <svmId> <eventName> [expectedPayloadValuePath]`: A more generic `waitForEvent` that listens for specific events published by an SVM's interactive elements (e.g., `AWAIT_SVM_EVENT svm_mingtak_entrance keypad_success`).
        *   `BRANCH_ON_CLUE <clueId_is_discovered> <trueStep> <falseStep>`: Conditional branching based on whether a clue is in `discoveredClues`.
    *   **UI (`SvmDetailView.jsx`, `PlayerClueLog.jsx` - new):**
        *   `SvmDetailView.jsx`: Needs to be highly dynamic. Based on the SVM's `puzzleInteractions` config for the current `activePuzzleId` and `puzzleStage` (from `WorldStateContext`), it should render:
            *   Static text/images.
            *   Buttons/prompts to "collect" clues (triggering `UNLOCK_CLUE` via script or event).
            *   Simple interactive elements (keypads, etc.) that publish events for `AWAIT_SVM_EVENT`.
            *   A clear indication of its current "mode" or purpose if it changes.
        *   `PlayerClueLog.jsx` (New): A dedicated, filterable, and sortable view where players can review all `discoveredClues`. Each clue could be expandable to show `description`, `source`, `timestamp`, and navigate to `relatedEntities`. Could allow players to mark clues as "important" or "processed".
    *   **AI Tools for Echo (as previously detailed in 3.2):** `getDiscoveredClues`, `getPuzzleStage`, `submitPlayerTheory`, `requestSvmAction`.
    *   **`EventService`**: New events like `svm_interactive_element_used <svmId> <elementId> <value>`, `puzzle_stage_updated <puzzleId> <newStage>`.

### 3.4 Roadmap Refinement (High-Level)

1.  **AI Tool Calling Foundation (v2.3):** Implement the basic framework in `AIService` and `AIChatContainer`. Implement 1-2 simple tools (e.g., `get_svm_details`).
2.  **Gameplay Loop v1 (v2.4):** Design and implement a more engaging loop involving resources or reputation, utilizing the enhanced world state and basic AI tools. Create supporting scripts.
3.  **Visual & Interaction Polish (v2.5):** Focus on UI/UX improvements, animations, and overall aesthetic appeal. Refine `CodeEntryTaskPanel` interactions.
4.  **Advanced AI Tools & Persistence (v2.6+):** Implement more complex AI tools, enhance state persistence.

## 4. Technical Considerations & Challenges

*   **API Key Security:** MUST be addressed before any non-demo deployment (Backend proxy).
*   **State Management Complexity:** As world state grows, ensure `WorldStateContext` remains performant. Event publishing frequency needs monitoring.
*   **AI Tool Calling Reliability:** Handling potential errors or unexpected responses from LLM tool calls.
*   **Prompt Engineering:** Crafting effective system prompts (including language instructions) and tool descriptions.
*   **Testing:** Developing effective testing strategies for event-driven flows, script logic (including `waitForEvent` on `task_outcome`), AI tool calls, and complex puzzle state transitions. Testing the `CodeEntryTaskPanel` flow and new SVM puzzle interactions.
*   **Clue Authoring & Management:** As puzzle complexity grows, designing a scalable system or simple tools for creating, linking, and managing clues and puzzle logic will be crucial. This includes versioning and testing puzzle flows.
*   **Puzzle Logic Robustness & State Integrity:** Ensuring that puzzle states in `WorldStateContext` are updated correctly and consistently, and that branching logic in scripts or SVM interactions doesn't lead to dead ends or corrupted states.
*   **Balancing Guidance and Challenge (Hint System Design):** Crafting the AI (Echo) hints and SVM clue delivery requires careful balance. A tiered hint system (e.g., vague -> specific -> solution) might be needed, possibly tied to AI tool calls like `get_available_hints`.
*   **User Experience (UX) for Clue Interaction & Management:** The UI for viewing clues (on SVMs or in a dedicated log) must be intuitive. If a clue-linking/deduction board feature is considered, its UX needs to be very carefully designed to be helpful rather than cumbersome.

This revised plan provides a clearer path towards evolving the SVM_net demo into a more dynamic, engaging, and AI-integrated experience.

## 5. Detailed Phased Implementation Plan

For a comprehensive, step-by-step guide to implementing the puzzle system and SVM enhancements discussed in Section 3.3, including detailed testing methods and script adaptation notes, please refer to the dedicated document:

*   **[Detailed Puzzle System Implementation Plan](./puzzle_implementation_plan.md)**