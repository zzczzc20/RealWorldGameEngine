// tests/svm05_data_heist.test.js
import ScriptParser from '../src/core/ScriptParser';
// Import reset only
import { _resetForTesting as reset, publish, subscribe, unsubscribe } from '../src/services/EventService';
import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';

describe('svm05_data_heist 脚本执行 (ScriptParser Engine Test)', () => {
  let executionTree; // 存储预构建的执行树
  let engine; // 每个测试都会重新初始化
  let worldState; // Test-specific world state

  // 在所有测试前加载脚本数据
  beforeAll(() => {
    // 加载并解析脚本数据
    try {
      const scriptPath = path.join(process.cwd(), 'scripts/events/svm05_data_heist_main.yaml');
      const yamlContent = fs.readFileSync(scriptPath, 'utf8');
      const scriptData = jsyaml.load(yamlContent);
      executionTree = ScriptParser.buildTreeFromData(scriptData, 'svm05_data_heist_main');
      if (!executionTree) {
        throw new Error('Failed to build execution tree in beforeAll');
      }
    } catch (e) {
      console.error("Error loading/parsing script in beforeAll:", e);
      throw e; // 如果脚本设置失败，快速失败
    }
  });

  // 在每个测试前重置状态
  beforeEach(() => {
    // 重置EventService状态 (clears engines, subscribers, resets getter placeholder)
    reset();

    // 初始化世界状态
    worldState = {
      player: {
        name: "测试玩家",
        credits: 1000,
        inventory: [],
        reputation: {
          CorpSec: -5,
          Underground: 10,
          Tiger_Claws: 15
        }
      },
      svms: { // Using object keyed by ID for easier access
        5: { id: 5, name: "Beach Front SVM", status: "Online", location: "Coastal Promenade", locationName: "海滨长廊" },
        7: { id: 7, name: "Black Market SVM", status: "Online", location: "Underground District", locationName: "黑市" }
      },
      environment: {
        camera_svm5_vicinity: { status: "active" }
      }
    };

    // 使用预构建的执行树创建一个新的引擎实例
    if (!executionTree) {
      throw new Error("Execution tree is missing, cannot run test.");
    }
    // Pass the mock getter function directly to the constructor
    engine = new ScriptParser(executionTree, () => worldState);
  });

  test('场景1：引擎初始化状态检查', () => {
    // 验证脚本引擎正确初始化
    expect(engine).toBeDefined();
    // Simulate scriptStep arrival to trigger initial step logic
    engine.notify('scriptStep'); // Engine uses getter internally now
    const current = engine.getCurrentStep();
    expect(current).not.toBeNull();
    expect(current.stepId).toBe(10);
    expect(current.type).toBe('aiDialogue');
    // Check resolved prompt
    expect(current.prompt).toContain("测试玩家");
    expect(current.prompt).toContain("1000");
    expect(current.prompt).toContain("Black Market SVM");
  });

  test('场景2：任务接受后开始对话', () => {
    // Simulate script activation
    engine.notify('scriptStep'); // Arrive at step 10

    // 验证脚本引擎移动到第一个步骤
    expect(engine.getCurrentStep()?.stepId).toBe(10);
    expect(engine.getCurrentStep()?.type).toBe('aiDialogue');
  });

  test('场景3：玩家没有黑客工具，需要获取', () => {
    // Start engine
    engine.notify('scriptStep'); // Arrive at step 10

    // 模拟对话结束
    engine.notify('dialogueClosed'); // Close step 10 -> 11

    // 验证脚本引擎检查库存
    expect(engine.getCurrentStep()?.stepId).toBe(11);

    // 模拟分支判断（没有工具）
    engine.notify('scriptStep'); // Branch step 11 -> 12

    // 验证脚本引擎移动到获取工具的路径
    expect(engine.getCurrentStep()?.stepId).toBe(12);

    // 模拟对话结束
    engine.notify('dialogueClosed'); // Close step 12 -> 13

    // 验证任务目标更新
    expect(engine.getCurrentStep()?.stepId).toBe(13);
    engine.notify('scriptStep'); // Execute step 13 -> 14

    // 验证等待获取工具
    expect(engine.getCurrentStep()?.stepId).toBe(14);

    // 模拟获取工具
    engine.notify('player_inventory_updated', { addedItemId: 'hacking_tool_corpsec' }); // Satisfy step 14 -> 15

    // 验证脚本引擎移动到确认获取工具的对话
    expect(engine.getCurrentStep()?.stepId).toBe(15);
  });

  test('场景4：玩家已有黑客工具，直接进行黑客操作', () => {
    // 设置玩家已有黑客工具
    worldState.player.inventory.push({ id: 'hacking_tool_corpsec', name: 'CorpSec Hacking Tool', quantity: 1 });

    // Start engine
    engine.notify('scriptStep'); // Arrive at step 10

    // 模拟对话结束
    engine.notify('dialogueClosed'); // Close step 10 -> 11

    // 验证脚本引擎检查库存
    expect(engine.getCurrentStep()?.stepId).toBe(11);

    // 模拟分支判断（有工具）
    engine.notify('scriptStep'); // Branch step 11 -> 20

    // 验证脚本引擎直接移动到黑客操作路径
    expect(engine.getCurrentStep()?.stepId).toBe(20);
  });

  test('场景5：黑客操作成功，但没有Data Spike', () => {
    // 设置玩家已有黑客工具
    worldState.player.inventory.push({ id: 'hacking_tool_corpsec', name: 'CorpSec Hacking Tool', quantity: 1 });

    // Start engine
    engine.notify('scriptStep'); // Arrive at step 10

    // 跳过初始对话
    engine.notify('dialogueClosed');
    engine.notify('scriptStep'); // 分支判断 (step 11 -> 20)

    // 更新任务目标
    engine.notify('scriptStep'); // Execute step 20 -> 21

    // 模拟黑客操作对话
    engine.notify('dialogueClosed'); // Close step 21 -> 22

    // 模拟黑客操作系统提示
    engine.notify('scriptStep'); // Arrive at step 22 (placeholder dialogue)

    // Simulate closing the placeholder dialogue to advance to step 23
    engine.notify('dialogueClosed');
    expect(engine.getCurrentStep()?.stepId).toBe(23); // Now at waitForEvent

    // 模拟黑客操作结果
    engine.notify('minigame_result', { type: 'camera_hack', targetId: 5, outcome: 'success' }); // Satisfies step 23, advances to 24

    // Simulate the queued scriptStep event for the new step (aiDecision at step 24)
    engine.notify('scriptStep');
    // Engine is now waiting at step 24 for 'aiDecisionResult'

    // Simulate the AI deciding based on 'success' outcome (script logic: success -> 30)
    engine.notify('aiDecisionResult', { nextStep: 30 });

    // 验证摄像头禁用 (This happens at step 30)
    expect(engine.getCurrentStep()?.stepId).toBe(30);
    engine.notify('scriptStep'); // Execute step 30 -> 31

    // 模拟对话 (Now at step 31 - aiDialogue)
    engine.notify('dialogueClosed'); // Close the dialogue at step 31 -> 32

    // 验证检查Data Spike (Should now be at step 32)
    expect(engine.getCurrentStep()?.stepId).toBe(32);

    // 模拟分支判断（没有Data Spike） (Execute step 32)
    engine.notify('scriptStep'); // Branch step 32 -> 33

    // 验证脚本引擎移动到获取Data Spike的路径
    expect(engine.getCurrentStep()?.stepId).toBe(33);
  });

  test('场景6：完整任务流程 - 成功路径', () => {
    // 设置玩家已有所有工具
    worldState.player.inventory.push({ id: 'hacking_tool_corpsec', name: 'CorpSec Hacking Tool', quantity: 1 });
    worldState.player.inventory.push({ id: 'data_spike', name: 'Data Spike', quantity: 1 });

    // Start engine
    engine.notify('scriptStep'); // Arrive at step 10

    // 跳过初始对话
    engine.notify('dialogueClosed');
    engine.notify('scriptStep'); // 分支判断 (11 -> 20)

    // 更新任务目标
    engine.notify('scriptStep'); // Execute step 20 -> 21

    // 模拟黑客操作对话
    engine.notify('dialogueClosed'); // Close step 21 -> 22

    // 模拟黑客操作系统提示
    engine.notify('scriptStep'); // Arrive at step 22

    // Simulate closing the placeholder dialogue to advance to step 23
    engine.notify('dialogueClosed');
    expect(engine.getCurrentStep()?.stepId).toBe(23); // Now at waitForEvent

    // 模拟黑客操作结果
    engine.notify('minigame_result', { type: 'camera_hack', targetId: 5, outcome: 'success' }); // Satisfies step 23, advances to 24

    // Simulate the queued scriptStep event for the new step (aiDecision at step 24)
    engine.notify('scriptStep');

    // Simulate the AI deciding based on 'success' outcome (script logic: success -> 30)
    engine.notify('aiDecisionResult', { nextStep: 30 });

    // 摄像头禁用
    expect(engine.getCurrentStep()?.stepId).toBe(30);
    engine.notify('scriptStep'); // Execute step 30 -> 31

    // 模拟对话
    engine.notify('dialogueClosed'); // Close step 31 -> 32

    // 检查Data Spike
    expect(engine.getCurrentStep()?.stepId).toBe(32);
    engine.notify('scriptStep'); // Branch step 32 -> 40 (since player has spike)

    // 更新任务目标
    expect(engine.getCurrentStep()?.stepId).toBe(40);
    engine.notify('scriptStep'); // Execute step 40 -> 41

    // 模拟数据提取对话
    engine.notify('dialogueClosed'); // Close step 41 -> 42

    // 模拟数据提取系统提示
    engine.notify('scriptStep'); // Arrive at step 42 (placeholder dialogue)

    // Simulate closing the placeholder dialogue to advance to step 43
    engine.notify('dialogueClosed');
    expect(engine.getCurrentStep()?.stepId).toBe(43); // Now at waitForEvent

    // 模拟数据提取结果
    engine.notify('minigame_result', { type: 'data_extraction', targetId: 5, outcome: 'success' }); // Satisfies step 43, advances to 44

    // Simulate the queued scriptStep event for the new step (aiDecision at step 44)
    engine.notify('scriptStep');
    // Engine is now waiting at step 44 for 'aiDecisionResult'

    // Simulate the AI deciding based on 'success' outcome (script logic: success -> 50)
    engine.notify('aiDecisionResult', { nextStep: 50 });

    // 添加提取的数据到库存 (This happens at step 50)
    expect(engine.getCurrentStep()?.stepId).toBe(50);
    engine.notify('scriptStep'); // Execute step 50 -> 51

    // 模拟成功对话 (Now at step 51 - aiDialogue)
    engine.notify('dialogueClosed'); // Close the dialogue at step 51 -> 52

    // 验证奖励发放 (Now at step 52 - updateWorldState)
    engine.notify('scriptStep'); // Execute step 52 -> 53

    // 验证声望更新 (Now at step 53)
    engine.notify('scriptStep'); // Execute step 53 -> 54

    // 验证任务完成 (Now at step 54)
    engine.notify('scriptStep'); // Execute step 54 (endScript=true)

    // 验证脚本结束
    expect(engine.isFinished()).toBe(true);
  });

  test('场景7：黑客操作被发现', () => {
    // 设置玩家已有黑客工具
    worldState.player.inventory.push({ id: 'hacking_tool_corpsec', name: 'CorpSec Hacking Tool', quantity: 1 });

    // Start engine
    engine.notify('scriptStep'); // Arrive at step 10

    // 跳过初始对话
    engine.notify('dialogueClosed');
    engine.notify('scriptStep'); // 分支判断 (11 -> 20)

    // 更新任务目标
    engine.notify('scriptStep'); // Execute step 20 -> 21

    // 模拟黑客操作对话
    engine.notify('dialogueClosed'); // Close step 21 -> 22

    // 模拟黑客操作系统提示
    engine.notify('scriptStep'); // Arrive at step 22 (placeholder dialogue)

    // Simulate closing the placeholder dialogue to advance to step 23
    engine.notify('dialogueClosed');
    expect(engine.getCurrentStep()?.stepId).toBe(23); // Now at waitForEvent

    // 模拟黑客操作结果（被发现）
    engine.notify('minigame_result', { type: 'camera_hack', targetId: 5, outcome: 'detected' }); // Satisfies step 23, advances to 24

    // Simulate the queued scriptStep event for the new step (aiDecision at step 24)
    engine.notify('scriptStep');
    // Engine is now waiting at step 24 for 'aiDecisionResult'

    // Simulate the AI deciding based on 'detected' outcome (script logic: detected -> 110)
    engine.notify('aiDecisionResult', { nextStep: 110 });

    // 验证脚本引擎移动到被发现路径
    expect(engine.getCurrentStep()?.stepId).toBe(110);

    // 模拟警报对话 (Now at step 110 - aiDialogue)
    engine.notify('dialogueClosed'); // Close the dialogue at step 110 -> 111

    // 验证声望惩罚 (Now at step 111 - updateWorldState)
    engine.notify('scriptStep'); // Execute step 111 -> 120

    // 验证任务失败 (Now at step 120 - updateWorldState)
    engine.notify('scriptStep'); // Execute step 120 -> 121

    // 验证系统提示 (Now at step 121 - dialogue with endScript: true)
    engine.notify('scriptStep'); // Arrive at step 121
    expect(engine.getCurrentStep()?.stepId).toBe(121);
    expect(engine.isFinished()).toBe(false); // Should not be finished yet

    // Simulate closing the final dialogue
    engine.notify('dialogueClosed'); // Close dialogue at step 121

    // 验证脚本结束 (Closing dialogue with endScript=true should finish it)
    expect(engine.isFinished()).toBe(true);
  });
});