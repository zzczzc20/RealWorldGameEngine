// src/data/userData.js
const user = {
  playerName: "NeonRunner",
  name: "NeonRunner", // 添加name属性以匹配脚本中的${player.name}
  level: 15,
  points: 2750,
  credits: 1000, // 添加credits属性以匹配脚本中的${player.credits}
  rank: "Cyber Porter",
  completedTasks: 42,
  joinDate: "2023-10-15",
  
  // 添加inventory属性以匹配脚本中的检查
  inventory: [
    { id: 'basic_phone', name: '基础通讯设备', quantity: 1 },
    { id: 'credit_chip', name: '信用芯片', quantity: 1 }
    // 注意：hacking_tool_corpsec和data_spike将在游戏过程中获得
  ],
  
  // 添加reputation属性以匹配脚本中的检查
  reputation: {
    CorpSec: -5, // 与企业安全部门的声望
    Underground: 10, // 与地下组织的声望
    Tiger_Claws: 15 // 与Tiger Claws帮派的声望
  }
};

export default user;