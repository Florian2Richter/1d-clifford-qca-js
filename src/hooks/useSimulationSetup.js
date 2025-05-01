import { useEffect } from 'react';
import { CliffordQCA, PRESETS } from '../simulation/automaton.js';
import { pauliStringToF2 } from '../simulation/clifford.js';

// Temporary PAULI constant until we import it properly
const PAULI = {
    I: [0, 0],
    X: [1, 0],
    Z: [0, 1],
    Y: [1, 1]
};

export function useSimulationSetup({
    simulationParams,
    ruleMatrix,
    setQca,
    setHistory,
    setCurrentStep,
    setStepTime,
    setRenderTime,
    setIsRunning,
    timeoutRef,
    spacetimeDiagramRef,
    renderTimeRef
}) {
    // Set up simulation when parameters change
    useEffect(() => {
        if (!simulationParams) return;
        
        // Cancel any ongoing animation
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        // Reset visualization by clearing the container
        if (spacetimeDiagramRef.current) {
            spacetimeDiagramRef.current.innerHTML = '';
        }
        
        const { 
            latticeSize, 
            timeSteps, 
            initialStateType, 
            initialPosition, 
            customPauliString,
            selectedPreset,
            isNewPresetSelection
        } = simulationParams;
        
        // Create new QCA with updated size
        const newQca = new CliffordQCA(latticeSize, ruleMatrix);
        
        // If a preset is selected, apply it
        if (selectedPreset) {
            // Handle the case where "Custom" might still be in state but was renamed to "Periodic"
            const presetName = selectedPreset === 'Custom' ? 'Periodic' : selectedPreset;
            
            // Use the rule matrix provided by the UI (allows user modifications to persist)
            // Only set the rule matrix from the preset if we're changing presets
            if (isNewPresetSelection) {
                newQca.setRuleMatrix(PRESETS[presetName].ruleMatrix);
            } else {
                // Use the user-modified rule matrix from the UI
                newQca.setRuleMatrix(ruleMatrix);
            }
            
            // Only apply the preset's initial state if not using a custom state
            if (presetName !== 'Periodic' && initialStateType !== 'custom') {
                // For non-Periodic presets, apply the preset's initial state
                const preset = PRESETS[presetName];
                const centerOffset = Math.floor(latticeSize / 2) - 250;
                
                // Initialize with identity operators
                const newState = Array(latticeSize).fill().map(() => [...PAULI.I]);
                
                // Place the operators according to the preset
                preset.initialState.operators.forEach(op => {
                    const adjustedPosition = op.position + centerOffset;
                    const position = (adjustedPosition + latticeSize) % latticeSize;
                    
                    if (op.type === 'X') {
                        newState[position] = [...PAULI.X];
                    } else if (op.type === 'Y') {
                        newState[position] = [...PAULI.Y];
                    } else if (op.type === 'Z') {
                        newState[position] = [...PAULI.Z];
                    }
                });
                
                // Set the state
                newQca.setState(newState);
            } else {
                // Set initial state based on type
                if (initialStateType === 'single-x') {
                    newQca.setSingleX(initialPosition);
                } else if (initialStateType === 'random') {
                    newQca.setRandomState();
                } else if (initialStateType === 'custom') {
                    try {
                        if (customPauliString === 'OPERATORS') {
                            // Extract operators from the UI
                            const operators = simulationParams.operators || [];
                            newQca.setMultipleOperators(operators);
                        } else {
                            // Validate and pad/truncate custom string as needed
                            let pauliArray;
                            if (customPauliString.length === latticeSize) {
                                pauliArray = pauliStringToF2(customPauliString);
                            } else if (customPauliString.length < latticeSize) {
                                // Pad with 'I' if too short
                                const paddedString = customPauliString.padEnd(latticeSize, 'I');
                                pauliArray = pauliStringToF2(paddedString);
                            } else {
                                // Truncate if too long
                                const truncatedString = customPauliString.substring(0, latticeSize);
                                pauliArray = pauliStringToF2(truncatedString);
                            }
                            newQca.setState(pauliArray);
                        }
                    } catch (error) {
                        console.error('Invalid Pauli string:', error);
                        newQca.reset(); // Reset to all identity if invalid
                    }
                }
            }
        }
        
        // Initialize with just the first state
        setQca(newQca);
        setHistory([newQca.getState()]);
        setCurrentStep(0);
        setStepTime(0);
        setRenderTime(0);
        renderTimeRef.current = 0;
        setIsRunning(true); // Automatically start the incremental animation
        
    }, [simulationParams, ruleMatrix, 
       setQca, setHistory, setCurrentStep, 
       setStepTime, setRenderTime, setIsRunning, 
       timeoutRef, spacetimeDiagramRef, renderTimeRef]);
} 