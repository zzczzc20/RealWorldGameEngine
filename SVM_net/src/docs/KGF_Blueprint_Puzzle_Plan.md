# Technical Implementation Plan: KGF_Blueprint_Puzzle

This document outlines the technical design for a new generic task type, `BLUEPRINT_PUZZLE`, based on the requirements for the "KGF_Blueprint_Puzzle".

## 1. Proposed Technology Stack

### 3D Library: `react-three-fiber` & `drei`

*   **Recommendation:** We will use `@react-three/fiber` for rendering the 3D scene and `@react-three/drei` for helpers and controls.
*   **Justification:**
    *   **React-centric:** It integrates seamlessly into our existing React application, allowing us to manage the 3D scene with components and hooks, which is consistent with the current architecture.
    *   **Performance:** `react-three-fiber` is highly optimized and renders on a separate loop, ensuring the 3D interactions do not block the main UI thread.
    *   **Rich Ecosystem:** `drei` provides pre-built helpers for cameras, controls (`OrbitControls`), and geometric shapes, which significantly speeds up development for features like rotation, zooming, and creating the blueprint nodes. This allows us to achieve the desired holographic effect with less boilerplate code.
    *   **Complexity vs. Effect:** While introducing a 3D library adds some complexity, the declarative nature of `react-three-fiber` makes it far more approachable than raw `three.js`. The high-quality interactive result justifies this learning curve.

## 2. Component Structure

New components will be created in `SVM_net/src/components/`.

*   **`BlueprintPuzzleGame.jsx`**
    *   **Responsibility:** A wrapper component, similar to the existing [`LogicPuzzleGame.jsx`](SVM_net/src/components/LogicPuzzleGame.jsx:1). It will manage the overall state of the puzzle (e.g., `playing`, `completed`) and handle the `onSuccess` callback to the main `App.jsx` component. It will not contain any core puzzle logic itself but will render the main view.

*   **`BlueprintPuzzleView.jsx`**
    *   **Responsibility:** This is the core component for the puzzle. It will host the `react-three-fiber` `Canvas` element. It will be responsible for setting up the 3D scene, lighting, camera, and rendering the blueprint nodes. It will also manage the state of the nodes (their current positions/rotations) and check the win condition.

*   **`BlueprintNode.jsx`**
    *   **Responsibility:** A reusable 3D component representing a single interactive node in the blueprint. It will handle its own state (e.g., position, rotation) and manage user interactions like dragging or clicking, using hooks like `use-gesture`. It will receive its initial and correct state as props.

## 3. Data Structure Design

### `taskData.js` Entry

A new entry will be added to the tasks array in [`SVM_net/src/data/taskData.js`](SVM_net/src/data/taskData.js:1).

```javascript
// In SVM_net/src/data/taskData.js

{
  taskId: "KGF_BLUEPRINT_PUZZLE",
  title: "解构：KGF的蓝图",
  description: "调查KGF留下的全息建筑蓝图。其中几个关键节点被错位放置，似乎遵循着某种悖论性的设计哲学。根据他留下的笔记调整蓝图以揭示秘密。",
  reward: 600,
  difficulty: "Hard",
  estimatedTime: "25 mins",
  relatedSvmId: null,
  type: "BLUEPRINT_PUZZLE", // New task type
  initiallyVisible: false,
  successMessage: "蓝图已校准。一个隐藏的隔间被揭示出来。",
  failureMessage: "蓝图结构不稳定，请重新评估设计哲学。",
  puzzleData: {
    cameraPosition: [0, 5, 15], // Initial camera position [x, y, z]
    notes: [
      "一个庇护所就是一个牢笼。",
      "一个出口就是一个陷阱。",
      "最稳定的支撑来自虚空。"
    ],
    nodes: [
      {
        id: 'node_safe_zone',
        name: 'Safe Zone',
        paradoxRule: 'A sanctuary is a cage.',
        initialState: { position: [5, 2, 3], rotation: [0, 0, 0], scale: [2, 0.1, 2] },
        correctState: { rotation: [Math.PI / 2, 0, 0] }, // Example: Rotate it to be 'enclosed'
        meshType: 'box', // or 'plane', 'sphere' etc.
        color: '#00ff00'
      },
      {
        id: 'node_exit_sign',
        name: 'Exit Sign',
        paradoxRule: 'An exit is a trap.',
        initialState: { position: [-8, 4, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 0.1] },
        correctState: { position: [-8, 4, -2] }, // Example: Move it to a dead end
        meshType: 'box',
        color: '#ff0000'
      },
      {
        id: 'node_load_bearing_column',
        name: 'Load-Bearing Column',
        paradoxRule: 'The most stable support comes from the void.',
        initialState: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 8, 1] },
        correctState: { scale: [0.01, 8, 0.01] }, // Example: Make it disappear ('the void')
        meshType: 'cylinder',
        color: '#ffffff'
      }
    ],
    // Defines the final event after solving the puzzle
    successEvent: {
      type: 'PROJECT_LIGHT',
      targetPosition: [-2, 1, 5],
      switchType: 'inverted_exclamation'
    }
  }
}
```

