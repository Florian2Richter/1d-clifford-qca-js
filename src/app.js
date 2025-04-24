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
    const [animationSpeed, setAnimationSpeed] = useState(200); // ms per step
    
    const currentStateRef = useRef(null);
    const spacetimeDiagramRef = useRef(null);
    const animationRef = useRef(null);
    
    // Initialize QCA when rule matrix changes
    useEffect(() => {
        const newQca = new CliffordQCA(
            simulationParams?.latticeSize || 20,
            ruleMatrix
        );
        setQca(newQca);
    }, [ruleMatrix]);
    
    // Reset simulation and prepare initial state
    useEffect(() => {
        if (!simulationParams) return;
        
        // Stop any running animation
        if (animationRef.current) {
            clearTimeout(animationRef.current);
            animationRef.current = null;
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
        
        // Initialize history with just the initial state
        setQca(newQca);
        setHistory([newQca.getState()]);
        setCurrentStep(0);
        
        // If auto-start is enabled, begin animation
        if (simulationParams.autoStart) {
            setIsRunning(true);
        }
        
    }, [simulationParams]);
    
    // Animation effect - step through the simulation
    useEffect(() => {
        if (!isRunning || !simulationParams) return;
        
        // Stop if we've reached the desired number of time steps
        if (currentStep >= simulationParams.timeSteps) {
            setIsRunning(false);
            return;
        }
        
        // Schedule the next step
        animationRef.current = setTimeout(() => {
            // Take one step in the simulation
            qca.step();
            
            // Update history with the new state
            const newHistory = [...history, qca.getState()];
            setHistory(newHistory);
            setCurrentStep(currentStep + 1);
            
        }, animationSpeed);
        
        // Clean up on unmount or when dependencies change
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [isRunning, currentStep, qca, history, simulationParams, animationSpeed]);
    
    // Render visualization when history changes
    useEffect(() => {
        if (history.length > 0 && currentStateRef.current && spacetimeDiagramRef.current) {
            // Render current state (always the last item in history)
            renderCurrentState('current-state', history[history.length - 1]);
            
            // Render spacetime diagram with the entire history so far
            renderSpacetimeDiagram('spacetime-diagram', history);
        }
    }, [history]);
    
    const handleRunSimulation = (params) => {
        // We now only set up the simulation parameters; actual running is managed by the animation effect
        setSimulationParams({
            ...params,
            autoStart: true
        });
    };
    
    const handleStepSimulation = () => {
        if (currentStep < simulationParams?.timeSteps && !isRunning) {
            qca.step();
            const newHistory = [...history, qca.getState()];
            setHistory(newHistory);
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handleToggleSimulation = () => {
        setIsRunning(!isRunning);
    };
    
    const handleResetSimulation = () => {
        // Stop any animation
        setIsRunning(false);
        if (animationRef.current) {
            clearTimeout(animationRef.current);
            animationRef.current = null;
        }
        
        // Reset the QCA to initial state
        if (simulationParams) {
            const { 
                latticeSize, 
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
            
            setQca(newQca);
            setHistory([newQca.getState()]);
            setCurrentStep(0);
        } else {
            qca.reset();
            setHistory([qca.getState()]);
            setCurrentStep(0);
        }
    };
    
    const handleRuleMatrixChange = (newMatrix) => {
        setRuleMatrix(newMatrix);
    };
    
    const handleSpeedChange = (newSpeed) => {
        setAnimationSpeed(newSpeed);
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
                                onStepSimulation={handleStepSimulation}
                                onToggleSimulation={handleToggleSimulation}
                                onSpeedChange={handleSpeedChange}
                                isRunning={isRunning}
                                currentStep={currentStep}
                                maxSteps={simulationParams?.timeSteps || 0}
                                animationSpeed={animationSpeed}
                            />
                        </Section>
                        
                        <Section title="Rule Matrix" collapsible={true}>
                            <RuleMatrixEditor
                                ruleMatrix={ruleMatrix}
                                onRuleMatrixChange={handleRuleMatrixChange}
                            />
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