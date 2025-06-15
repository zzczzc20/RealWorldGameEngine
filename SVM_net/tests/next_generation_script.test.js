// tests/next_generation_script.test.js
import ScriptParser from '../src/core/ScriptParser';
import { _resetForTesting as reset } from '../src/services/EventService'; // Only need reset here

describe('下一代脚本功能测试', () => {
  let executionTree; // Common execution tree if applicable
  let engine;
  let mockWorldState;

  // Helper function to create engine with mock getter
  const createEngine = (scriptData) => {
    // Ensure mockWorldState is defined for the current test scope
    if (!mockWorldState) {
        throw new Error("mockWorldState is not defined before creating engine");
    }
    // Build tree if not already built (or if scriptData varies per test)
    const tree = ScriptParser.buildTreeFromData(scriptData); 
    if (!tree) {
        throw new Error("Failed to build execution tree");
    }
    return new ScriptParser(tree, () => mockWorldState); // Pass mock getter
  };

  beforeEach(() => {
    reset(); // Reset EventService state if needed by tests
    // Define a default mock state for most tests
    mockWorldState = {
      player: { name: "测试玩家", credits: 1000, inventory: [{id: 'hacking_tool_basic', name: '黑客工具', quantity: 1}], reputation: { CorpSec: -5 } },
      svms: { 
          3: { id: 3, status: 'Offline', locationName: '科技园' },
          5: { id: 5, status: 'Online', locationName: '商业区' },
          7: { id: 7, status: 'Online', locationName: '黑市' }
      },
      // Add other states as needed
    };
  });

  describe('动态内容注入 (${...})', () => {
    test('解析文本中的占位符', () => {
      const scriptData = {
        scriptId: 'placeholder_test_1',
        steps: [
          { stepId: 1, type: 'dialogue', text: '你好，${player.name}！你现在有 ${player.credits} 信用点。', nextStep: null }
        ]
      };
      engine = createEngine(scriptData);
      engine.notify('scriptStep'); // Trigger processing for step 1
      
      const step = engine.getCurrentStep();
      expect(step.text).toBe('你好，测试玩家！你现在有 1000 信用点。');
    });

    test('处理嵌套对象和数组索引', () => {
       // Update mock state for this test
       mockWorldState.player.inventory = [{ id: 'hacking_tool_basic', name: '黑客工具', quantity: 1 }];
       mockWorldState.svms = { 5: { id: 5, locationName: '商业区' } }; // Ensure SVM 5 exists

       const scriptData = {
         scriptId: 'placeholder_test_2',
         steps: [
           { stepId: 1, type: 'dialogue', text: '你的第一个物品是 ${player.inventory[0].name}，位于 ${svm[5].locationName}。', nextStep: null }
         ]
       };
       engine = createEngine(scriptData);
       engine.notify('scriptStep');
       
       const step = engine.getCurrentStep();
       expect(step.text).toBe('你的第一个物品是 黑客工具，位于 商业区。');
    });

    test('处理taskOffer中的占位符', () => {
        // Ensure SVM 7 exists in mock state
        mockWorldState.svms = { 7: { id: 7, name: 'SVM-07', locationName: '黑市' } };

        const scriptData = {
            scriptId: 'placeholder_test_3',
            steps: [
                { 
                    stepId: 1, 
                    type: 'taskOffer', 
                    task: { 
                        taskId: 101, 
                        title: '前往 ${svm[7].name}', 
                        description: '前往 ${svm[7].locationName} 的 ${svm[7].name}，获取更多信息。你当前有 ${player.credits} 信用点。'
                    }, 
                    nextStepOnAccept: null, 
                    nextStepOnDecline: null 
                }
            ]
        };
        engine = createEngine(scriptData);
        engine.notify('scriptStep'); // Process step 1

        const step = engine.getCurrentStep();
        expect(step.task.title).toBe('前往 SVM-07');
        expect(step.task.description).toBe('前往 黑市 的 SVM-07，获取更多信息。你当前有 1000 信用点。');
    });
  });

  describe('增强条件分支 (branch)', () => {
    // Setup common script structure for branch tests
    const branchScriptBase = {
      scriptId: 'branch_test',
      steps: [
        { stepId: 1, type: 'branch', condition: null, nextStepOnTrue: 2, nextStepOnFalse: 3 },
        { stepId: 2, type: 'dialogue', text: '条件为真', endScript: true },
        { stepId: 3, type: 'dialogue', text: '条件为假', endScript: true }
      ]
    };

    test('简单条件判断 (===)', () => {
      const scriptData = JSON.parse(JSON.stringify(branchScriptBase)); // Deep copy
      scriptData.steps[0].condition = { target: 'player', property: 'name', operator: '===', value: '测试玩家' };
      engine = createEngine(scriptData);
      engine.notify('scriptStep'); // Evaluate branch at step 1

      const step = engine.getCurrentStep();
      expect(step.stepId).toBe(2); // Should go to true path
      expect(step.text).toBe('条件为真');
    });

     test('简单条件判断 (!==)', () => {
      const scriptData = JSON.parse(JSON.stringify(branchScriptBase));
      scriptData.steps[0].condition = { target: 'player', property: 'credits', operator: '!==', value: 500 };
      engine = createEngine(scriptData);
      engine.notify('scriptStep');

      const step = engine.getCurrentStep();
      expect(step.stepId).toBe(2); // 1000 !== 500 is true
      expect(step.text).toBe('条件为真');
    });

    test('复杂条件判断 (AND)', () => {
       mockWorldState.svms = { 3: { id: 3, status: 'Offline' } }; // Ensure SVM 3 exists and is Offline
       mockWorldState.player.credits = 150; // Ensure credits >= 100

       const scriptData = JSON.parse(JSON.stringify(branchScriptBase));
       scriptData.steps[0].condition = {
         operator: 'AND',
         clauses: [
           { target: 'svms', id: 3, property: 'status', operator: '===', value: 'Offline' },
           { target: 'player', property: 'credits', operator: '>=', value: 100 }
         ]
       };
       scriptData.steps[1].text = 'SVM-03 已离线，且你有足够的信用点'; // Adjust text for clarity
       engine = createEngine(scriptData);
       engine.notify('scriptStep');
       
       const step = engine.getCurrentStep();
       expect(step.stepId).toBe(2); // Should go to true path
       expect(step.text).toBe('SVM-03 已离线，且你有足够的信用点');
    });

     test('复杂条件判断 (OR)', () => {
       mockWorldState.svms = { 3: { id: 3, status: 'Online' } }; // Status is Online (first clause false)
       mockWorldState.player.credits = 150; // Credits >= 100 (second clause true)

       const scriptData = JSON.parse(JSON.stringify(branchScriptBase));
       scriptData.steps[0].condition = {
         operator: 'OR',
         clauses: [
           { target: 'svms', id: 3, property: 'status', operator: '===', value: 'Offline' }, // False
           { target: 'player', property: 'credits', operator: '>=', value: 100 } // True
         ]
       };
        scriptData.steps[1].text = '至少一个条件满足'; // Adjust text
       engine = createEngine(scriptData);
       engine.notify('scriptStep');
       
       const step = engine.getCurrentStep();
       expect(step.stepId).toBe(2); // Should go to true path
       expect(step.text).toBe('至少一个条件满足');
    });
  });

  describe('AI驱动的对话 (aiDialogue)', () => {
    test('处理aiDialogue步骤', () => {
       mockWorldState.svms = { 3: { id: 3, locationName: '中央广场', status: 'Offline' } }; // Add necessary state

       const scriptData = {
         scriptId: 'ai_dialogue_test',
         steps: [
           { 
             stepId: 1, 
             type: 'aiDialogue', 
             prompt: '你是Nova，向玩家${player.name}介绍SVM-03的情况。它位于${svm[3].locationName}，状态为${svm[3].status}。', 
             nextStep: 2 
           },
           { stepId: 2, type: 'dialogue', text: '结束', endScript: true }
         ]
       };
       engine = createEngine(scriptData);
       engine.notify('scriptStep'); // Arrive at step 1
       
       const step = engine.getCurrentStep();
       expect(step.type).toBe('aiDialogue');
       // Check resolved prompt
       expect(step.prompt).toBe('你是Nova，向玩家测试玩家介绍SVM-03的情况。它位于中央广场，状态为Offline。');
       
       // Simulate dialogue closing event
       engine.notify('dialogueClosed', {});
       expect(engine.getCurrentStep()?.stepId).toBe(2); // Should advance
    });
  });

  describe('AI决策点 (aiDecision)', () => {
     test('处理aiDecision步骤', () => {
       mockWorldState.player.reputation = { CorpSec: -5 }; // Set initial reputation
       mockWorldState.player.inventory = [{ id: 'hacking_tool_basic', name: '黑客工具', quantity: 1 }]; // Player has tool

       const scriptData = {
         scriptId: 'ai_decision_test',
         steps: [
           {
             stepId: 1,
             type: 'aiDecision',
             prompt: '评估玩家当前与CorpSec的声望 (${player.reputation.CorpSec}) 以及他们是否携带黑客工具。基于此决定下一步行动。',
             options: [
               { 
                 condition: "reputation >= 0 and has_hacking_tool", 
                 nextStep: 2,
                 description: "玩家声望良好且有黑客工具"
               },
               { 
                 condition: "reputation < 0 and has_hacking_tool", 
                 nextStep: 3,
                 description: "玩家声望不佳但有黑客工具"
               },
               { 
                 condition: "not has_hacking_tool", 
                 nextStep: 4,
                 description: "玩家没有黑客工具"
               }
             ],
             defaultNextStep: 4
           },
           { stepId: 2, type: 'dialogue', text: '声望良好且有黑客工具', nextStep: 5 },
           { stepId: 3, type: 'dialogue', text: '声望不佳但有黑客工具', nextStep: 5 },
           { stepId: 4, type: 'dialogue', text: '没有黑客工具或默认路径', nextStep: 5 },
           { stepId: 5, type: 'dialogue', text: '结束', endScript: true }
         ]
       };

       engine = createEngine(scriptData);
       engine.notify('scriptStep'); // Arrive at step 1
       
       const step = engine.getCurrentStep();
       expect(step.type).toBe('aiDecision');
       // Check resolved prompt
       expect(step.prompt).toBe('评估玩家当前与CorpSec的声望 (-5) 以及他们是否携带黑客工具。基于此决定下一步行动。');
       
       // Simulate AI decision result (based on state: rep < 0, has tool -> should be step 3)
       engine.notify('aiDecisionResult', { nextStep: 3 });
       const nextStep = engine.getCurrentStep();
       expect(nextStep.stepId).toBe(3);
       expect(nextStep.text).toBe('声望不佳但有黑客工具');
    });
  });
});