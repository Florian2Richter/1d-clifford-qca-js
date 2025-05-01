/**
 * Main application component for 1D Clifford QCA Simulator
 */
import React from 'react';
import { CliffordQCA, PRESETS } from './simulation/automaton.js';
import { pauliStringToF2 } from './simulation/clifford.js';
import { SimulationControls } from './ui/controls.js';
import { MainLayout, Section, ThreeColumnLayout } from './ui/layout.js';
import { renderSpacetimeDiagram, renderCurrentState } from './visualization/spacetime.js';

// Import custom hooks
import { useSimulationState } from './hooks/useSimulationState.js';
import { useQCAInitialization } from './hooks/useQCAInitialization.js';
import { useSimulationSetup } from './hooks/useSimulationSetup.js';
import { useSimulationAnimation } from './hooks/useSimulationAnimation.js';
import { useVisualization } from './hooks/useVisualization.js';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics.js';

export function App() {
    const {
        qca, setQca,
        ruleMatrix, setRuleMatrix,
        history, setHistory,
        simulationParams, setSimulationParams,
        currentStep, setCurrentStep,
        isRunning, setIsRunning,
        stepTime, setStepTime,
        renderTime, setRenderTime,
        currentStateRef,
        spacetimeDiagramRef,
        timeoutRef,
        renderTimeRef
    } = useSimulationState();

    // Initialize QCA when rule matrix changes
    useQCAInitialization({ 
        ruleMatrix, 
        simulationParams, 
        setQca 
    });
    
    // Set up simulation when parameters change
    useSimulationSetup({
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
    });
    
    // Metrics update hook
    usePerformanceMetrics({
        isRunning,
        renderTimeRef,
        setRenderTime
    });
    
    // Incremental animation effect
    useSimulationAnimation({
        isRunning,
        currentStep,
        qca,
        simulationParams,
        setHistory,
        setCurrentStep,
        setStepTime,
        timeoutRef,
        setIsRunning
    });
    
    // Render visualization when history changes
    useVisualization({
        history,
        currentStateRef,
        spacetimeDiagramRef,
        renderTimeRef
    });
    
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