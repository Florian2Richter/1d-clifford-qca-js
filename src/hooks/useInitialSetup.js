import { useEffect } from 'react';
import { CliffordQCA, PRESETS } from '../simulation/automaton.js';

/**
 * Hook to handle initial setup of the QCA on application load
 * This ensures that the stabilizer analysis is performed immediately
 * on the default configuration.
 */
export function useInitialSetup({
    setQca,
    setHistory,
    setRuleMatrix
}) {
    useEffect(() => {
        // Use the default preset (Fractal)
        const defaultPreset = 'Fractal';
        const preset = PRESETS[defaultPreset];
        
        // Create a QCA instance with the default rule matrix
        const qca = new CliffordQCA(500, preset.ruleMatrix);
        
        // Set up the initial state based on the preset
        const centerOffset = Math.floor(500 / 2) - 250;
        
        // Place the operators according to the preset
        preset.initialState.operators.forEach(op => {
            const adjustedPosition = op.position + centerOffset;
            const position = (adjustedPosition + 500) % 500;
            
            if (op.type === 'X') {
                qca.setSingleX(position);
            } else if (op.type === 'Z') {
                const state = Array(500).fill().map(() => [0, 0]);
                state[position] = [0, 1]; // Z = [0, 1]
                qca.setState(state);
            } else if (op.type === 'Y') {
                const state = Array(500).fill().map(() => [0, 0]);
                state[position] = [1, 1]; // Y = [1, 1]
                qca.setState(state);
            }
        });
        
        // Set the QCA and initial history
        setQca(qca);
        setHistory([qca.getState()]);
        
        // Set the rule matrix in the app state
        setRuleMatrix(preset.ruleMatrix.map(row => [...row]));
        
    }, [setQca, setHistory, setRuleMatrix]);
} 