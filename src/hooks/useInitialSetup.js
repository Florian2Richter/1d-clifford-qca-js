import { useEffect } from 'react';
import { CliffordQCA, PRESETS } from '../simulation/automaton.js';

/**
 * Setup hook - handles initial state setup for the QCA
 */
export function useInitialSetup({ 
    defaultPreset, 
    setQca, 
    setHistory, 
    setCurrentStep 
}) {
    // Create initial QCA on mount
    useEffect(() => {
        // Get the default preset
        const preset = PRESETS[defaultPreset];
        
        // Create a QCA instance with the default rule matrix
        const qca = new CliffordQCA(100, preset.ruleMatrix);
        
        // Set up the initial state based on the preset
        const centerOffset = Math.floor(100 / 2) - 50;
        
        // Place the operators according to the preset
        preset.initialState.operators.forEach(op => {
            const adjustedPosition = op.position + centerOffset;
            const position = (adjustedPosition + 100) % 100;
            
            if (op.type === 'X') {
                qca.setSingleX(position);
            } else if (op.type === 'Z') {
                const state = Array(100).fill().map(() => [0, 0]);
                state[position] = [0, 1]; // Z = [0, 1]
                qca.setState(state);
            } else if (op.type === 'Y') {
                const state = Array(100).fill().map(() => [0, 0]);
                state[position] = [1, 1]; // Y = [1, 1]
                qca.setState(state);
            }
        });
        
        // Set the QCA and initial history
        setQca(qca);
        setHistory([qca.getState()]);
        setCurrentStep(0);
    }, [defaultPreset, setQca, setHistory, setCurrentStep]);
} 