/**
 * Main application component for 1D Clifford QCA Simulator
 */
import React from 'react';
import { CliffordQCA, PRESETS, DEFAULT_RULE_MATRIX } from './simulation/automaton.js';
import { pauliStringToF2 } from './simulation/clifford.js';
import { SimulationControls } from './ui/controls.js';
import { MainLayout, Section, ThreeColumnLayout } from './ui/layout.js';
import { renderSpacetimeDiagram, renderCurrentState } from './visualization/spacetime.js';
import { MathematicalAnalysis } from './analysis/MathematicalAnalysis.js';

// Import custom hooks
import { useSimulationState } from './hooks/useSimulationState.js';
import { useQCAInitialization } from './hooks/useQCAInitialization.js';
import { useSimulationSetup } from './hooks/useSimulationSetup.js';
import { useSimulationAnimation } from './hooks/useSimulationAnimation.js';
import { useVisualization } from './hooks/useVisualization.js';

export function App() {
    const {
        qca, setQca,
        ruleMatrix, setRuleMatrix,
        history, setHistory,
        simulationParams, setSimulationParams,
        currentStep, setCurrentStep,
        isRunning, setIsRunning,
        stepTime, setStepTime,
        currentStateRef,
        spacetimeDiagramRef,
        timeoutRef,
        renderTimeRef
    } = useSimulationState();
    
    // Track whether a simulation has been started (and not yet reset)
    const [hasSimulationStarted, setHasSimulationStarted] = React.useState(false);

    // new state to drive your MathematicalAnalysis panel
    const [analysisOperators, setAnalysisOperators] = React.useState([{ type:'X', position:250 }]);
    const [analysisLatticeSize, setAnalysisLatticeSize] = React.useState(500);
    const [analysisRuleMatrix, setAnalysisRuleMatrix] = React.useState(() => 
        ruleMatrix ? ruleMatrix.map(row => [...row]) : DEFAULT_RULE_MATRIX.map(row => [...row])
    );
    
    // Track mathematical properties for Quantum Pane
    const [mathProperties, setMathProperties] = React.useState({
        invertible: false,
        symplectic: false,
        orthogonalStabilizer: false,
        logicalQubits: 0,
        codeDistance: 0
    });

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
        setIsRunning,
        timeoutRef,
        spacetimeDiagramRef,
        renderTimeRef
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
        // If we're resuming a paused simulation, just turn isRunning back on
        if (history.length > 1 && currentStep > 0 && !isRunning) {
            setIsRunning(true);
            return;
        }
        
        // If params includes a ruleMatrix, update our state
        if (params.ruleMatrix) {
            // Create a deep copy to avoid reference issues
            setRuleMatrix(params.ruleMatrix.map(row => [...row]));
            
            // Also update the analysis rule matrix to stay in sync
            setAnalysisRuleMatrix(params.ruleMatrix.map(row => [...row]));
        }
        
        // Also update analysis state when simulation runs
        if (params.operators) setAnalysisOperators(params.operators);
        if (params.latticeSize) setAnalysisLatticeSize(params.latticeSize);
        
        // Mark that a simulation has started
        setHasSimulationStarted(true);
        
        // Start the simulation
        setSimulationParams(params);
    };
    
    const handleStopSimulation = () => {
        // Stop the running animation
        setIsRunning(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        // Note: Controls remain disabled because hasSimulationStarted is still true
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
        renderTimeRef.current = 0;
        
        // Reset analysis state to match current simulation state
        setAnalysisRuleMatrix(ruleMatrix.map(row => [...row]));
        setAnalysisOperators([{ type: 'X', position: 250 }]);
        setAnalysisLatticeSize(500);
        
        // Mark that the simulation has been reset, re-enabling controls
        setHasSimulationStarted(false);
    };
    
    // Handle analysis-only updates (no simulation start)
    const handleAnalysisUpdate = ({ ruleMatrix, operators, latticeSize }) => {
        // Update analysis-specific state variables only, not the simulation state
        if (ruleMatrix) setAnalysisRuleMatrix(ruleMatrix.map(r=>[...r]));
        if (operators) setAnalysisOperators(operators);
        if (latticeSize) setAnalysisLatticeSize(latticeSize);
    };
    
    return (
        <MainLayout>
            <ThreeColumnLayout
                leftColumn={
                    <>
                        <Section title="Simulation" collapsible={true}>
                            <SimulationControls
                                onRunSimulation={handleRunSimulation}
                                onStopSimulation={handleStopSimulation}
                                onResetSimulation={handleResetSimulation}
                                onAnalysisUpdate={handleAnalysisUpdate}
                                isRunning={isRunning}
                                isDisabled={hasSimulationStarted}
                            />
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
                        <Section title="About" collapsible={true} defaultExpanded={true} style={{ height: 'auto', marginBottom: '10px' }}>
                            <div className="info-panel">
                                <h3>1D Clifford QCA Simulator</h3>
                                <p>This simulator allows you to explore one-dimensional Clifford Quantum Cellular Automata and analyze their mathematical properties.</p>
                                
                                <h4>Mathematical Analysis</h4>
                                <div className="mathematical-analysis">
                                    {analysisRuleMatrix && (
                                        <MathematicalAnalysis 
                                            ruleMatrix={analysisRuleMatrix}
                                            initialState={null}
                                            operators={analysisOperators}
                                            latticeSize={analysisLatticeSize}
                                            onPropertiesChange={setMathProperties}
                                        />
                                    )}
                                </div>
                            </div>
                        </Section>
                        
                        <Section title="Quantum Pane" collapsible={true} defaultExpanded={true} style={{ height: 'auto', marginBottom: '10px' }}>
                            <div className={`quantum-pane ${!mathProperties.invertible || !mathProperties.symplectic || !mathProperties.orthogonalStabilizer ? 'disabled-container' : ''}`}>
                                {mathProperties.invertible && mathProperties.symplectic && mathProperties.orthogonalStabilizer ? (
                                    <div className="quantum-content">
                                        <div className="quantum-info">
                                            <p><strong>N</strong> = {analysisLatticeSize} <span className="info-label">Number of Qubits in a row</span></p>
                                            <p><strong>k</strong> = {mathProperties.logicalQubits} <span className="info-label">Number of logical qubits</span></p>
                                            <p><strong>d</strong> = {mathProperties.codeDistance} <span className="info-label">Code distance</span></p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="message-box">
                                        <p>This configuration doesn't satisfy all mathematical requirements for a valid quantum circuit.</p>
                                        <p>Check the Mathematical Analysis section to see which properties need to be fixed.</p>
                                    </div>
                                )}
                            </div>
                        </Section>
                    </>
                }
            />
        </MainLayout>
    );
} 