## 4. Logic Implementation Plan

*   **Paradoxical Rule Encoding:**
    The `paradoxRule` string in each node's data structure directly links it to one of the philosophical notes. The validation logic will not parse the string itself. Instead, the `correctState` object defines the *result* of applying that rule. The game logic simply checks if the node's current state matches its `correctState`. For example, the action of "making a safe zone a cage" is pre-translated into a target rotation or position in `correctState`.

*   **State Management & Validation:**
    1.  **Component State:** The primary state for the puzzle will be managed within the `BlueprintPuzzleView.jsx` component using `React.useState`. A state variable, `nodeStates`, will hold an object or map of the current `position`, `rotation`, and `scale` for each node, keyed by `node.id`.
    2.  **Interaction:** The `BlueprintNode.jsx` component will use a library like `@use-gesture/react` to handle drag events. When a player manipulates a node, the `onDrag` handler will update the shared state in `BlueprintPuzzleView.jsx` via a callback function passed as a prop.
    3.  **Validation Check:** After each interaction (e.g., on drag end), a `checkSolution()` function in `BlueprintPuzzleView.jsx` will be triggered. This function will iterate through the `nodeStates` and compare the current state of each node against its `correctState` from `taskData.js`. A small tolerance/threshold will be used for comparing floating-point numbers (positions and rotations) to prevent precision issues.
    4.  **Win Condition:** The puzzle is solved when **all** nodes simultaneously match their `correctState`. When this condition is met, `BlueprintPuzzleView` will call the `onSolve` prop (which is passed down from `BlueprintPuzzleGame`).

## 5. Integration Points

*   **[`App.jsx`](SVM_net/src/App.jsx:1) Integration:**
    A new `case` will be added to the task rendering logic to handle the `BLUEPRINT_PUZZLE` type.

    ```javascript
    // In SVM_net/src/App.jsx, find the block rendering task panels (~line 311)
    // and add a new 'else if' condition for the 'BLUEPRINT_PUZZLE' type.

    } else if (taskDetails && taskDetails.type === 'LOGIC_PUZZLE') {
        // ... existing Logic Puzzle JSX ...
    } else if (taskDetails && taskDetails.type === 'BLUEPRINT_PUZZLE') { // ADD THIS BLOCK
        codeEntryPanel = (
            <BlueprintPuzzleGame
                isVisible={true}
                taskData={taskDetails}
                onClose={handleCodeEntryClose}
                onSuccess={(result) => {
                    console.log('[App.jsx] Blueprint Puzzle Solved:', result);
                    worldStateContext.completeTask(taskDetails.taskId, result);
                    handleCodeEntryClose();
                }}
                onFailure={(result) => {
                    console.log('Blueprint Puzzle Failed:', result);
                    // Handle failure, e.g. close or allow retry
                }}
            />
        );
    }
    ```

*   **`onSuccess` Event Handling:**
    As shown above, the `onSuccess` prop of `<BlueprintPuzzleGame>` will be wired to call `worldStateContext.completeTask(taskDetails.taskId, result)`. This reuses the exact same robust event flow as all other tasks. The `WorldStateContext` will then publish the `'task_completed'` event, which the `ScriptParser` is already listening for, ensuring the main game script progresses correctly without any changes needed to the event system.