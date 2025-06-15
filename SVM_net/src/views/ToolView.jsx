import React, { useState, useRef, useContext } from 'react';
import CameraView from './CameraView';
import CyberButton from '../components/ui/CyberButton';
import { getStationByFrequency, getPublicStations } from '../data/radioStationData';
import { defaultRoomLayout, getItemDisplay, getAvailableClue, hasInteractiveClue } from '../data/roomGameData';
import { useScriptContext } from '../context/ScriptContext';
import { useWorldStateContext } from '../context/WorldStateContext';

// 密码破解器组件
const CipherDecoder = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [cipherType, setCipherType] = useState('caesar');

  const decodeCaesar = (text, shift = 13) => {
    return text.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start - shift + 26) % 26) + start);
    });
  };

  const decodeMorse = (text) => {
    const morseCode = {
      '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
      '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
      '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
      '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
      '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
      '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
      '...--': '3', '....-': '4', '.....': '5', '-....': '6',
      '--...': '7', '---..': '8', '----.': '9'
    };
    return text.split(' ').map(code => morseCode[code] || '?').join('');
  };

  const decodeBase64 = (text) => {
    try {
      return atob(text);
    } catch (e) {
      return '无效的Base64编码';
    }
  };

  const handleDecode = () => {
    let decoded = '';
    switch (cipherType) {
      case 'caesar':
        decoded = decodeCaesar(inputText);
        break;
      case 'morse':
        decoded = decodeMorse(inputText);
        break;
      case 'base64':
        decoded = decodeBase64(inputText);
        break;
      default:
        decoded = '未知密码类型';
    }
    setResult(decoded);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
          🔓 密码破解器
        </h1>
        <CyberButton onClick={onBack} className="!bg-gray-700 hover:!bg-gray-600 !text-cyan-300">
          {'< 返回工具箱'}
        </CyberButton>
      </div>
      
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500 rounded-xl p-8 shadow-2xl shadow-green-500/20">
        {/* 装饰性顶部 */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-green-300 font-bold mb-3 text-lg">🎯 选择密码类型</label>
          <select
            value={cipherType}
            onChange={(e) => setCipherType(e.target.value)}
            className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 rounded-lg border-2 border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-300 text-lg"
          >
            <option value="caesar">🏛️ 凯撒密码 (ROT13)</option>
            <option value="morse">📡 摩斯密码</option>
            <option value="base64">🔢 Base64编码</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-green-300 font-bold mb-3 text-lg">📝 输入加密文本</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-gradient-to-br from-gray-700 to-gray-800 text-white p-4 rounded-lg border-2 border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-300 resize-none"
            placeholder="在此输入需要解密的神秘文本..."
            rows="5"
          />
        </div>

        <div className="text-center mb-6">
          <CyberButton
            onClick={handleDecode}
            className="!bg-gradient-to-r !from-green-600 !to-teal-600 hover:!from-green-500 hover:!to-teal-500 !px-8 !py-4 !text-lg !font-bold !shadow-lg !shadow-green-500/30 !transform !transition-all !duration-300 hover:!scale-105"
          >
            🔓 开始解密
          </CyberButton>
        </div>

        {result && (
          <div className="bg-gradient-to-r from-green-900/50 to-teal-900/50 p-6 rounded-xl border-2 border-green-400 shadow-lg shadow-green-400/20 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-green-400 rounded-full mr-3 animate-ping"></div>
              <h3 className="text-green-300 font-bold text-xl">✨ 解密成功</h3>
            </div>
            <div className="bg-black/30 p-4 rounded-lg border border-green-400/30">
              <p className="text-white font-mono text-lg leading-relaxed break-all">{result}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 伪电台组件
const RadioStation = ({ onBack }) => {
  const [frequency, setFrequency] = useState('');
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const publicStations = getPublicStations();

  const tuneToFrequency = () => {
    const station = getStationByFrequency(frequency);
    if (station) {
      setCurrentStation(station);
      if (audioRef.current) {
        audioRef.current.src = station.audioFile;
        audioRef.current.load();
      }
    } else {
      setCurrentStation(null);
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current && currentStation) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('播放失败:', error);
        });
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
          📻 电台
        </h1>
        <CyberButton onClick={onBack} className="!bg-gray-700 hover:!bg-gray-600 !text-cyan-300">
          {'< 返回工具箱'}
        </CyberButton>
      </div>
      
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500 rounded-xl p-8 shadow-2xl shadow-orange-500/20">
        {/* 电台调频器 */}
        <div className="mb-8">
          <div className="text-center mb-6">
            {/* 主电台圆盘 */}
            <div className="relative mb-6">
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50 relative overflow-hidden">
                {/* 背景纹理 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                
                {/* 电台图标 */}
                <svg className="w-20 h-20 text-white z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 000 2h8a1 1 0 100-2H5z" />
                </svg>
                
                {/* 播放时的动画环 */}
                {isPlaying && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-orange-300 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-red-300 animate-pulse"></div>
                    <div className="absolute inset-4 rounded-full border border-pink-300 animate-spin"></div>
                  </>
                )}
              </div>
              
              {/* 频率显示屏 */}
              <div className="mt-4 bg-black/50 border-2 border-orange-400/50 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-orange-300 text-sm font-mono mb-1">FREQUENCY</div>
                <div className="text-2xl font-mono text-white">
                  {frequency || '---.-'} <span className="text-orange-400">MHz</span>
                </div>
              </div>
            </div>

            {/* 调频控制 */}
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 p-6 rounded-xl border border-orange-400/30 backdrop-blur-sm mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="输入频率 (如: 88.5)"
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 rounded-lg border-2 border-orange-500/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-center font-mono text-lg transition-all duration-300"
                  />
                </div>
                <span className="text-orange-300 font-bold text-lg">MHz</span>
              </div>
              
              <div className="flex gap-3 justify-center">
                <CyberButton
                  onClick={tuneToFrequency}
                  className="!bg-gradient-to-r !from-orange-600 !to-red-600 hover:!from-orange-500 hover:!to-red-500 !px-6 !py-3 !text-lg !font-bold !shadow-lg !shadow-orange-500/30 !transform !transition-all !duration-300 hover:!scale-105"
                >
                  📻 调频搜索
                </CyberButton>
                {currentStation && (
                  <CyberButton
                    onClick={togglePlayback}
                    className={`!px-6 !py-3 !text-lg !font-bold !shadow-lg !transform !transition-all !duration-300 hover:!scale-105 ${
                      isPlaying
                        ? '!bg-gradient-to-r !from-red-600 !to-pink-600 hover:!from-red-500 hover:!to-pink-500 !shadow-red-500/30'
                        : '!bg-gradient-to-r !from-green-600 !to-teal-600 hover:!from-green-500 hover:!to-teal-500 !shadow-green-500/30'
                    }`}
                  >
                    {isPlaying ? '⏸️ 暂停播放' : '▶️ 开始播放'}
                  </CyberButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 当前电台信息 */}
        {currentStation ? (
          <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 p-6 rounded-xl border-2 border-orange-400 shadow-lg shadow-orange-400/20 mb-6 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mr-3 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              </div>
              <h3 className="text-orange-300 font-bold text-xl">📡 {currentStation.name}</h3>
            </div>
            <div className="bg-black/30 p-4 rounded-lg border border-orange-400/30">
              <p className="text-white mb-2 text-lg">频率: <span className="font-mono text-orange-300">{currentStation.frequency} MHz</span></p>
              <p className="text-gray-300">{currentStation.description}</p>
              {currentStation.isSecret && (
                <div className="mt-3 flex items-center text-yellow-400">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold">隐藏频道已解锁</span>
                </div>
              )}
            </div>
          </div>
        ) : frequency && (
          <div className="bg-gradient-to-r from-gray-700/50 to-gray-800/50 p-6 rounded-xl border border-gray-500 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg">📵 频率 <span className="font-mono">{frequency} MHz</span> 无信号</p>
              <p className="text-gray-500 text-sm mt-2">请尝试其他频率...</p>
            </div>
          </div>
        )}

        {/* 已知频道提示 */}
        <div className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 p-6 rounded-xl border border-gray-600/50 backdrop-blur-sm">
          <h3 className="text-gray-300 font-bold mb-4 text-lg flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            已知频道
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {publicStations.map((station) => (
              <div key={station.frequency} className="bg-gray-800/50 p-3 rounded-lg border border-gray-600/30">
                <div className="text-orange-300 font-mono font-bold">{station.frequency} MHz</div>
                <div className="text-gray-300 text-sm">{station.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              💡 提示: 还有一些隐藏频道等待发现...
            </p>
          </div>
        </div>

        {/* 隐藏的音频元素 */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

// 房间游戏组件
const RoomGame = ({ onBack }) => {
  const [roomLayout, setRoomLayout] = useState(defaultRoomLayout);
  const [itemStates, setItemStates] = useState({});
  const [discoveredClues, setDiscoveredClues] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showClueModal, setShowClueModal] = useState(false);
  const [currentClue, setCurrentClue] = useState(null);
  
  const { activeEngineDetails } = useScriptContext();
  const { addDiscoveredClue } = useWorldStateContext();

  // 获取当前活跃的脚本信息
  const getCurrentScriptInfo = () => {
    for (const [scriptId, step] of activeEngineDetails.entries()) {
      if (step && step.stepId) {
        return { scriptId, stepId: step.stepId };
      }
    }
    return { scriptId: null, stepId: null };
  };

  const handleCellClick = (x, y) => {
    const { scriptId, stepId } = getCurrentScriptInfo();
    setSelectedCell({ x, y });
    
    // 检查是否有可解锁的线索
    if (scriptId && stepId) {
      const availableClue = getAvailableClue(scriptId, stepId, x, y);
      if (availableClue) {
        setCurrentClue(availableClue);
        setShowClueModal(true);
        
        // 添加线索到游戏状态
        if (addDiscoveredClue) {
          addDiscoveredClue({
            id: availableClue.clueId,
            title: availableClue.clueName,
            content: availableClue.clueContent,
            source: 'room_game',
            timestamp: Date.now()
          });
        }
        
        setDiscoveredClues(prev => [...prev, availableClue]);
        return;
      }
    }
    
    // 处理普通物品交互
    const itemType = roomLayout[y][x];
    if (itemType === 'cabinet' || itemType === 'safe' || itemType === 'computer' || itemType === 'lamp') {
      setItemStates(prev => ({
        ...prev,
        [`${itemType}_${x}_${y}`]: !prev[`${itemType}_${x}_${y}`]
      }));
    }
  };

  const getItemAtPosition = (x, y) => {
    const itemType = roomLayout[y][x];
    const stateKey = `${itemType}_${x}_${y}`;
    const isOpen = itemStates[stateKey] || false;
    return getItemDisplay(itemType, isOpen, isOpen);
  };

  const { scriptId, stepId } = getCurrentScriptInfo();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          🏠 房间探索
        </h1>
        <CyberButton onClick={onBack} className="!bg-gray-700 hover:!bg-gray-600 !text-cyan-300">
          {'< 返回工具箱'}
        </CyberButton>
      </div>
      
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500 rounded-xl p-8 shadow-2xl shadow-purple-500/20">
        {/* 房间信息 */}
        <div className="mb-6 text-center">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 rounded-lg border border-purple-400/30">
            <h3 className="text-purple-300 font-bold text-lg mb-2">🔍 我的房间</h3>
            <p className="text-gray-300">点击房间中的物品进行探索，寻找隐藏的线索...</p>
            {scriptId && stepId && (
              <p className="text-yellow-400 text-sm mt-2">
                当前剧本: {scriptId} | 步骤: {stepId}
              </p>
            )}
          </div>
        </div>

        {/* 响应式房间视图 */}
        <div className="mb-6">
          <div className="relative w-full max-w-lg mx-auto px-2">
            {/* 房间容器 */}
            <div className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-3 sm:p-6 border-4 border-amber-600 shadow-xl">
              
              {/* 房间标题 */}
              <div className="text-center mb-3 sm:mb-4">
                <h4 className="text-amber-800 font-bold text-base sm:text-lg">🏠 我的房间</h4>
                <p className="text-amber-600 text-xs sm:text-sm">点击物品进行探索</p>
              </div>

              {/* 响应式房间布局 */}
              <div className="grid grid-cols-4 gap-1 sm:gap-3 bg-white/50 p-2 sm:p-4 rounded-lg border-2 border-amber-400">
                {roomLayout.map((row, y) =>
                  row.map((itemType, x) => {
                    const item = getItemAtPosition(x, y);
                    const hasClue = scriptId && stepId && hasInteractiveClue(scriptId, stepId, x, y);
                    const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;
                    
                    return (
                      <div
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        className={`
                          relative w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center cursor-pointer
                          rounded-lg sm:rounded-xl border-2 sm:border-3 transition-all duration-300 transform active:scale-95 sm:hover:scale-105
                          ${isSelected
                            ? 'border-yellow-500 bg-yellow-100 shadow-lg shadow-yellow-400/50 scale-95 sm:scale-105'
                            : 'border-amber-300 bg-white hover:bg-amber-50 hover:border-amber-400'
                          }
                          ${hasClue
                            ? 'ring-2 sm:ring-4 ring-red-400 ring-opacity-75 animate-pulse'
                            : ''
                          }
                          ${item.interactive
                            ? 'hover:shadow-lg hover:border-blue-400'
                            : ''
                          }
                        `}
                        title={`${item.name} (${x},${y})`}
                      >
                        {/* 物品图标 - 响应式大小 */}
                        <div className="text-xl sm:text-3xl mb-0 sm:mb-1">{item.emoji}</div>
                        
                        {/* 物品名称 - 在手机上隐藏或缩小 */}
                        <div className="hidden sm:block text-xs text-amber-700 font-medium text-center leading-tight">
                          {item.name}
                        </div>
                        
                        {/* 手机上的简化名称 */}
                        <div className="block sm:hidden text-xs text-amber-700 font-medium text-center leading-none">
                          {item.name.length > 2 ? item.name.substring(0, 2) : item.name}
                        </div>
                        
                        {/* 线索提示 - 响应式大小 */}
                        {hasClue && (
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-ping flex items-center justify-center">
                            <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                        
                        {/* 交互提示 - 响应式大小 */}
                        {item.interactive && (
                          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 房间说明 - 响应式布局 */}
              <div className="mt-3 sm:mt-4 text-center">
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm text-amber-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></div>
                    <span>线索</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <span>交互</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                    <span>选中</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 选中物品信息 */}
        {selectedCell && (
          <div className="mb-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 rounded-lg border border-blue-400/30">
            <h4 className="text-blue-300 font-bold mb-2">
              📍 选中位置: ({selectedCell.x}, {selectedCell.y})
            </h4>
            <p className="text-white">
              {getItemAtPosition(selectedCell.x, selectedCell.y).name}
            </p>
          </div>
        )}

        {/* 已发现的线索 */}
        {discoveredClues.length > 0 && (
          <div className="bg-gradient-to-r from-green-900/50 to-teal-900/50 p-4 rounded-lg border border-green-400/30">
            <h4 className="text-green-300 font-bold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              已发现的线索 ({discoveredClues.length})
            </h4>
            <div className="space-y-2">
              {discoveredClues.map((clue, index) => (
                <div key={index} className="bg-black/30 p-3 rounded border border-green-400/20">
                  <div className="text-green-300 font-bold">{clue.clueName}</div>
                  <div className="text-gray-300 text-sm">{clue.clueContent}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 线索发现模态框 */}
      {showClueModal && currentClue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400 rounded-xl p-6 max-w-md mx-4 shadow-2xl shadow-yellow-400/30">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-yellow-300 font-bold text-xl mb-2">🎉 发现线索！</h3>
              <p className="text-yellow-400 mb-4">{currentClue.unlockMessage}</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg border border-yellow-400/30 mb-4">
              <h4 className="text-yellow-300 font-bold mb-2">{currentClue.clueName}</h4>
              <p className="text-gray-300 text-sm">{currentClue.clueContent}</p>
            </div>
            
            <div className="text-center">
              <CyberButton
                onClick={() => setShowClueModal(false)}
                className="!bg-gradient-to-r !from-yellow-600 !to-orange-600 hover:!from-yellow-500 hover:!to-orange-500"
              >
                确认
              </CyberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 主工具箱视图
function ToolView({ onBack }) {
  const [currentTool, setCurrentTool] = useState(null);

  if (currentTool === 'camera') {
    return <CameraView onBack={() => setCurrentTool(null)} />;
  }

  if (currentTool === 'cipher') {
    return <CipherDecoder onBack={() => setCurrentTool(null)} />;
  }

  if (currentTool === 'radio') {
    return <RadioStation onBack={() => setCurrentTool(null)} />;
  }

  if (currentTool === 'room') {
    return <RoomGame onBack={() => setCurrentTool(null)} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">侦探工具箱</h1>
        <CyberButton onClick={onBack} className="!bg-gray-700 hover:!bg-gray-600 !text-cyan-300">
          {'< 返回地图'}
        </CyberButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 摄像头扫描工具 */}
        <div className="bg-gray-800 border border-cyan-600 rounded-lg p-6 hover:border-cyan-400 transition-colors cursor-pointer"
             onClick={() => setCurrentTool('camera')}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-cyan-300 mb-2">摄像头扫描</h3>
            <p className="text-gray-300 text-sm">二维码扫描 • 实体识别</p>
          </div>
        </div>

        {/* 密码破解工具 */}
        <div className="bg-gray-800 border border-green-600 rounded-lg p-6 hover:border-green-400 transition-colors cursor-pointer"
             onClick={() => setCurrentTool('cipher')}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-300 mb-2">密码破解器</h3>
            <p className="text-gray-300 text-sm">凯撒密码 • 摩斯密码 • Base64</p>
          </div>
        </div>

        {/* 电台工具 */}
        <div className="bg-gray-800 border border-orange-600 rounded-lg p-6 hover:border-orange-400 transition-colors cursor-pointer"
             onClick={() => setCurrentTool('radio')}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 000 2h8a1 1 0 100-2H5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-orange-300 mb-2">电台</h3>
            <p className="text-gray-300 text-sm">频率调谐 • 神秘信号 • 隐藏频道</p>
          </div>
        </div>

        {/* 房间探索工具 */}
        <div className="bg-gray-800 border border-purple-600 rounded-lg p-6 hover:border-purple-400 transition-colors cursor-pointer"
             onClick={() => setCurrentTool('room')}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-purple-300 mb-2">房间探索</h3>
            <p className="text-gray-300 text-sm">物品交互 • 线索发现 • 脚本联动</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 border border-yellow-600 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-yellow-300 font-bold">侦探提示</p>
        </div>
        <p className="text-gray-300 mt-2">这些工具可以帮助你解开游戏中的谜题和线索。每个工具都有其独特的用途，善用它们来推进剧情发展！</p>
      </div>
    </div>
  );
}

export default ToolView;