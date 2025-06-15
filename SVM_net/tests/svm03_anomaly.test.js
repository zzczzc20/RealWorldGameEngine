// svm03_anomaly.test.js
// Tests the ScriptParser engine execution for the svm03_anomaly script.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml'; // Import yaml parser
// Import reset only
import { _resetForTesting as reset } from '../src/services/EventService';
import ScriptParser from '../src/core/ScriptParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('svm03_anomaly 脚本执行 (ScriptParser Engine Test)', () => {
  const scriptPath = path.resolve(__dirname, '../scripts/events/svm03_anomaly.yaml');
  let executionTree; // Store the pre-built tree
  let engine; // Will be re-initialized for each test
  let worldState; // Define worldState here

  beforeAll(() => {
    // Load and parse the script data once
    try {
      const yamlContent = fs.readFileSync(scriptPath, 'utf8');
      const scriptData = yaml.load(yamlContent);
      executionTree = ScriptParser.buildTreeFromData(scriptData, 'svm03_anomaly');
      if (!executionTree) {
        throw new Error('Failed to build execution tree in beforeAll');
      }
    } catch (e) {
      console.error("Error loading/parsing script in beforeAll:", e);
      throw e; // Fail fast if script setup fails
    }
  });

  beforeEach(() => {
    // Reset EventService (optional but good practice for isolation)
    reset();

    // Initialize world state for this test
    worldState = {
        player: { name: "Test Runner", credits: 500, inventory: [], reputation: {} },
        // Use an array for svms, consistent with application state
        svms: [ 
            { id: 3, status: 'Online', name: 'Tech Park SVM', locationName: 'Tech Park' } 
        ],
    };

    // Create a fresh engine instance for each test using the pre-built tree
    if (!executionTree) {
       throw new Error("Execution tree is missing, cannot run test.");
    }
    // Pass the mock getter function directly to the constructor
    engine = new ScriptParser(executionTree, () => worldState);

  });

  test('场景1：引擎初始化状态检查', () => {
    // Engine should start at the entry point defined in the tree
    // Simulate scriptStep arrival to trigger initial step logic
    engine.notify('scriptStep'); // Engine uses getter internally now
    const current = engine.getCurrentStep();
    expect(current).not.toBeNull();
    expect(current.stepId).toBe(1); // Check against the actual entry point
    expect(current.type).toBe('dialogue');
    expect(current.character).toBe('Nova');
    expect(current.text).toContain('检测到 SVM-03 信号异常');
  });

  test('场景2：用户拒绝任务，脚本跳转至 stepId 4 并结束', () => {
    // Prerequisite: Reach step 2 (taskOffer)
    engine.notify('scriptStep'); // Arrive step 1
    engine.notify('dialogueClosed'); // Close step 1 -> current = 2
    expect(engine.getCurrentStep()?.stepId).toBe(2);
    expect(engine.getCurrentStep()?.type).toBe('taskOffer');

    // Action: User declines task
    engine.notify('branchChoice', { choice: 'Decline' }); // -> current = 4
    expect(engine.getCurrentStep()?.stepId).toBe(4);
    expect(engine.getCurrentStep()?.type).toBe('dialogue');

    // Action: Close the final dialogue (step 4 has endScript: true)
    engine.notify('dialogueClosed'); // -> finished = true

    // Assertion: Script should be finished
    expect(engine.isFinished()).toBe(true);
  });

  test('场景3：用户接受任务，跳转至 stepId 5', () => {
    // Prerequisite: Reach step 2 (taskOffer)
    engine.notify('scriptStep'); // Arrive step 1
    engine.notify('dialogueClosed'); // Close step 1 -> current = 2
    expect(engine.getCurrentStep()?.stepId).toBe(2);

    // Action: User accepts task
    engine.notify('branchChoice', { choice: 'Accept' }); // -> current = 3
    // Action: Process updateWorldState step
    engine.notify('scriptStep'); // Process step 3 -> current = 5

    // Assertion
    expect(engine.getCurrentStep()?.stepId).toBe(5);
    expect(engine.getCurrentStep()?.type).toBe('dialogue');
    expect(engine.getCurrentStep()?.text).toContain('任务已接受');
  });

  test('场景4：到达SVM-3且状态为Offline', () => {
    // Prerequisite: Reach step 6 (waitForEvent: arrived_at_svm_3)
    engine.notify('scriptStep'); // Arrive step 1
    engine.notify('dialogueClosed'); // Close step 1 -> current = 2
    engine.notify('branchChoice', { choice: 'Accept' }); // -> current = 3
    engine.notify('scriptStep'); // Process step 3 -> current = 5
    engine.notify('dialogueClosed'); // Close step 5 -> current = 6
    expect(engine.getCurrentStep()?.stepId).toBe(6); // Verify we are at step 6
    expect(engine.getCurrentStep()?.type).toBe('waitForEvent');

    // Action: Arrive event occurs with Offline status
    // Find the SVM in the array and update its status
    const svmToUpdateOffline = worldState.svms.find(s => s.id === 3);
    if (svmToUpdateOffline) svmToUpdateOffline.status = 'Offline';
    engine.notify('arrived_at_svm_3'); // Process step 6 -> current = 7
    // Process branch step
    engine.notify('scriptStep'); // Process step 7 -> current = 8

    // Assertion: Should branch to step 8
    const current = engine.getCurrentStep();
    expect(current?.stepId).toBe(8);
    expect(current?.type).toBe('dialogue');
    expect(current?.text).toContain('SVM-03 已离线');

    // Optional: Check next step after closing dialogue
    engine.notify('dialogueClosed'); // Close step 8 -> current = 10
    expect(engine.getCurrentStep()?.stepId).toBe(10);
    expect(engine.getCurrentStep()?.type).toBe('taskOffer');
  });

  test('场景5：到达SVM-3且状态为Online', () => {
    // Prerequisite: Reach step 6 (waitForEvent: arrived_at_svm_3)
    engine.notify('scriptStep'); // Arrive step 1
    engine.notify('dialogueClosed'); // Close step 1 -> current = 2
    engine.notify('branchChoice', { choice: 'Accept' }); // -> current = 3
    engine.notify('scriptStep'); // Process step 3 -> current = 5
    engine.notify('dialogueClosed'); // Close step 5 -> current = 6
    expect(engine.getCurrentStep()?.stepId).toBe(6); // Verify we are at step 6

    // Action: Arrive event occurs with Online status
    // Find the SVM in the array and update its status
    const svmToUpdateOnline = worldState.svms.find(s => s.id === 3);
    if (svmToUpdateOnline) svmToUpdateOnline.status = 'Online';
    engine.notify('arrived_at_svm_3'); // Process step 6 -> current = 7
    // Process branch step
    engine.notify('scriptStep'); // Process step 7 -> current = 9

    // Assertion: Branched to step 9
    const current = engine.getCurrentStep();
    expect(current?.stepId).toBe(9);
    expect(current?.type).toBe('dialogue');
    expect(current?.text).toContain('SVM-03 仍在运行');

    // Optional: Check next step after closing dialogue
    engine.notify('dialogueClosed'); // Close step 9 -> current = 10
    expect(engine.getCurrentStep()?.stepId).toBe(10);
    expect(engine.getCurrentStep()?.type).toBe('taskOffer');
  });
}); // End of describe block