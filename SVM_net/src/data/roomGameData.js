// 房间游戏数据配置
export const roomItems = {
  // 家具和物品类型
  furniture: {
    bed: { emoji: '🛏️', name: '床', interactive: true },
    desk: { emoji: '🪑', name: '桌子', interactive: true },
    cabinet: { emoji: '🗄️', name: '柜子', interactive: true },
    bookshelf: { emoji: '📚', name: '书架', interactive: true },
    plant: { emoji: '🪴', name: '植物', interactive: false },
    lamp: { emoji: '💡', name: '台灯', interactive: true },
    computer: { emoji: '💻', name: '电脑', interactive: true },
    safe: { emoji: '🔒', name: '保险箱', interactive: true },
    painting: { emoji: '🖼️', name: '画框', interactive: true },
    mirror: { emoji: '🪞', name: '镜子', interactive: true },
    clock: { emoji: '🕐', name: '时钟', interactive: true },
    trash: { emoji: '🗑️', name: '垃圾桶', interactive: true },
    window: { emoji: '🪟', name: '窗户', interactive: false },
    door: { emoji: '🚪', name: '门', interactive: false },
    empty: { emoji: '⬜', name: '空地', interactive: false }
  }
};

// 默认房间布局 (4x4)
export const defaultRoomLayout = [
  ['window', 'painting', 'clock', 'window'],
  ['bookshelf', 'desk', 'computer', 'plant'],
  ['cabinet', 'empty', 'empty', 'lamp'],
  ['door', 'safe', 'mirror', 'trash']
];

// 脚本控制的线索配置
export const scriptClues = {
  // 示例：在特定脚本步骤中，点击特定坐标可以解锁线索
  'HK_2085_Love_Isaac': {
    // 步骤40时，点击(1,2)位置的电脑可以解锁线索
    work_10: {
      x: 2,
      y: 1,
      clueId: 'computer_secret_file',
      clueName: '邮件',
      clueContent: '你收到了一个邮件，主题是：2060年新闻事件',
      unlockMessage: '你在电脑中发现了可疑的邮件！'
    },
    work_12: {
      x: 2,
      y: 1,
      clueId: 'computer_secret_file',
      clueName: '邮件',
      clueContent: '你收到了一个邮件，主题是：2060年新闻事件',
      unlockMessage: '你在电脑中发现了可疑的邮件！'
    }
  }
};

// 获取当前可解锁的线索
export const getAvailableClue = (scriptId, stepId, x, y) => {
  const scriptClues_data = scriptClues[scriptId];
  if (!scriptClues_data) return null;
  
  const stepClue = scriptClues_data[stepId];
  if (!stepClue) return null;
  
  if (stepClue.x === x && stepClue.y === y) {
    return stepClue;
  }
  
  return null;
};

// 检查位置是否有可交互的线索
export const hasInteractiveClue = (scriptId, stepId, x, y) => {
  return getAvailableClue(scriptId, stepId, x, y) !== null;
};

// 房间状态管理
export const roomStates = {
  // 物品的开启/关闭状态
  cabinet_open: false,
  safe_open: false,
  computer_on: false,
  lamp_on: false
};

// 获取物品的当前状态显示
export const getItemDisplay = (itemType, isOpen = false, isOn = false) => {
  const item = roomItems.furniture[itemType];
  if (!item) return roomItems.furniture.empty;
  
  // 根据状态返回不同的显示
  switch (itemType) {
    case 'cabinet':
      return { ...item, emoji: isOpen ? '📂' : '🗄️' };
    case 'safe':
      return { ...item, emoji: isOpen ? '🔓' : '🔒' };
    case 'computer':
      return { ...item, emoji: isOn ? '💻' : '🖥️' };
    case 'lamp':
      return { ...item, emoji: isOn ? '💡' : '🔦' };
    default:
      return item;
  }
};