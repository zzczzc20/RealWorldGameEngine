    import React, { useState, useEffect, useCallback } from 'react';
    import { Canvas } from '@react-three/fiber';
    import { OrbitControls, Grid } from '@react-three/drei';
    import BlueprintNode from './BlueprintNode';
    import * as THREE from 'three';

    const BlueprintPuzzleView = ({ puzzleData, onSuccess }) => {
      const { nodes, cameraPosition, notes } = puzzleData;
      const [nodesState, setNodesState] = useState(() => {
        const initialState = {};
        nodes.forEach(node => {
          initialState[node.id] = { ...node.initialState };
        });
        return initialState;
      });

      const checkWinCondition = useCallback(() => {
        for (const node of nodes) {
          const currentState = nodesState[node.id];
          const correctState = node.correctState;
          
          for (const key in correctState) {
            const currentValue = currentState[key];
            const correctValue = correctState[key];
            
            if (Array.isArray(currentValue)) { // For rotation, position, scale
               if (!currentValue.every((v, i) => Math.abs(v - correctValue[i]) < 0.01)) {
                 return false; // Not solved
               }
            } else { // For visibility
              if (currentValue !== correctValue) {
                return false; // Not solved
              }
            }
          }
        }
        return true; // Solved
      }, [nodes, nodesState]);

      useEffect(() => {
        if (checkWinCondition()) {
          console.log("PUZZLE SOLVED!");
          setTimeout(() => onSuccess(), 1000); // Delay for visual feedback
        }
      }, [nodesState, checkWinCondition, onSuccess]);
      
      const handleNodeUpdate = (nodeId, updatedState) => {
        setNodesState(prevState => ({
          ...prevState,
          [nodeId]: updatedState,
        }));
      };

      return (
        <div style={{ display: 'flex', height: '100%', width: '100%', background: '#111' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Canvas
              shadows
              camera={{ position: cameraPosition, fov: 50 }}
              style={{ background: 'linear-gradient(to bottom, #2d3a4d, #1a202c)' }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight castShadow position={[10, 20, 15]} intensity={1.5} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
              
              {nodes.map(node => (
                <BlueprintNode key={node.id} nodeData={node} onNodeUpdate={handleNodeUpdate} />
              ))}

              <Grid position={[0, -2, 0]} args={[100, 100]} cellColor={'#666'} sectionColor={'#888'} fadeDistance={50} infiniteGrid />
              <OrbitControls />
            </Canvas>
          </div>
          <div style={{ width: '300px', background: 'rgba(0,0,0,0.3)', color: 'white', padding: '20px', fontFamily: 'monospace' }}>
            <h3>KGF's Notes</h3>
            <ul>
              {notes.map((note, index) => (
                <li key={index} style={{marginBottom: '10px'}}>"{note}"</li>
              ))}
            </ul>
             {checkWinCondition() && <div style={{color: '#0f0', marginTop: '20px'}}>SYSTEM ALIGNED</div>}
          </div>
        </div>
      );
    };

    export default BlueprintPuzzleView;