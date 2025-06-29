    import React from 'react';
    import { useSpring, a } from '@react-spring/three';

    const BlueprintNode = ({ nodeData, onNodeUpdate }) => {
      const { id, initialState, meshType, color, paradoxRule } = nodeData;
      
      const [currentState, setCurrentState] = React.useState(initialState);

      const springProps = useSpring({
        rotation: currentState.rotation || [0, 0, 0],
        scale: currentState.scale || [1, 1, 1],
        config: { friction: 20, tension: 200 }
      });

      const handleClick = (e) => {
        e.stopPropagation();

        let updatedState = { ...currentState };
        
        switch (paradoxRule) {
          case 'CAGE': // Toggles rotation 180 degrees on Y axis
            const newYRotation = (currentState.rotation[1] > 0) ? 0 : Math.PI;
            updatedState.rotation = [currentState.rotation[0], newYRotation, currentState.rotation[2]];
            break;
          case 'TRAP': // Inverts scale on Y axis
            const newYScale = -currentState.scale[1];
            updatedState.scale = [currentState.scale[0], newYScale, currentState.scale[2]];
            break;
          case 'VOID': // Toggles visibility
            const newVisibility = currentState.visible === false ? true : false;
            updatedState.visible = newVisibility;
            break;
          default:
            break;
        }
        
        setCurrentState(updatedState);
        onNodeUpdate(id, updatedState);
      };

      const renderMesh = () => {
        switch (meshType) {
          case 'cylinder':
            return <cylinderGeometry args={[initialState.scale[0] / 2, initialState.scale[0] / 2, initialState.scale[1], 32]} />;
          case 'box':
          default:
            return <boxGeometry args={initialState.scale} />;
        }
      };
      
      const isVisible = currentState.visible !== false;

      return (
        <a.mesh
          position={currentState.position}
          rotation={springProps.rotation}
          scale={springProps.scale}
          onClick={handleClick}
          castShadow
          visible={isVisible}
        >
          {renderMesh()}
          <meshStandardMaterial color={color} transparent opacity={isVisible ? 1.0 : 0.15} />
        </a.mesh>
      );
    };

    export default BlueprintNode;