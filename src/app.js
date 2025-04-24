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
    
    const currentStateRef = useRef(null);
    const spacetimeDiagramRef = useRef(null);
    
    // Initialize QCA when rule matrix changes
    useEffect(() => {
        const newQca = new CliffordQCA(
            simulationParams?.latticeSize || 20,
            ruleMatrix
        );
        setQca(newQca);
    }, [ruleMatrix]);
    
    // Run simulation when parameters change
    useEffect(() => {
        if (!simulationParams) return;
        
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
        
        // Run simulation for specified time steps
        newQca.run(timeSteps);
        
        // Update state with the new QCA and history
        setQca(newQca);
        setHistory(newQca.getHistory());
        
    }, [simulationParams]);
    
    // Render visualization when history changes
    useEffect(() => {
        if (history.length > 0 && currentStateRef.current && spacetimeDiagramRef.current) {
            // Use responsive rendering without fixed cell sizes
            renderCurrentState('current-state', history[0]);
            renderSpacetimeDiagram('spacetime-diagram', history);
        }
    }, [history]);
    
    const handleRunSimulation = (params) => {
        setSimulationParams(params);
    };
    
    const handleResetSimulation = () => {
        qca.reset();
        setHistory([qca.getState()]);
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