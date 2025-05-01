import { useEffect } from 'react';
import { CliffordQCA } from '../simulation/automaton.js';

export function useQCAInitialization({ 
    ruleMatrix, 
    simulationParams, 
    setQca 
}) {
    // Initialize QCA when rule matrix changes
    useEffect(() => {
        const newQca = new CliffordQCA(
            simulationParams?.latticeSize || 20,
            ruleMatrix
        );
        setQca(newQca);
    }, [ruleMatrix, simulationParams?.latticeSize, setQca]);
} 