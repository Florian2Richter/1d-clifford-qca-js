/**
 * Main application component for 1D Clifford QCA Simulator
 */
import React, { useState, useEffect, useRef } from 'react';
import { CliffordQCA } from './simulation/automaton.js';
import { pauliStringToF2 } from './simulation/clifford.js';
import { SimulationControls, RuleMatrixEditor } from './ui/controls.js';
import { MainLayout, Section, TwoColumnLayout } from './ui/layout.js';
import { renderSpacetimeDiagram, renderCurrentState } from './visualization/spacetime.js';

export function App() {
    const [qca, setQca] = useState(new CliffordQCA());
    const [ruleMatrix, setRuleMatrix] = useState(qca.ruleMatrix);
    const [history, setHistory] = useState([]);
    const [simulationParams, setSimulationParams] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [stepTime, setStepTime] = useState(0);
    
    const currentStateRef = useRef(null);
    const spacetimeDiagramRef = useRef(null);
    const timeoutRef = useRef(null);
    
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
            customPauliString 
        } = simulationParams;
        
        // Create new QCA with updated size
        const newQca = new CliffordQCA(latticeSize, ruleMatrix);
        
        // Set initial state based on type
        if (initialStateType === 'single-x') {
            newQca.setSingleX(initialPosition);
        } else if (initialStateType === 'random') {
            newQca.setRandomState();
        } else if (initialStateType === 'custom') {
            try {
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
            } catch (error) {
                console.error('Invalid Pauli string:', error);
                newQca.reset(); // Reset to all identity if invalid
            }
        }
        
        // Initialize with just the first state
        setQca(newQca);
        setHistory([newQca.getState()]);
        setCurrentStep(0);
        setStepTime(0);
        setIsRunning(true); // Automatically start the incremental animation
        
    }, [simulationParams, ruleMatrix]);
    
    // Incremental animation effect
    useEffect(() => {
        if (!isRunning || !simulationParams) return;
        
        // If we've reached the target number of steps, stop
        if (currentStep >= simulationParams.timeSteps) {
            setIsRunning(false);
            return;
        }
        
        // Schedule the next step (200ms delay between steps)
        timeoutRef.current = setTimeout(() => {
            // Measure time for the step
            const startTime = performance.now();
            
            // Take one step in the simulation
            qca.step();
            
            // Calculate time taken
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            setStepTime(timeTaken.toFixed(4));
            
            // Update history with the new state
            const newHistory = [...history, qca.getState()];
            setHistory(newHistory);
            setCurrentStep(currentStep + 1);
            
        }, 200); // Animation speed (in milliseconds)
        
        // Cleanup on unmount or when running state changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isRunning, currentStep, qca, history, simulationParams]);
    
    // Render visualization when history changes
    useEffect(() => {
        if (history.length > 0 && currentStateRef.current && spacetimeDiagramRef.current) {
            // Render current state (always the last item in history)
            renderCurrentState('current-state', history[history.length - 1]);
            
            // Render spacetime diagram with all accumulated history
            renderSpacetimeDiagram('spacetime-diagram', history);
        }
    }, [history]);
    
    const handleRunSimulation = (params) => {
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
    };
    
    const handleRuleMatrixChange = (newMatrix) => {
        setRuleMatrix(newMatrix);
    };
    
    return (
        <MainLayout>
            <TwoColumnLayout
                leftColumn={
                    <>
                        <Section title="About" collapsible={true} defaultExpanded={false}>
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
                        </Section>
                        
                        <Section title="Simulation Parameters" collapsible={true}>
                            <SimulationControls
                                onRunSimulation={handleRunSimulation}
                                onResetSimulation={handleResetSimulation}
                            />
                        </Section>
                        
                        <Section title="Rule Matrix" collapsible={true}>
                            <RuleMatrixEditor
                                ruleMatrix={ruleMatrix}
                                onRuleMatrixChange={handleRuleMatrixChange}
                            />
                        </Section>
                        
                        <Section title="Performance" collapsible={true}>
                            <div className="info-panel">
                                <p><strong>Last Step Time:</strong> {stepTime} ms</p>
                                <p><strong>Current Step:</strong> {currentStep}</p>
                            </div>
                        </Section>
                    </>
                }
                rightColumn={
                    <>
                        <Section title="Current State">
                            <div 
                                id="current-state" 
                                ref={currentStateRef}
                                className="visualization-container"
                            ></div>
                        </Section>
                        
                        <Section title="Spacetime Diagram" 
                            style={{ 
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <div 
                                id="spacetime-diagram" 
                                ref={spacetimeDiagramRef}
                                className="visualization-container"
                                style={{ flex: 1 }}
                            ></div>
                        </Section>
                    </>
                }
            />
        </MainLayout>
    );
} 