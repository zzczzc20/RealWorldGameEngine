// src/views/TaskListView.jsx
import React, { useState } from 'react';
import CyberButton from '../components/ui/CyberButton';
import CyberCard from '../components/ui/CyberCard';
import { useWorldStateContext } from '../context/WorldStateContext';
import tasks from '../data/taskData';

// Accept onExecuteTask prop
function TaskListView({ onAcceptTask, onExecuteTask, activeTask }) {
  const { unlockedTasks, completedTasks } = useWorldStateContext();
  const [taskStatus, setTaskStatus] = useState({}); // Local status for accepting animation/feedback

  // 调试信息
  console.log('[TaskListView] unlockedTasks:', unlockedTasks);
  console.log('[TaskListView] all tasks:', tasks.map(t => ({ id: t.taskId, initiallyVisible: t.initiallyVisible })));

  // Keep handleAcceptTask for non-CODE_ENTRY tasks offered via this view (if any)
  const handleAcceptClick = (task) => {
    const taskId = task.taskId;
    setTaskStatus(prev => ({ ...prev, [taskId]: 'accepting' }));

    // Simulate API call delay
    setTimeout(() => {
      // Simulate success/failure (e.g., 90% success rate)
      const success = Math.random() < 0.9;
      if (success) {
        setTaskStatus(prev => ({ ...prev, [taskId]: 'accepted' }));
        console.log(`Task accepted: ${task.title}`);
        onAcceptTask(task); // Call the callback passed from App.jsx
      } else {
        setTaskStatus(prev => ({ ...prev, [taskId]: 'failed' }));
         console.error(`Failed to accept task: ${task.title}`);
         // Reset failed status after a few seconds to allow retry
         setTimeout(() => {
           setTaskStatus(prev => ({ ...prev, [taskId]: 'idle' }));
         }, 2500);
      }
      // Note: 'accepted' status persists in this simulation
    }, 1200); // 1.2 second delay
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Available Tasks</h1> {/* Changed title */}
        <p className="text-gray-400">Select a task to view details or execute</p> {/* Adjusted text */}
      </div>

      {/* Use CyberCard for task list */}
      <CyberCard>
        <div className="border-b border-cyan-500/30 px-4 py-3"> {/* Header inside card */}
          <h2 className="text-lg font-semibold text-cyan-400">Task List</h2>
        </div>

        {/* Task items */}
        <div className="divide-y divide-gray-700">
          {/* 只显示已解锁的任务 */}
          {tasks
            .filter(task => unlockedTasks.includes(task.taskId))
            .map((task) => {
            const currentLocalStatus = taskStatus[task.taskId] || 'idle';
            // Check if this task is the globally active task
            const isGloballyActive = activeTask?.taskId === task.taskId;

            // Determine button state and text
            let buttonText = 'Accept';
            let buttonDisabled = currentLocalStatus === 'accepting' || currentLocalStatus === 'accepted';
            let buttonAction = () => handleAcceptClick(task);
            let buttonClass = '';

            if (isGloballyActive) {
                buttonDisabled = true;
                buttonText = 'Active';
                buttonClass = '!bg-green-600 !text-white cursor-default';
                // If it's an active CODE_ENTRY or RIFT_TUNER task, show Execute button instead
                if (task.type === 'CODE_ENTRY' || task.type === 'RIFT_TUNER') {
                    buttonText = task.type === 'RIFT_TUNER' ? '调谐' : 'Execute';
                    buttonDisabled = false; // Allow execution
                    buttonAction = () => onExecuteTask(task.taskId); // Call the new handler
                    buttonClass = task.type === 'RIFT_TUNER' ?
                        '!bg-purple-500 hover:!bg-purple-400' :
                        '!bg-yellow-500 hover:!bg-yellow-400'; // Style for execute
                }
            } else if (currentLocalStatus === 'accepting') {
                buttonText = 'Accepting...';
                buttonDisabled = true;
                buttonClass = '!bg-gray-500';
            } else if (currentLocalStatus === 'accepted') {
                 // Allow re-accept if needed, otherwise keep disabled 'Accepted'
                 buttonText = 'Accept';
                 buttonDisabled = false;
                 buttonAction = () => handleAcceptClick(task);
            }


            return (
              <div key={task.taskId} className="p-4 flex justify-between items-start hover:bg-gray-700/30 transition-colors duration-150">
                {/* Task Details */}
                <div>
                  <h3 className="font-medium text-lg mb-1">{task.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{task.description}</p>
                  <div className="flex text-xs text-gray-500 space-x-4">
                    {/* Conditionally display difficulty/time if they exist */}
                    {task.difficulty && <span>DIFFICULTY: <span className="font-medium text-gray-400">{task.difficulty.toUpperCase()}</span></span>}
                    {task.estimatedTime && <span>TIME: <span className="font-medium text-gray-400">{task.estimatedTime.toUpperCase()}</span></span>}
                    <span>TYPE: <span className="font-medium text-gray-400">{task.type || 'N/A'}</span></span>
                  </div>
                </div>
                {/* Reward and Action Button */}
                <div className="flex flex-col items-end ml-4 flex-shrink-0 relative">
                  {task.reward !== undefined && <div className="font-bold text-cyan-300 mb-2 text-lg">{task.reward} PTS</div>}
                  <CyberButton
                    onClick={buttonAction}
                    disabled={buttonDisabled}
                    className={`py-1 px-3 text-xs w-24 text-center ${buttonClass}`}
                  >
                    {buttonText}
                  </CyberButton>
                   {/* Status Message */}
                   {currentLocalStatus === 'failed' && (
                     <span className="absolute -bottom-4 right-0 text-xs text-red-400 whitespace-nowrap">Failed. Retry?</span>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </CyberCard>
    </div>
  );
}

export default TaskListView;