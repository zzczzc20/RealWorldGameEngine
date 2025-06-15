// src/components/CodeEntryTaskPanel.jsx
import React, { useState, useEffect } from 'react';
import CyberButton from './ui/CyberButton';
import CyberCard from './ui/CyberCard';
import { publish } from '../services/EventService'; // Removed notifyScript, not needed here
import { getTaskById } from '../data/taskData';

// Panel specifically for handling tasks requiring code entry
// Accept activeTask, scriptId, and onClose callback
function CodeEntryTaskPanel({ activeTask, scriptId, onClose }) {
  // Task details are now passed directly in activeTask prop
  const task = activeTask; // Use the passed task object

  const [status, setStatus] = useState('idle'); // idle, processing, success, failed
  const [code, setCode] = useState('');

  // Log when the panel renders or task changes
  // useEffect depends on the task object itself now
  useEffect(() => {
    console.log("[CodeEntryTaskPanel] Rendering for task:", task);
    setStatus('idle'); // Reset status when task changes
    setCode(''); // Clear code input when task changes
  }, [task]);

  // Removed duplicate useEffect

  if (!task || task.type !== 'CODE_ENTRY') {
    // This check might be redundant if App.jsx filters correctly, but good for safety
    console.error("[CodeEntryTaskPanel] Invalid or non-CODE_ENTRY task provided:", task);
    return null;
  }

  const handleSubmit = () => {
    setStatus('processing');
    console.log(`[CodeEntryTaskPanel] Attempting task ${task.taskId} with code: ${code}`);
    // Simulate processing time
    setTimeout(() => {
      let outcome;
      if (code === task.correctCode) {
        setStatus('success');
        outcome = 'success';
        console.log(`[CodeEntryTaskPanel] Task ${task.taskId} successful!`);
      } else {
        setStatus('failed');
        outcome = 'failure';
        console.error(`[CodeEntryTaskPanel] Task ${task.taskId} failed. Incorrect code.`);
        // Reset input field after failure message display
        setTimeout(() => setStatus('idle'), 2000);
      }

      // Publish the outcome event that the script is waiting for
      const eventData = {
        taskId: task.taskId, // Use taskId from the passed activeTask
        outcome: outcome
      };
      console.log("[CodeEntryTaskPanel] Publishing task_outcome event:", eventData);
      publish('task_outcome', eventData); // Publish the generic outcome event

      // Call onClose after a short delay to allow user to see success/failure message
      // Only close on success or non-retryable failure (currently all failures are non-retryable in this panel)
      if (outcome === 'success' || outcome === 'failure') { // Assuming failure means stop trying
          setTimeout(() => {
              console.log("[CodeEntryTaskPanel] Calling onClose...");
              if (onClose) onClose(); // Call the callback passed from App.jsx
          }, 1800); // Slightly longer than the processing timeout
      }

    }, 1500); // Simulate 1.5 second processing time
  };

  // Determine dynamic styles based on task (example using taskId)
  let borderColor = "border-cyan-400";
  let shadowColor = "shadow-cyan-500/20";
  let titleColor = "text-cyan-400";
  if (task.taskId === 'TASK_CAMERA_HACK') {
    borderColor = "border-red-400";
    shadowColor = "shadow-red-500/20";
    titleColor = "text-red-400";
  } else if (task.taskId === 'TASK_DATA_EXTRACTION') {
    borderColor = "border-blue-400";
    shadowColor = "shadow-blue-500/20";
    titleColor = "text-blue-400";
  } else if (task.taskId === 206) { // Uplink Repair
     borderColor = "border-amber-400";
     shadowColor = "shadow-amber-500/20";
     titleColor = "text-amber-400";
  }


  return (
    // Use a fixed overlay similar to TaskOfferPanel
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <CyberCard className={`max-w-lg w-full bg-gray-900 p-6 ${borderColor} ${shadowColor}`}>
        <h2 className={`text-2xl font-bold mb-2 ${titleColor}`}>{task.title}</h2>
        <p className="text-gray-300 mb-6">{task.description}</p>

        {status === 'success' ? (
          <div className="text-center p-4 bg-green-900/50 border border-green-500 rounded">
            <p className="text-lg font-bold text-green-300">SUCCESS</p>
            {task.successMessage && <p className="text-sm text-gray-300 mt-1">{task.successMessage}</p>}
            {/* Panel will disappear when onClose is called */}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="taskCode" className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Access Code:</label>
              <input
                type="text"
                id="taskCode"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                }}
                disabled={status === 'processing'}
                placeholder="Enter Code..."
                className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-${borderColor.split('-')[1]}-500 disabled:opacity-50`}
              />
            </div>

            <CyberButton
              onClick={handleSubmit}
              disabled={status === 'processing' || !code}
              className={`w-full ${status === 'processing' ? '!bg-gray-500' : ''}`}
            >
              {status === 'processing' ? 'Processing...' : 'Submit Code'}
            </CyberButton>

            {status === 'failed' && (
              <p className="text-xs text-red-400 mt-2 text-center">
                {task.failureMessage || "Operation Failed. Incorrect Code."}
              </p>
            )}

            {/* Optional: Add a Cancel button that just calls onClose */}
            <CyberButton
              onClick={onClose} // Allow user to cancel/close
              disabled={status === 'processing'}
              className="w-full mt-3 !bg-gray-600 hover:!bg-gray-500"
            >
              Cancel
            </CyberButton>
          </>
        )}
      </CyberCard>
    </div>
  );
}

export default CodeEntryTaskPanel;