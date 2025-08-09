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
    const [analysisOperators, setAnalysisOperators] = React.useState([{ type:'X', position:5 }]);
    const [analysisLatticeSize, setAnalysisLatticeSize] = React.useState(10);
    const [analysisRuleMatrix, setAnalysisRuleMatrix] = React.useState(() => 
        ruleMatrix ? ruleMatrix.map(row => [...row]) : DEFAULT_RULE_MATRIX.map(row => [...row])
    );
    
    // Add explicit analysis step trigger
    const [analysisStepTrigger, setAnalysisStepTrigger] = React.useState(0);
    
    // Track mathematical properties for Quantum Pane
    const [mathProperties, setMathProperties] = React.useState({
        invertible: false,
        symplectic: false,
        orthogonalStabilizer: false,
        logicalQubits: 0,
        codeDistance: 0,
        codeDistanceTrajectory: [],
        entanglementTrajectory: []
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
        setIsRunning,
        setAnalysisStepTrigger
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
        setAnalysisOperators([{ type: 'X', position: 5 }]);
        setAnalysisLatticeSize(10);
        
        // Reset the analysis step trigger to clear simulation-step details
        setAnalysisStepTrigger(0);
        
        // Reset math properties including trajectory
        setMathProperties(prev => ({
            ...prev,
            codeDistanceTrajectory: [],
            entanglementTrajectory: []
        }));
        
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
                                            pauliArray={hasSimulationStarted && history && history.length > 0 && currentStep < history.length ? history[currentStep] : null}
                                            operators={analysisOperators}
                                            latticeSize={analysisLatticeSize}
                                            analysisStepTrigger={analysisStepTrigger}
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
                                        {mathProperties.codeDistanceTrajectory && mathProperties.codeDistanceTrajectory.length > 1 && (
                                            <div className="trajectory-chart">
                                                <h4>Code Distance Trajectory</h4>
                                                <svg width="300" height="120">
                                                    {/* Chart background grid */}
                                                    <defs>
                                                        <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
                                                            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#f1f3f4" strokeWidth="0.5"/>
                                                        </pattern>
                                                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                            <stop offset="0%" style={{stopColor: '#f8f9fa', stopOpacity: 1}} />
                                                            <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 1}} />
                                                        </linearGradient>
                                                    </defs>
                                                    <rect width="300" height="120" fill="url(#chartGradient)" />
                                                    <rect width="300" height="120" fill="url(#grid)" />
                                                    
                                                    {/* Chart content */}
                                                    {(() => {
                                                        const trajectory = mathProperties.codeDistanceTrajectory;
                                                        const maxDistance = Math.max(...trajectory.map(p => p.distance), 1);
                                                        const minDistance = Math.min(...trajectory.map(p => p.distance), 0);
                                                        const range = Math.max(maxDistance - minDistance, 1);
                                                        
                                                        const points = trajectory.map((point, index) => {
                                                            const x = 30 + (index / Math.max(trajectory.length - 1, 1)) * 240;
                                                            const y = 20 + (1 - (point.distance - minDistance) / range) * 70;
                                                            return `${x},${y}`;
                                                        }).join(' ');
                                                        
                                                        return (
                                                            <>
                                                                {/* Chart line */}
                                                                <polyline
                                                                    points={points}
                                                                    className="chart-line"
                                                                    stroke="#2563eb"
                                                                    strokeWidth="2.5"
                                                                    fill="none"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                                
                                                                {/* Data points - only show every nth point for long trajectories */}
                                                                {trajectory.map((point, index) => {
                                                                    // Show all points if trajectory is short, or every nth point if long
                                                                    const showPoint = trajectory.length <= 50 || index % Math.ceil(trajectory.length / 50) === 0 || index === trajectory.length - 1;
                                                                    if (!showPoint) return null;
                                                                    
                                                                    const x = 30 + (index / Math.max(trajectory.length - 1, 1)) * 240;
                                                                    const y = 20 + (1 - (point.distance - minDistance) / range) * 70;
                                                                    return (
                                                                        <circle
                                                                            key={index}
                                                                            cx={x}
                                                                            cy={y}
                                                                            r="3"
                                                                            className="chart-point"
                                                                            fill="#2563eb"
                                                                            stroke="#ffffff"
                                                                            strokeWidth="1.5"
                                                                        />
                                                                    );
                                                                })}
                                                                
                                                                {/* Y-axis labels */}
                                                                <text x="20" y="25" className="chart-label" fontSize="10" fill="#6b7280" textAnchor="end">{maxDistance}</text>
                                                                <text x="20" y="95" className="chart-label" fontSize="10" fill="#6b7280" textAnchor="end">{minDistance}</text>
                                                                
                                                                {/* Axis lines */}
                                                                <line x1="25" y1="20" x2="25" y2="95" stroke="#e5e7eb" strokeWidth="1"/>
                                                                <line x1="25" y1="95" x2="275" y2="95" stroke="#e5e7eb" strokeWidth="1"/>
                                                                
                                                                {/* X-axis labels */}
                                                                <text x="30" y="110" className="chart-label" fontSize="9" fill="#6b7280" textAnchor="start">0</text>
                                                                <text x="270" y="110" className="chart-label" fontSize="9" fill="#6b7280" textAnchor="end">{trajectory.length - 1}</text>
                                                                <text x="150" y="110" className="chart-title" fontSize="11" fill="#374151" textAnchor="middle">Simulation Steps</text>
                                                            </>
                                                        );
                                                    })()}
                                                </svg>
                                            </div>
                                        )}
                                        {mathProperties.entanglementTrajectory && mathProperties.entanglementTrajectory.length > 1 && (
                                            <div className="trajectory-chart">
                                                <h4>Entanglement Trajectory</h4>
                                                <svg width="300" height="120">
                                                    {/* Chart background grid */}
                                                    <defs>
                                                        <pattern id="entanglementGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                                                            <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#f1f3f4" strokeWidth="0.5"/>
                                                        </pattern>
                                                        <linearGradient id="entanglementGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                            <stop offset="0%" style={{stopColor: '#f8f9fa', stopOpacity: 1}} />
                                                            <stop offset="100%" style={{stopColor: '#ffffff', stopOpacity: 1}} />
                                                        </linearGradient>
                                                    </defs>
                                                    <rect width="300" height="120" fill="url(#entanglementGradient)" />
                                                    <rect width="300" height="120" fill="url(#entanglementGrid)" />
                                                    
                                                    {/* Chart content */}
                                                    {(() => {
                                                        const trajectory = mathProperties.entanglementTrajectory;
                                                        const maxEntanglement = Math.max(...trajectory.map(p => p.entanglement), 1);
                                                        const minEntanglement = Math.min(...trajectory.map(p => p.entanglement), 0);
                                                        const range = Math.max(maxEntanglement - minEntanglement, 1);
                                                        
                                                        const points = trajectory.map((point, index) => {
                                                            const x = 30 + (index / Math.max(trajectory.length - 1, 1)) * 240;
                                                            const y = 20 + (1 - (point.entanglement - minEntanglement) / range) * 70;
                                                            return `${x},${y}`;
                                                        }).join(' ');
                                                        
                                                        return (
                                                            <>
                                                                {/* Chart line */}
                                                                <polyline
                                                                    points={points}
                                                                    className="chart-line"
                                                                    stroke="#dc2626"
                                                                    strokeWidth="2.5"
                                                                    fill="none"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                                
                                                                {/* Data points */}
                                                                {trajectory.map((point, index) => {
                                                                    const showPoint = trajectory.length <= 50 || index % Math.ceil(trajectory.length / 50) === 0 || index === trajectory.length - 1;
                                                                    if (!showPoint) return null;
                                                                    
                                                                    const x = 30 + (index / Math.max(trajectory.length - 1, 1)) * 240;
                                                                    const y = 20 + (1 - (point.entanglement - minEntanglement) / range) * 70;
                                                                    return (
                                                                        <circle
                                                                            key={index}
                                                                            cx={x}
                                                                            cy={y}
                                                                            r="3"
                                                                            className="chart-point"
                                                                            fill="#dc2626"
                                                                            stroke="#ffffff"
                                                                            strokeWidth="1.5"
                                                                        />
                                                                    );
                                                                })}
                                                                
                                                                {/* Y-axis labels */}
                                                                <text x="20" y="25" className="chart-label" fontSize="10" fill="#6b7280" textAnchor="end">{maxEntanglement.toFixed(1)}</text>
                                                                <text x="20" y="95" className="chart-label" fontSize="10" fill="#6b7280" textAnchor="end">{minEntanglement.toFixed(1)}</text>
                                                                
                                                                {/* Axis lines */}
                                                                <line x1="25" y1="20" x2="25" y2="95" stroke="#e5e7eb" strokeWidth="1"/>
                                                                <line x1="25" y1="95" x2="275" y2="95" stroke="#e5e7eb" strokeWidth="1"/>
                                                                
                                                                {/* X-axis labels */}
                                                                <text x="30" y="110" className="chart-label" fontSize="9" fill="#6b7280" textAnchor="start">0</text>
                                                                <text x="270" y="110" className="chart-label" fontSize="9" fill="#6b7280" textAnchor="end">{trajectory.length - 1}</text>
                                                                <text x="150" y="110" className="chart-title" fontSize="11" fill="#374151" textAnchor="middle">Simulation Steps</text>
                                                            </>
                                                        );
                                                    })()}
                                                </svg>
                                            </div>
                                        )}
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