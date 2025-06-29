// src/data/taskData.js

// Task definitions for the SVM_net demo
const tasks = [
  // --- 裂隙调谐器任务 ---
  {
    taskId: "RIFT_TUNER_ECHO",
    title: "裂隙调谐：回声信号",
    description: "检测到异常时空扰动，需要使用裂隙调谐器捕捉来自平行意识的信号片段。调谐到正确频率以接收完整的回声信息。",
    reward: 200,
    difficulty: "Medium",
    estimatedTime: "15 mins",
    relatedSvmId: null,
    type: "RIFT_TUNER",
    targetPersona: "Echo",
    initiallyVisible: false, // 只有在脚本执行UNLOCK_TASK后才显示
    riftMessages: [
      "在另一个可能性中...我选择了不同的道路。",
      "你以为你了解真相？呵，真相有无数个版本。",
      "每一个选择都会分裂现实，创造新的时间线。",
      "我看到了你未曾做出的决定...那些被遗忘的可能性。",
      "在某个平行世界里，我们从未相遇。",
      "时间不是线性的，它是一张破碎的网。",
      "你的每个念头都在创造新的现实分支。",
      "我是你可能成为的人，也是你永远不会成为的人。"
    ],
    successMessage: "裂隙调谐完成。回声信号已完全接收。",
    failureMessage: "信号不稳定，裂隙调谐失败。"
  },

  {
    taskId: "RIFT_TUNER_KIERA",
    title: "裂隙调谐：记忆碎片",
    description: "Kiera的意识信号出现异常波动，需要通过裂隙调谐器稳定频率，接收她的记忆碎片信息。",
    reward: 250,
    difficulty: "Hard",
    estimatedTime: "20 mins",
    relatedSvmId: null,
    type: "RIFT_TUNER",
    targetPersona: "Kiera",
    riftMessages: [
      "为什么父亲...父亲要这样做？",
      "我从出生开始就没见过妈妈",
      "笼中鸟的生活不是我想要的",
      "我...我只是个复制品。",
    ],
    successMessage: "记忆碎片重组完成。Kiera的意识信号已稳定。",
    failureMessage: "记忆碎片丢失，无法完成重组。"
  },

  {
    taskId: "RIFT_TUNER_AHMING",
    title: "裂隙调谐：情感回响",
    description: "阿明的情感模块出现共振现象，通过裂隙调谐器可以接收到他内心深处的真实想法。",
    reward: 180,
    difficulty: "Easy",
    estimatedTime: "12 mins",
    relatedSvmId: null,
    type: "RIFT_TUNER",
    targetPersona: "Ahming",
    initiallyVisible: false, // 只有在脚本执行UNLOCK_TASK后才显示
    riftMessages: [
      "我只是想要一个正常的生活...这要求过分吗？",
      "有时候我觉得自己像个局外人，永远无法真正融入。",
      "奶奶说过，善良是最珍贵的品质，但这个世界似乎不这么认为。",
      "我害怕改变，但我更害怕永远停留在原地。",
      "每个人都有自己的故事，我只是想找到属于我的那一章。",
      "孤独不是没有人陪伴，而是没有人理解。",
      "我想要勇敢，但勇气从何而来？",
      "也许...也许我比自己想象的更强大。"
    ],
    successMessage: "情感回响接收完成。阿明的内心世界已被理解。",
    failureMessage: "情感信号微弱，无法建立连接。"
  },

  // --- 测试任务（初始可见） ---
  // {
  //   taskId: "TEST_VISIBLE_TASK",
  //   title: "测试任务：初始可见",
  //   description: "这是一个测试任务，用于验证 initiallyVisible 功能是否正常工作。",
  //   reward: 100,
  //   difficulty: "Easy",
  //   estimatedTime: "5 mins",
  //   relatedSvmId: null,
  //   type: "TEST",
  //   initiallyVisible: true, // 这个任务应该在初始状态下显示
  //   successMessage: "测试任务完成。",
  //   failureMessage: "测试任务失败。"
  // }

  // --- 保留注释的旧任务作为参考 ---
  // --- SVM-03 Anomaly Task ---
  // {
  //   taskId: 206, // Keep the original uplink repair task ID if needed elsewhere, or renumber if cleaning up
  //   title: "Restore Network Uplink (SVM-03)",
  //   description: "Critical uplink node SVM-03 offline due to EMP surge. Reach the Tech Park SVM and manually reboot the uplink sequence. Access code: DELTA-7.",
  //   reward: 150,
  //   difficulty: "Medium",
  //   estimatedTime: "35 mins",
  //   relatedSvmId: 3,
  //   type: "CODE_ENTRY", // Use the new type
  //   correctCode: "DELTA-7", // Add the correct code here
  //   successMessage: "Network connection re-established.", // Message for UI on success
  //   failureMessage: "Access Denied. Incorrect Code.", // Message for UI on failure
  // },
  {
    "taskId": "KGF_Blueprint_Puzzle",
    "taskName": "KGF's Blueprint",
    "type": "BLUEPRINT_PUZZLE",
    "description": "Decipher the paradoxical design principles in KGF's blueprint to uncover its true purpose.",
    "puzzleData": {
      "cameraPosition": [0, 5, 15],
      "notes": [
        "A sanctuary is a cage.",
        "An exit is a trap.",
        "The most stable support comes from the void."
      ],
      "nodes": [
        {
          "id": "node_sanctuary",
          "name": "Sanctuary Module",
          "paradoxRule": "CAGE",
          "initialState": { "position": [-5, 0, 0], "rotation": [0, 0, 0], "scale": [2, 2, 2] },
          "correctState": { "rotation": [0, 3.14159, 0] },
          "meshType": "box",
          "color": "#4a90e2"
        },
        {
          "id": "node_exit",
          "name": "Exit Archway",
          "paradoxRule": "TRAP",
          "initialState": { "position": [5, 0, 0], "rotation": [0, 0, 0], "scale": [1, 3, 1] },
          "correctState": { "scale": [1, -3, 1] },
          "meshType": "box",
          "color": "#e24a4a"
        },
        {
          "id": "node_support",
          "name": "Support Pillar",
          "paradoxRule": "VOID",
          "initialState": { "position": [0, 0, -5], "rotation": [0, 0, 0], "scale": [1, 4, 1] },
          "correctState": { "visible": false },
          "meshType": "cylinder",
          "color": "#f5a623"
        }
      ],
      "successEvent": {
        "type": "UNLOCK_COMPARTMENT",
        "target": "wall_panel_01"
      }
    }
  },
  {
  taskId: "AKHE_DESIGNER_PUZZLE",
  title: "解构：神秘设计师",
  description: "调查Kiera名片背后的神秘符号，追寻一位身份不明的设计师的线索。该任务需要整理破碎的数据库记录，拼凑出设计师的真实身份。",
  reward: 500,
  difficulty: "Hard",
  estimatedTime: "30 mins",
  relatedSvmId: null,
  type: "LOGIC_PUZZLE",
  initiallyVisible: false,
  successMessage: "逻辑拼图解开。设计师的身份已确认。",
  failureMessage: "组合错误，身份验证失败。",
  puzzleData: {
    finalSolution: "AKHE",
    clues: {
      "doc_new_minimalism": { id: "doc_new_minimalism", type: "text", content: "设计流派：新极简主义。强调功能性，去除所有不必要的装饰。代表作：城市交通枢纽'Nexus'。"},
      "doc_organic": { id: "doc_organic", type: "text", content: "设计哲学：有机建筑。模仿自然形态，追求建筑与环境的和谐共生。"},
      "doc_deconstruction": { id: "doc_deconstruction", type: "text", content: "主义：解构主义。通过破碎和重组，暴露事物内在的矛盾。"},
      "doc_parody": { id: "doc_parody", type: "text", content: "核心概念：对主流秩序的冷峻戏仿。挑战观众的预设观念，通过荒诞的并置引发思考。相关项目：'都市迷宫'艺术装置。"},
      "doc_ironic_aesthetics": { id: "doc_ironic_aesthetics", type: "text", content: "美学思想：反讽美学。故意使用廉价、日常的材料创作，颠覆传统奢侈品概念，营造一种疏离感。"},
      "keyword_ak": { id: "keyword_ak", type: "text", content: "关键词高亮: 'AK'"},
      "keyword_alienation": { id: "keyword_alienation", type: "text", content: "关键词高亮: '疏离', '反讽'"},
      "doc_heterotopia": { id: "doc_heterotopia", type: "text", content: "空间理论：异质空间。创造出现实中不存在，仅存于精神层面的场所，作为对现实世界的批判。"},
      "keyword_h": { id: "keyword_h", type: "text", content: "关键词高亮: 'H'"},
      "keyword_e": { id: "keyword_e", type: "text", content: "关键词高亮: 'E'"},
      "doc_final_manifesto": { id: "doc_final_manifesto", type: "text", content: "设计宣言：'我的设计，是献给这个荒诞世界最真诚的玩笑。'"},
      "final_doc_title": { id: "final_doc_title", type: "text", content: "档案标题: 设计师档案：__H_ __E__"}
    },
    stages: [
      {
        stageId: 0,
        initialClues: ["doc_new_minimalism", "doc_organic", "doc_deconstruction", "doc_parody", "doc_ironic_aesthetics"],
        keyClueIds: ["doc_parody", "doc_ironic_aesthetics"],
        revelations: {
          "doc_parody": ["keyword_ak"],
          "doc_ironic_aesthetics": ["keyword_alienation"],
        }
      },
      {
        stageId: 1,
        initialClues: ["doc_heterotopia"],
        keyClueIds: ["doc_heterotopia"],
        revelations: {
          "doc_heterotopia": ["keyword_h", "keyword_e"]
        }
      },
      {
        stageId: 2,
        initialClues: ["doc_final_manifesto"],
        keyClueIds: ["doc_final_manifesto"],
        revelations: {
            "doc_final_manifesto": ["final_doc_title"]
        }
      }
    ]
  }
}
];

// --- 逻辑拼图任务: AKHE ---
tasks.push();

// Function to get task details by ID
export function getTaskById(taskId) {
  console.log(`[getTaskById] Searching for taskId: ${taskId} (Type: ${typeof taskId})`);
  const foundTask = tasks.find(task => {
    // Add logging for comparison
    // console.log(`[getTaskById] Comparing with: ${task.taskId} (Type: ${typeof task.taskId})`);
    return task.taskId === taskId;
  });
  console.log(`[getTaskById] Found task:`, foundTask);
  return foundTask;
}

export default tasks; // Keep default export if used elsewhere, otherwise remove