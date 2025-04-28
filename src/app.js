/**
 * Main application component for 1D Clifford QCA Simulator
 */
import React, { useState, useEffect, useRef } from 'react';
import { CliffordQCA, PRESETS } from './simulation/automaton.js';
import { pauliStringToF2 } from './simulation/clifford.js';
import { SimulationControls } from './ui/controls.js';
import { MainLayout, Section, ThreeColumnLayout } from './ui/layout.js';
import { renderSpacetimeDiagram, renderCurrentState } from './visualization/spacetime.js';

export function App() {
    const [qca, setQca] = useState(new CliffordQCA());
    const [ruleMatrix, setRuleMatrix] = useState(qca.ruleMatrix);
    const [history, setHistory] = useState([]);
    const [simulationParams, setSimulationParams] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [stepTime, setStepTime] = useState(0);
    const [renderTime, setRenderTime] = useState(0);
    
    const currentStateRef = useRef(null);
    const spacetimeDiagramRef = useRef(null);
    const timeoutRef = useRef(null);
    const renderTimeRef = useRef(0); // Store render time without triggering re-renders
    
    // Initialize QCA when rule matrix changes
    useEffect(() => {
        const newQca = new CliffordQCA(
            simulationParams?.latticeSize || 20,
            ruleMatrix
        );
        setQca(newQca);
    }, [ruleMatrix]);
    
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
        
    }, [simulationParams, ruleMatrix]);
    
    // Update the UI with performance metrics periodically without triggering re-renders
    useEffect(() => {
        if (!isRunning) return;
        
        const metricsInterval = setInterval(() => {
            setRenderTime(renderTimeRef.current);
        }, 500); // Update metrics every 500ms
        
        return () => clearInterval(metricsInterval);
    }, [isRunning]);
    
    // Incremental animation effect
    useEffect(() => {
        if (!isRunning || !simulationParams) return;
        
        // If we've reached the target number of steps, stop
        if (currentStep >= simulationParams.timeSteps) {
            setIsRunning(false);
            return;
        }
        
        // Schedule the next step with increased delay (50ms instead of 10ms)
        timeoutRef.current = setTimeout(() => {
            // Measure time for the step
            const startTime = performance.now();
            
            // Take one step in the simulation
            const newState = qca.step();
            
            // Calculate time taken
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            
            // Store the raw millisecond value without formatting
            setStepTime(timeTaken);
            
            // Update history with the new state (using functional update to avoid dependency)
            setHistory(prevHistory => [...prevHistory, newState]);
            setCurrentStep(prevStep => prevStep + 1);
            
        }, 10); // Changed back to 10ms since rendering is now around 5ms
        
        // Cleanup on unmount or when running state changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isRunning, currentStep, qca, simulationParams]);
    
    // Render visualization when history changes
    useEffect(() => {
        if (history.length > 0 && currentStateRef.current && spacetimeDiagramRef.current) {
            // Measure rendering time
            const renderStartTime = performance.now();
            
            // Render spacetime diagram first to calculate the cell size
            const usedCellSize = renderSpacetimeDiagram('spacetime-diagram', history);
            
            // Render current state using the same cell size
            renderCurrentState('current-state', history[history.length - 1], usedCellSize);
            
            // Calculate rendering time and store in ref (avoiding re-render)
            const renderEndTime = performance.now();
            renderTimeRef.current = renderEndTime - renderStartTime;
        }
    }, [history]);
    
    const handleRunSimulation = (params) => {
        // If params includes a ruleMatrix, update our state
        if (params.ruleMatrix) {
            // Create a deep copy to avoid reference issues
            setRuleMatrix(params.ruleMatrix.map(row => [...row]));
        }
        setSimulationParams(params);
    };
    
    const handleResetSimulation = () => {
        // Stop any running animation
        setIsRunning(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        // Reset visualization by clearing the container
        if (spacetimeDiagramRef.current) {
            spacetimeDiagramRef.current.innerHTML = '';
        }
        
        // Reset QCA to initial state
        qca.reset();
        setHistory([qca.getState()]);
        setCurrentStep(0);
        setStepTime(0);
        setRenderTime(0);
        renderTimeRef.current = 0;
    };
    
    return (
        <MainLayout>
            <ThreeColumnLayout
                leftColumn={
                    <>
                        <Section title="Simulation" collapsible={true}>
                            <SimulationControls
                                onRunSimulation={handleRunSimulation}
                                onResetSimulation={handleResetSimulation}
                            />
                        </Section>
                        
                        <Section title="Performance" collapsible={true} defaultExpanded={false}>
                            <div className="info-panel">
                                <p><strong>Computation Time:</strong> {stepTime > 0 ? `${stepTime.toFixed(3)} ms` : '< 0.001 ms'}</p>
                                <p><strong>Rendering Time:</strong> {renderTime > 0 ? `${renderTime.toFixed(3)} ms` : '< 0.001 ms'}</p>
                                <p><strong>Current Step:</strong> {currentStep}</p>
                            </div>
                        </Section>
                    </>
                }
                centerColumn={
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Section title="Current State" style={{ marginBottom: '10px' }}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <canvas 
                                id="current-state" 
                                ref={currentStateRef}
                                className="visualization-container"
                                style={{ 
                                        minHeight: '40px',
                                        height: '40px',
                                    display: 'block',
                                    padding: 0,
                                        margin: 0,
                                        width: '100%'
                                }}
                            ></canvas>
                            </div>
                        </Section>
                        
                        <Section title="Spacetime Diagram" 
                            style={{ 
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                height: 'calc(100% - 100px)'
                            }}
                        >
                            <div 
                                id="spacetime-diagram" 
                                ref={spacetimeDiagramRef}
                                className="visualization-container"
                                style={{ 
                                    flex: 1,
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            ></div>
                        </Section>
                    </div>
                }
                rightColumn={
                    <>
                        <Section title="About" collapsible={true} defaultExpanded={false} style={{ height: 'auto', marginBottom: '10px' }}>
                            <div className="info-panel">
                                <p>
                                    This simulator demonstrates a 1D Clifford Quantum Cellular Automaton,
                                    where each cell is represented by a Pauli operator (I, X, Z, Y)
                                    and evolves according to a local update rule.
                                </p>
                                <p>
                                    Clifford QCAs are important models for studying quantum information
                                    propagation and have applications in quantum error correction and 
                                    quantum simulation.
                                </p>
                            </div>
                        </Section>
                    </>
                }
            />
        </MainLayout>
    );
} 