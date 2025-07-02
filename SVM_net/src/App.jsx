import React, { useState, useEffect } from 'react';
import jsyaml from 'js-yaml';
import StartupScreen from './components/StartupScreen';
import initialSvms from './data/svmData';
import Navbar from './components/Navbar';
import MapView from './views/MapView';
import ToolView from './views/ToolView';
import SvmDetailView from './views/SvmDetailView';
import TaskListView from './views/TaskListView';
import UserProfileView from './views/UserProfileView';
import { ScriptProvider, useScriptContext } from './context/ScriptContext.jsx';
import { WorldStateProvider, useWorldStateContext } from './context/WorldStateContext.jsx';
import { publish, subscribe, unsubscribe, activateScriptEngine, notifyScript, setupAIEventHandlers, registerWorldStateGetter } from './services/EventService';
import AIChatContainer from './components/AIChatContainer';
import PlayerClueLogView from './components/PlayerClueLogView';
import CyberButton from './components/ui/CyberButton';
import TaskOfferPanel from './components/TaskOfferPanel';
import CodeEntryTaskPanel from './components/CodeEntryTaskPanel';
import { getTaskById } from './data/taskData';
import PuzzleInteractionView from './components/PuzzleInteractionView';
import RiftManager from './components/RiftManager';
import RiftTunerDemo from './components/RiftTunerDemo';
import RiftTunerGame from './components/RiftTunerGame';
import VisualNovelView from './components/VisualNovelView';
import LogicPuzzleGame from './components/LogicPuzzleGame';

