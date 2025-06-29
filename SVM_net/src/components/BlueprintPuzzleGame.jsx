import React from 'react';
import BlueprintPuzzleView from './BlueprintPuzzleView';

const BlueprintPuzzleGame = ({ taskDetails, onSolve }) => {
  // Logic to manage puzzle state will go here

  return (
    <BlueprintPuzzleView
      puzzleData={taskDetails.puzzleData}
      onSuccess={() => {
        console.log('Blueprint puzzle solved!');
        onSolve(taskDetails.taskId);
      }}
    />
  );
};

export default BlueprintPuzzleGame;