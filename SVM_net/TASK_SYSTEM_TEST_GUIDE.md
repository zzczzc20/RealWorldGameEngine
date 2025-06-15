# 任务系统测试指南

本指南说明如何测试新实现的任务解锁和完成系统，包括与裂隙调谐器小游戏的集成。

## 新功能概述

### 1. 新的脚本指令

#### UNLOCK_TASK
解锁一个任务，使其在任务列表中可见和可执行。

```yaml
unlock_task_step:
  type: "UNLOCK_TASK"
  taskId: "rift_tuner_love_echo"
  nextStep: "next_step_id"
```

#### WAIT_FOR_TASK_COMPLETED
等待指定任务完成，可以暂停脚本执行直到任务完成。

```yaml
wait_step:
  type: "WAIT_FOR_TASK_COMPLETED"
  taskId: "rift_tuner_love_echo"
  nextStep: "task_completed_step"
  stepIdOnWait: "waiting_step"  # 可选：任务未完成时的循环步骤
```

### 2. WorldStateContext 增强

- 新增 `unlockedTasks` 和 `completedTasks` 状态
- 新增 `unlockTask()` 和 `completeTask()` 方法
- 任务状态持久化到 localStorage

### 3. 裂隙调谐器集成

- RiftTunerGame 组件现在会自动通知任务完成
- 任务结果包含分数、捕获消息数等数据
- 脚本可以通过 `{{lastEventData}}` 访问任务结果

## 测试步骤

### 步骤 1：启动测试脚本

1. 打开应用程序
2. 在开发者控制台中运行：
```javascript
// 启动测试脚本
import { publish } from './src/services/EventService.js';
publish('script_start', { scriptId: 'rift_tuner_test' });
```

### 步骤 2：验证任务解锁

1. 按照脚本提示进行
2. 当脚本执行到 `UNLOCK_TASK` 步骤时，检查：
   - 任务列表中是否出现新任务
   - 控制台是否显示任务解锁日志
   - WorldStateContext 的 `unlockedTasks` 是否包含新任务

### 步骤 3：测试任务等待机制

1. 脚本应该在 `WAIT_FOR_TASK_COMPLETED` 步骤暂停
2. 验证：
   - 脚本不会自动继续
   - 显示等待提示消息
   - 可以循环显示等待消息

### 步骤 4：完成裂隙调谐器任务

1. 在任务列表中找到"裂隙调谐器测试"任务
2. 点击开始任务
3. 完成频率调谐小游戏：
   - 调整频率滑块使其接近目标频率
   - 保持信号锁定 3 秒
   - 捕获所有可用消息
4. 验证任务完成通知

### 步骤 5：验证脚本继续

1. 任务完成后，脚本应该自动继续
2. 检查：
   - 脚本显示任务结果数据
   - `{{lastEventData}}` 变量包含正确信息
   - WorldStateContext 的 `completedTasks` 包含完成记录

## 调试工具

### 控制台命令

```javascript
// 查看当前世界状态
const { getWorldState } = useWorldStateContext();
console.log(getWorldState());

// 手动解锁任务
const { unlockTask } = useWorldStateContext();
unlockTask('test_task_id');

// 手动完成任务
const { completeTask } = useWorldStateContext();
completeTask('test_task_id', { score: 100, testData: 'success' });

// 查看任务状态
const worldState = getWorldState();
console.log('解锁的任务:', worldState.unlockedTasks);
console.log('完成的任务:', worldState.completedTasks);
```

### 事件监听

```javascript
// 监听任务相关事件
import { subscribe } from './src/services/EventService.js';

subscribe('task_unlocked', (data) => {
  console.log('任务解锁:', data);
});

subscribe('task_completed', (data) => {
  console.log('任务完成:', data);
});
```

## 预期结果

### 成功测试应该显示：

1. **任务解锁阶段**：
   - 控制台日志：`[WorldStateContext] Task 'rift_tuner_test_demo' unlocked.`
   - 任务列表中出现新任务
   - 脚本继续到下一步

2. **等待阶段**：
   - 脚本暂停执行
   - 显示等待提示
   - 任务列表中任务可点击

3. **任务完成阶段**：
   - 控制台日志：`[WorldStateContext] Task 'rift_tuner_test_demo' completed.`
   - 发布 `task_completed` 事件
   - 脚本自动继续

4. **结果显示阶段**：
   - 脚本显示任务结果数据
   - 包含分数、消息数、完成时间等信息

## 故障排除

### 常见问题

1. **任务未解锁**：
   - 检查 taskId 是否正确
   - 验证 ScriptParser 是否处理 UNLOCK_TASK
   - 查看控制台错误信息

2. **脚本未暂停**：
   - 确认 WAIT_FOR_TASK_COMPLETED 语法正确
   - 检查 taskId 匹配
   - 验证 ScriptParser 的等待逻辑

3. **任务完成未触发继续**：
   - 确认 RiftTunerGame 调用了 completeTaskInContext
   - 检查事件发布是否正确
   - 验证 ScriptParser 的事件监听

4. **数据未传递**：
   - 检查 lastEventData 的设置
   - 验证占位符解析
   - 确认事件数据格式

## 扩展测试

### 测试其他任务类型

可以创建不同类型的任务来测试系统的灵活性：

```yaml
# 简单完成任务
simple_task:
  type: "UNLOCK_TASK"
  taskId: "simple_test"
  nextStep: "wait_simple"

wait_simple:
  type: "WAIT_FOR_TASK_COMPLETED"
  taskId: "simple_test"
  nextStep: "simple_done"
```

### 测试多任务场景

```yaml
# 并行任务
parallel_tasks:
  type: "UNLOCK_TASK"
  taskId: "task_a"
  nextStep: "unlock_task_b"

unlock_task_b:
  type: "UNLOCK_TASK"
  taskId: "task_b"
  nextStep: "wait_any_task"
```

这个测试系统为 SVM_net 框架提供了强大的任务管理能力，特别适合集成小游戏和交互式内容。