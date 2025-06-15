// 伪电台频率和音频文件的对应关系
export const radioStations = [
  {
    frequency: "88.5",
    name: "回忆电台",
    audioFile: "/assets/audio/memory.mp3",
    description: "播放着关于过去的回忆...",
    isSecret: false
  },
  {
    frequency: "101.7",
    name: "父亲的声音",
    audioFile: "/assets/audio/father.mp3",
    description: "一个熟悉的声音在呼唤...",
    isSecret: true
  },
  {
    frequency: "95.2",
    name: "茶香时光",
    audioFile: "/assets/audio/tea.mp3",
    description: "宁静的午后时光...",
    isSecret: false
  },
  {
    frequency: "107.3",
    name: "神秘信号",
    audioFile: "/assets/audio/au.mp3",
    description: "来自未知的信号...",
    isSecret: true
  }
];

// 获取所有可用频率
export const getAllFrequencies = () => {
  return radioStations.map(station => station.frequency);
};

// 根据频率获取电台信息
export const getStationByFrequency = (frequency) => {
  return radioStations.find(station => station.frequency === frequency);
};

// 获取所有非秘密电台（用于提示）
export const getPublicStations = () => {
  return radioStations.filter(station => !station.isSecret);
};

// 检查频率是否有效
export const isValidFrequency = (frequency) => {
  return radioStations.some(station => station.frequency === frequency);
};