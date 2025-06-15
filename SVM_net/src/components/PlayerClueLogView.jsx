import React, { useState } from 'react';
import { useWorldStateContext } from '../context/WorldStateContext';

function PlayerClueLogView({ isVisible, onClose }) {
  const { discoveredClues } = useWorldStateContext();
  const [expandedClueId, setExpandedClueId] = useState(null);

  if (!isVisible) {
    return null;
  }

  const toggleClueExpansion = (clueId) => {
    setExpandedClueId(prevId => (prevId === clueId ? null : clueId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-purple-600 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-purple-400">线索日志</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Close Clue Log"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {discoveredClues && discoveredClues.length > 0 ? (
            discoveredClues.map((clue) => (
              <div key={clue.id} className="bg-gray-700 p-3 rounded-md shadow">
                <button
                  onClick={() => toggleClueExpansion(clue.id)}
                  className="w-full text-left text-purple-300 hover:text-purple-200 focus:outline-none"
                >
                  <h3 className="text-lg font-medium">{clue.title || '无标题线索'}</h3>
                  <p className="text-xs text-gray-400">来源: {clue.source || '未知'} | 时间: {clue.timestamp ? new Date(clue.timestamp).toLocaleString() : '未知'}</p>
                </button>
                {expandedClueId === clue.id && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    {clue.type === 'text' && (
                      <p className="text-gray-300 whitespace-pre-wrap">{clue.content}</p>
                    )}
                    {clue.type === 'image_url' && (
                      <div>
                        <p className="text-sm text-gray-400">图片线索 (内容将在后续步骤中显示):</p>
                        <a href={clue.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{clue.content}</a>
                        {/* Later, this will be an <img> tag */}
                      </div>
                    )}
                    {/* Add handling for other clue types here later */}
                    {clue.description && (
                        <p className="mt-1 text-xs italic text-gray-500">{clue.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">尚未发现任何线索。</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-700 text-right">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
                关闭
            </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerClueLogView;