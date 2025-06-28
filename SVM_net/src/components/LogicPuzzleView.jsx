// src/components/LogicPuzzleView.jsx
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CyberButton from './ui/CyberButton';
import CyberCard from './ui/CyberCard';

const ItemTypes = {
  DOCUMENT: 'document',
};

const Document = ({ id, content, onDrop }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.DOCUMENT,
    item: { id, content },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 border border-cyan-700/50 rounded-md bg-gray-800/60 cursor-pointer hover:bg-cyan-900/50 transition-colors duration-200 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ touchAction: 'none' }}
    >
      <p className="text-sm text-gray-300">{content}</p>
    </div>
  );
};

const Clueboard = ({ droppedItems, onDrop, puzzleData }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.DOCUMENT,
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const highlightKeywords = (text) => {
    let highlightedText = text;
    puzzleData.clueboardKeywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span class="text-yellow-400 font-bold">$1</span>');
    });
    return { __html: highlightedText };
  };

  return (
    <div
      ref={drop}
      className={`p-4 border-2 border-dashed rounded-lg min-h-[200px] transition-colors ${isOver ? 'border-yellow-400 bg-gray-700/50' : 'border-gray-600 bg-gray-800/30'}`}
    >
      <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-500/30 pb-2">线索板</h3>
      {droppedItems.length === 0 ? (
        <p className="text-gray-500 italic text-center pt-8">将左侧的文档碎片拖拽到此处以分析线索...</p>
      ) : (
        <ul className="space-y-2">
          {droppedItems.map((item, index) => (
            <li key={index} className="bg-gray-700/50 p-_2 rounded" dangerouslySetInnerHTML={highlightKeywords(item.content)} />
          ))}
        </ul>
      )}
    </div>
  );
};

const LogicPuzzleView = ({ task, onSolve, onFail }) => {
  const [droppedItems, setDroppedItems] = useState([]);
  const [solution, setSolution] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showFinalDocument, setShowFinalDocument] = useState(false);

  const { puzzleData } = task;

  const handleDrop = (item) => {
    if (!droppedItems.find(d => d.id === item.id)) {
      setDroppedItems(prev => [...prev, item]);
    }
  };

  useEffect(() => {
    const requiredKeywords = ["反讽美学", "异质空间", "对主流秩序的冷峻戏仿"];
    const droppedContent = droppedItems.map(d => d.content).join(' ');
    const allKeywordsFound = requiredKeywords.every(kw => droppedContent.includes(kw));
    if (allKeywordsFound) {
      setTimeout(() => setShowAdvancedSearch(true), 500);
    }
  }, [droppedItems]);

  const handleAdvancedSearch = () => {
      setShowFinalDocument(true);
  };
  
  const handleSubmit = () => {
    if (solution.toUpperCase() === puzzleData.finalSolution) {
      onSolve(task.taskId);
    } else {
      onFail(task.taskId);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 bg-gray-900 text-white rounded-lg font-mono">
        <h2 className="text-xl text-cyan-400 font-bold mb-4">{task.title}</h2>
        <p className="text-gray-400 mb-6">{task.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel: Documents */}
          <div>
            <h3 className="text_lg font-semibold text-cyan-300 mb-3">数据库碎片</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto p-2 bg-black/30 rounded-lg">
              {puzzleData.documents.map(doc => (
                <Document key={doc.id} id={doc.id} content={doc.content} onDrop={handleDrop} />
              ))}
            </div>
          </div>
          
          {/* Right Panel: Clueboard & Solver */}
          <div className="space-y-4">
            <Clueboard droppedItems={droppedItems} onDrop={handleDrop} puzzleData={puzzleData} />
            
            {showAdvancedSearch && (
              <CyberButton onClick={handleAdvancedSearch} className="w-full">
                高级搜索
              </CyberButton>
            )}

            {showFinalDocument && (
              <CyberCard>
                  <div className="p-4">
                      <h4 className="text-lg text-yellow-400">{puzzleData.finalDocument.title}</h4>
                      <p className="text-gray-300 mt-2">{puzzleData.finalDocument.content}</p>
                  </div>
              </CyberCard>
            )}

            <div className="flex items-center space-x-3 pt-4">
              <input
                type="text"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="输入设计师名字..."
                className="flex-grow bg-gray-800 border-2 border-cyan-700 focus:border-yellow-400 rounded-md px-4 py-2 text-white outline-none"
              />
              <CyberButton onClick={handleSubmit}>
                提交
              </CyberButton>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default LogicPuzzleView;