function AppContent() {
  const [apiProvider, setApiProvider] = useState(null); // Added
  const [apiKey, setApiKey] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [currentView, setCurrentView] = useState('map');
  const [currentBgm, setCurrentBgm] = useState(null);
  const [selectedSvmId, setSelectedSvmId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isClueLogVisible, setIsClueLogVisible] = useState(false);
  const [isPuzzleViewVisible, setIsPuzzleViewVisible] = useState(false);
  const { activeEngineDetails } = useScriptContext();
  const worldStateContext = useWorldStateContext();
  const {
    activeTask, setActiveTask, updateSvmStatus, getWorldState,
    hasUnreadClues, hasUnreadPuzzles, markCluesAsRead, markPuzzlesAsRead // Added for unread indicators
  } = worldStateContext;
  const [executingTaskId, setExecutingTaskId] = useState(null);

  useEffect(() => {
      if (getWorldState) {
          registerWorldStateGetter(getWorldState);
      }
  }, [getWorldState]);

  useEffect(() => {
    if (apiProvider && apiKey) {
      setupAIEventHandlers(apiProvider, apiKey, selectedLanguage);
    }
  }, [apiProvider, apiKey, selectedLanguage]);

  useEffect(() => {
    const handleHighPriorityAlert = async (eventData) => {
      const scriptIdToLoad = eventData?.scriptId;
      if (!scriptIdToLoad) return;
      try {
        let response = await fetch(`./scripts/events/${scriptIdToLoad}.yaml`);
        if (!response.ok) {
          response = await fetch(`/scripts/events/${scriptIdToLoad}.yaml`);
          if (!response.ok) throw new Error(`Failed to fetch script ${scriptIdToLoad}.yaml`);
        }
        const yamlText = await response.text();
        const scriptData = jsyaml.load(yamlText);
        if (!scriptData.hasOwnProperty('entry')) {
            const lines = yamlText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const entryMatch = line.match(/^[^#]*entry\s*:\s*(\d+)/i);
                if (entryMatch && entryMatch[1]) {
                    scriptData.entry = parseInt(entryMatch[1], 10);
                    break;
                }
            }
        }
        activateScriptEngine(scriptData.scriptId, scriptData, getWorldState);
      } catch (error) {
        console.error(`Failed to load script '${scriptIdToLoad}':`, error);
        alert(`Script ${scriptIdToLoad} could not be loaded.`);
      }
    };
    subscribe('high_priority_alert', handleHighPriorityAlert);
    return () => unsubscribe('high_priority_alert', handleHighPriorityAlert);
  }, [getWorldState]);

  useEffect(() => {
      const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
      const step = activeScriptEntry ? activeScriptEntry[1] : null;

      if (step && step.type === 'dialogue' && typeof step.bgm !== 'undefined') {
          // 如果脚本步骤定义了 bgm (即使是 null)，就更新 BGM state
          if (step.bgm !== currentBgm) {
              setCurrentBgm(step.bgm);
          }
      }
  }, [activeEngineDetails, currentBgm]); // 依赖于脚本步骤和当前BGM

  useEffect(() => {
    publish('game_start', {});
  }, []);

  if (!apiProvider || !apiKey) { // Check both
    const handleStartupSubmit = (provider, key, lang) => { // Updated signature
        setApiProvider(provider); // Set provider
        setApiKey(key);
        setSelectedLanguage(lang);
    };
    return <StartupScreen onSubmit={handleStartupSubmit} />;
  }

  const handleVisualNovelNext = () => {
      const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
      if (activeScriptEntry) {
          const scriptId = activeScriptEntry[0];
          const step = activeScriptEntry[1];
          // 我们的 ScriptParser 中的 'dialogue' 步骤是通过 'dialogueClosed' 事件来推进的。
          // 我们复用这个事件，因为它已经存在并且能完美工作。
          if (step && step.type === 'dialogue') {
              console.log(`[App.jsx] Advancing VN script. Notifying script '${scriptId}' with 'dialogueClosed'.`);
              notifyScript(scriptId, 'dialogueClosed', {});
          }
      }
  };

  const handlePlayerChoice = (chosenNextStep) => {
    const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
    if (activeScriptEntry) {
      const scriptId = activeScriptEntry[0];
      console.log(`[App.jsx] Player chose option. Notifying script '${scriptId}' with 'playerChoiceMade' and nextStep: ${chosenNextStep}`);
      // 使用 notifyScript 直接将选择结果发送给特定的脚本引擎
      notifyScript(scriptId, 'playerChoiceMade', { nextStep: chosenNextStep });
    }
  };

  const handleSelectSvm = (svmId) => setSelectedSvmId(svmId);
  const handleBack = () => setSelectedSvmId(null);
  const handleAcceptTask = (task) => setActiveTask(task);
  const handleExecuteTask = (taskId) => {
      const taskDetails = getTaskById(taskId);
      if (taskDetails && (taskDetails.type === 'CODE_ENTRY' || taskDetails.type === 'RIFT_TUNER' || taskDetails.type === 'LOGIC_PUZZLE')) {
          setExecutingTaskId(taskId);
      }
  };
  const handleCodeEntryClose = () => setExecutingTaskId(null);
  const handleTaskComplete = (completedTask) => {
    if (completedTask?.type === 'CODE_ENTRY' && completedTask?.relatedSvmId === 3) {
      updateSvmStatus(completedTask.relatedSvmId, 'Online');
    }
    setSelectedSvmId(null);
    setCurrentView('map');
  };
  const toggleChat = () => {
    setIsChatOpen(open => !open);
    setHasUnreadMessages(false);
  };
  const toggleClueLogView = () => {
    setIsClueLogVisible(prev => !prev);
    if (!isClueLogVisible) { // If opening the view
      markCluesAsRead();
    }
  };
  const togglePuzzleView = () => {
    setIsPuzzleViewVisible(prev => !prev);
    if (!isPuzzleViewVisible) { // If opening the view
      markPuzzlesAsRead();
    }
  };
  
  const renderCurrentView = () => {
    if (selectedSvmId !== null) {
      return <SvmDetailView svmId={selectedSvmId} onBack={handleBack} activeTask={activeTask} onTaskComplete={handleTaskComplete} />;
    }
    switch (currentView) {
      case 'map': return <MapView onSelectSvm={handleSelectSvm} apiKey={apiKey} />;
      case 'tasks': return <TaskListView onAcceptTask={handleAcceptTask} onExecuteTask={handleExecuteTask} activeTask={activeTask} />;
      case 'profile': return <UserProfileView />;
      case 'tools': return <ToolView onBack={() => setCurrentView('map')} />;
      default: return <MapView onSelectSvm={handleSelectSvm} apiKey={apiKey} />;
    }
  };

  return (
      <div className="min-h-screen bg-gray-900 text-gray-100 relative">
        <Navbar
          currentView={selectedSvmId ? 'map' : currentView}
          setCurrentView={setCurrentView}
        />
        {/* --- 视觉小说渲染逻辑 --- */}
        {(() => {
            // 从 useScriptContext 获取当前脚本步骤
            const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
            const currentScriptStep = activeScriptEntry ? activeScriptEntry[1] : null;

            // 判断是否应该显示视觉小说界面
            const isVisualNovelStep = currentScriptStep && currentScriptStep.type === 'dialogue' && currentScriptStep.image;

            if (isVisualNovelStep) {
                // 如果是，渲染 VisualNovelView
                return (
                    <VisualNovelView
                        step={currentScriptStep}
                        onNext={handleVisualNovelNext}
                        onChoice={handlePlayerChoice} // <--- 传递新函数
                    />
                );
            } else {
                // 如果不是，渲染原来的主视图
                return (
                    <main className="py-6">
                        {renderCurrentView()}
                    </main>
                );
            }
        })()}

        <div className="!fixed !bottom-20 !left-4 !z-50 !flex !flex-col !gap-2 touch-manipulation">
          {/* Example buttons commented out */}
        </div>

        {/* Floating Action Buttons Area */}
        <CyberButton
          onClick={toggleChat}
          className="!fixed !bottom-4 !left-4 !z-50 !rounded-full !p-3 !bg-purple-600 hover:!bg-purple-500 focus:!ring-purple-500 !shadow-lg !shadow-purple-500/30 relative"
          aria-label="Toggle AI Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {hasUnreadMessages && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
        </CyberButton>
        
        <CyberButton
          onClick={toggleClueLogView}
          className="!fixed !bottom-4 !left-20 !z-50 !rounded-full !p-3 !bg-blue-600 hover:!bg-blue-500 focus:!ring-blue-500 !shadow-lg !shadow-blue-500/30"
          aria-label="Toggle Clue Log"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          {hasUnreadClues && (
            <span className="absolute top-0 right-0 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
          )}
        </CyberButton>

        <CyberButton
          onClick={togglePuzzleView}
          className="!fixed !bottom-4 !left-[9rem] !z-50 !rounded-full !p-3 !bg-green-600 hover:!bg-green-500 focus:!ring-green-500 !shadow-lg !shadow-green-500/30 relative" // Adjusted left position, added relative for badge
          aria-label="Toggle Puzzle View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          {hasUnreadPuzzles && (
            <span className="absolute top-0 right-0 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
          )}
        </CyberButton>
        
        {/* Overlay Panels */}
        <AIChatContainer isVisible={isChatOpen} onClose={toggleChat} apiProvider={apiProvider} apiKey={apiKey} language={selectedLanguage} onUnreadMessagesChange={setHasUnreadMessages} />
        <PlayerClueLogView isVisible={isClueLogVisible} onClose={toggleClueLogView} />
        <PuzzleInteractionView isVisible={isPuzzleViewVisible} onClose={togglePuzzleView} />
 
        {/* Task Panels Logic */}
        {(() => {
            let taskOfferPanel = null;
            let codeEntryPanel = null;
            for (const [scriptId, step] of activeEngineDetails.entries()) {
                if (step && step.type === 'taskOffer') {
                    const taskDetails = getTaskById(step.task.taskId);
                    if (taskDetails) {
                        taskOfferPanel = (
                            <TaskOfferPanel
                                task={taskDetails}
                                scriptId={scriptId}
                                onAccept={() => { handleAcceptTask(taskDetails); notifyScript(scriptId, 'branchChoice', { choice: 'Accept' }); }}
                                onDecline={() => notifyScript(scriptId, 'branchChoice', { choice: 'Decline' })}
                            />
                        );
                    }
                    break; 
                }
            if (executingTaskId) {
                const taskDetails = getTaskById(executingTaskId);
                if (taskDetails && taskDetails.type === 'CODE_ENTRY') {
                    const waitingScriptId = activeTask?.scriptId || Array.from(activeEngineDetails.keys())[0];
                    codeEntryPanel = (
                        <CodeEntryTaskPanel activeTask={taskDetails} scriptId={waitingScriptId} onClose={handleCodeEntryClose} />
                    );
                } else if (taskDetails && taskDetails.type === 'RIFT_TUNER') {
                    codeEntryPanel = (
                        <RiftTunerGame
                            isVisible={true}
                            taskData={taskDetails}
                            onClose={handleCodeEntryClose}
                            onSuccess={(result) => {
                                console.log('Rift Tuner Success:', result);
                                handleTaskComplete(taskDetails);
                                handleCodeEntryClose();
                            }}
                            onFailure={(result) => {
                                console.log('Rift Tuner Failure:', result);
                                handleCodeEntryClose();
                            }}
                        />
                    );
                } else if (taskDetails && taskDetails.type === 'LOGIC_PUZZLE') {
                    codeEntryPanel = (
                        <LogicPuzzleGame
                            isVisible={true}
                            taskData={taskDetails}
                            onClose={handleCodeEntryClose}
                            onSuccess={(result) => {
                                console.log('[App.jsx] Logic Puzzle Solved:', result);
                                // This is the single source of truth for completing the task.
                                // It will publish the 'task_completed' event that the script parser listens for.
                                console.log(`[App.jsx] Calling worldStateContext.completeTask for taskId: '${taskDetails.taskId}'`);
                                worldStateContext.completeTask(taskDetails.taskId, result);
                                handleCodeEntryClose();
                            }}
                            onFailure={(result) => {
                                console.log('Logic Puzzle Failed:', result);
                                // For now, failure allows retry within the component, so we might not need a global handler here.
                                // If we wanted failure to close the window, we would call handleCodeEntryClose() here.
                            }}
                        />
                    );
                } else {
                     if (executingTaskId) setTimeout(() => setExecutingTaskId(null), 0);
                }
            }
            }
            return taskOfferPanel || codeEntryPanel || null;
        })()}

        {/* 裂隙管理器 - AI多重人格现实裂隙系统 */}
        <RiftManager />

        {/* 全局 BGM 播放器 */}
        {currentBgm && (
          <audio src={currentBgm} autoPlay loop ref={(el) => { if (el) el.volume = 0.3; }} />
        )}
      </div>
  );
}

function App() {
  return (
    <ScriptProvider>
      <WorldStateProvider>
        <AppContent />
      </WorldStateProvider>
    </ScriptProvider>
  );
}

export default App;