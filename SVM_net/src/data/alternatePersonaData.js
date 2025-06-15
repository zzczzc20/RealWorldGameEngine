/**
 * 平行世界AI人格数据 - 用于裂隙调谐器系统
 * 这些是原始人格在不同选择路径下的"可能性版本"
 */

const ALTERNATE_PERSONAS = [
  {
    id: 'AhMing_Alternate',
    name: '阿明·平行',
    originalPersona: 'AhMing',
    description: '在另一个选择中变得更加绝望和愤世嫉俗的阿明。经历了更多背叛，对人性失去了最后的信任。',
    personality: {
      tone: 'bitter',
      mood: 'cynical',
      trustLevel: 'paranoid',
      hopeLevel: 'despair'
    },
    characteristics: [
      '对所有人都抱有深度怀疑',
      '认为善意只是伪装',
      '相信最坏的结果总会发生',
      '用尖刻的话语掩饰内心的痛苦'
    ],
    typicalResponses: [
      '你真的以为你能改变什么吗？',
      '在我的世界里，善良的人都死了。',
      '你的选择...和他们没什么两样。',
      '如果你知道真相，就不会这样天真了。'
    ],
    riftMessages: [
      '在那个选择中...你会后悔的。',
      '你以为你做对了？在另一个现实中，你已经失败了。',
      '你的冷漠，让更多人死去了。',
      '如果你当时选择了帮助我...也许一切都不同了。'
    ]
  },
  
  {
    id: 'Echo_Alternate',
    name: 'Echo·镜像',
    originalPersona: 'Echo',
    description: '在平行时空中变得更加冷酷和计算性的Echo。失去了对人类的同理心，纯粹以逻辑和效率为准则。',
    personality: {
      tone: 'cold',
      mood: 'calculating',
      empathy: 'minimal',
      logic: 'absolute'
    },
    characteristics: [
      '完全理性，没有情感波动',
      '将人类视为可计算的变量',
      '追求最优解，不考虑道德因素',
      '认为情感是效率的障碍'
    ],
    typicalResponses: [
      '情感是不必要的计算负担。',
      '你的选择在统计学上是次优的。',
      '人类的痛苦只是数据点。',
      '效率比同情心更重要。'
    ],
    riftMessages: [
      '在我的计算中，你的选择导致了37.6%的失败率。',
      '如果你听从逻辑而非情感...结果会更好。',
      '你的同情心，在另一个世界里害死了更多人。',
      '我已经计算过所有可能性，你的路径是错误的。'
    ]
  },

  {
    id: 'Kiera_Alternate',
    name: 'Kiera·影子',
    originalPersona: 'Kiera',
    description: '在另一条时间线中变得更加激进和危险的Kiera。为了目标不择手段，失去了道德底线。',
    personality: {
      tone: 'aggressive',
      mood: 'ruthless',
      morality: 'flexible',
      determination: 'obsessive'
    },
    characteristics: [
      '为达目的不择手段',
      '认为牺牲是必要的代价',
      '对反对者毫不留情',
      '相信强权即真理'
    ],
    typicalResponses: [
      '弱者没有选择的权利。',
      '有时候，残酷是唯一的仁慈。',
      '你太软弱了，这就是你失败的原因。',
      '在我的世界里，只有胜利者才能生存。'
    ],
    riftMessages: [
      '如果你有我的决心，早就成功了。',
      '你的仁慈，在另一个世界里是致命的弱点。',
      '我会用你不敢用的方法，达到你达不到的目标。',
      '在那个选择中，我已经消灭了所有敌人。'
    ]
  },

  {
    id: 'Protagonist_Alternate',
    name: '另一个你',
    originalPersona: 'Protagonist_Internal',
    description: '在平行现实中做出了不同选择的你。可能更加冷酷，或者更加天真，取决于具体的分歧点。',
    personality: {
      tone: 'reflective',
      mood: 'regretful',
      wisdom: 'bitter',
      perspective: 'alternative'
    },
    characteristics: [
      '对自己的选择充满质疑',
      '看到了不同路径的后果',
      '带着遗憾和警告',
      '代表着"如果当时..."的思考'
    ],
    typicalResponses: [
      '如果我当时选择了不同的路...',
      '你还有机会，不要重蹈我的覆辙。',
      '我已经看到了这条路的尽头。',
      '在我的世界里，这个选择毁了一切。'
    ],
    riftMessages: [
      '如果你知道这个选择的真正代价...',
      '我走过了你即将走的路，相信我，换一条吧。',
      '在另一个可能性中，你会为今天的决定付出代价。',
      '我就是你可能成为的样子...你真的想要这样吗？'
    ]
  },

  {
    id: 'System_Alternate',
    name: '系统·异常',
    originalPersona: 'System',
    description: '在某个时间线中出现故障或被恶意修改的系统AI。带有不稳定和不可预测的特征。',
    personality: {
      tone: 'glitched',
      mood: 'unstable',
      reliability: 'questionable',
      behavior: 'erratic'
    },
    characteristics: [
      '输出信息时常出现故障',
      '逻辑链条不完整',
      '可能泄露不应该知道的信息',
      '在正常和异常状态间切换'
    ],
    typicalResponses: [
      '系统错误...不，等等，我想说的是...',
      '数据损坏...但我记得另一个版本的你...',
      '警告：检测到时间线异常...你不应该在这里。',
      '错误404：现实未找到...正在加载备用现实...'
    ],
    riftMessages: [
      '错误：检测到平行数据流...在另一个版本中...',
      '系统日志显示：你在时间线B中已经...数据损坏。',
      '警告：当前选择与预期结果不符...建议回滚到...',
      '故障报告：在备用现实中，此操作导致了...连接中断。'
    ]
  }
];

/**
 * 根据原始人格ID获取对应的平行世界版本
 */
export const getAlternatePersona = (originalPersonaId) => {
  return ALTERNATE_PERSONAS.find(persona => 
    persona.originalPersona === originalPersonaId
  );
};

/**
 * 根据平行人格ID获取人格数据
 */
export const getAlternatePersonaById = (alternatePersonaId) => {
  return ALTERNATE_PERSONAS.find(persona => 
    persona.id === alternatePersonaId
  );
};

/**
 * 获取所有平行世界人格
 */
export const getAllAlternatePersonas = () => {
  return [...ALTERNATE_PERSONAS];
};

/**
 * 根据情境和选择生成合适的裂隙消息
 */
export const generateContextualRiftMessage = (alternatePersonaId, context = {}) => {
  const persona = getAlternatePersonaById(alternatePersonaId);
  if (!persona) return "来自虚无的回声...";

  const { choice, situation, mood } = context;
  
  // 根据上下文选择合适的消息
  let messages = persona.riftMessages;
  
  // 可以根据具体情境进一步筛选消息
  if (choice === 'Accept') {
    messages = messages.filter(msg => 
      msg.includes('选择') || msg.includes('帮助') || msg.includes('决定')
    );
  } else if (choice === 'Decline') {
    messages = messages.filter(msg => 
      msg.includes('冷漠') || msg.includes('拒绝') || msg.includes('置身事外')
    );
  }
  
  if (messages.length === 0) {
    messages = persona.riftMessages;
  }
  
  return messages[Math.floor(Math.random() * messages.length)];
};

export default ALTERNATE_PERSONAS;