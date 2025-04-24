/**
 * UI controls for the 1D Clifford QCA simulator
 * 
 * This module provides React components for controlling the simulation
 * parameters and running the automaton.
 */
import React, { useState } from 'react';
import { DEFAULT_RULE_MATRIX } from '../simulation/automaton.js';

/**
 * Simulation controls component
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onRunSimulation - Callback when simulation is run
 * @param {Function} props.onResetSimulation - Callback when simulation is reset
 * @param {Function} props.onStepSimulation - Callback for stepping simulation by one step
 * @param {Function} props.onToggleSimulation - Callback for toggling the animation
 * @param {Function} props.onSpeedChange - Callback for changing animation speed
 * @param {boolean} props.isRunning - Whether the simulation is currently running
 * @param {number} props.currentStep - Current step number in the simulation
 * @param {number} props.maxSteps - Maximum number of steps configured
 * @param {number} props.animationSpeed - Current animation speed in ms
 */
export function SimulationControls({ 
    onRunSimulation, 
    onResetSimulation, 
    onStepSimulation, 
    onToggleSimulation, 
    onSpeedChange,
    isRunning, 
    currentStep, 
    maxSteps, 
    animationSpeed 
}) {
    const [latticeSize, setLatticeSize] = useState(20);
    const [timeSteps, setTimeSteps] = useState(50);
    const [initialStateType, setInitialStateType] = useState('single-x');
    const [initialPosition, setInitialPosition] = useState(9);
    const [customPauliString, setCustomPauliString] = useState('X');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onRunSimulation({
            latticeSize: parseInt(latticeSize),
            timeSteps: parseInt(timeSteps),
            initialStateType,
            initialPosition: parseInt(initialPosition),
            customPauliString
        });
    };
    
    return (
        <form className="simulation-controls" onSubmit={handleSubmit}>
            <div className="control-group">
                <label htmlFor="lattice-size">Lattice Size:</label>
                <input
                    id="lattice-size"
                    type="number"
                    min="2"
                    max="100"
                    value={latticeSize}
                    onChange={(e) => setLatticeSize(e.target.value)}
                />
            </div>
            
            <div className="control-group">
                <label htmlFor="time-steps">Time Steps:</label>
                <input
                    id="time-steps"
                    type="number"
                    min="1"
                    max="1000"
                    value={timeSteps}
                    onChange={(e) => setTimeSteps(e.target.value)}
                />
            </div>
            
            <div className="control-group">
                <label>Initial State:</label>
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="initial-state"
                            value="single-x"
                            checked={initialStateType === 'single-x'}
                            onChange={() => setInitialStateType('single-x')}
                        />
                        Single X at position
                        <input
                            type="number"
                            min="0"
                            max={latticeSize - 1}
                            value={initialPosition}
                            onChange={(e) => setInitialPosition(e.target.value)}
                            disabled={initialStateType !== 'single-x'}
                            style={{ width: '40px', marginLeft: '5px' }}
                        />
                    </label>
                    
                    <label>
                        <input
                            type="radio"
                            name="initial-state"
                            value="random"
                            checked={initialStateType === 'random'}
                            onChange={() => setInitialStateType('random')}
                        />
                        Random state
                    </label>
                    
                    <label>
                        <input
                            type="radio"
                            name="initial-state"
                            value="custom"
                            checked={initialStateType === 'custom'}
                            onChange={() => setInitialStateType('custom')}
                        />
                        Custom
                    </label>
                </div>
            </div>
            
            {initialStateType === 'custom' && (
                <div className="control-group">
                    <label htmlFor="custom-pauli-string">Custom Pauli String:</label>
                    <input
                        id="custom-pauli-string"
                        type="text"
                        placeholder="e.g., XZYIXZ..."
                        value={customPauliString}
                        onChange={(e) => setCustomPauliString(e.target.value.toUpperCase())}
                    />
                    <small style={{ marginTop: '5px', color: '#666' }}>
                        Use I, X, Z, Y characters. Will be padded or truncated to match lattice size.
                    </small>
                </div>
            )}
            
            {/* Step counter display */}
            <div className="control-group" style={{ textAlign: 'center' }}>
                <div style={{ margin: '10px 0', fontWeight: 'bold' }}>
                    Step: {currentStep} / {maxSteps}
                </div>
                
                {/* Animation speed slider */}
                <div style={{ margin: '10px 0' }}>
                    <label htmlFor="speed-slider" style={{ display: 'block', marginBottom: '5px' }}>
                        Animation Speed:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px', fontSize: '0.9rem' }}>Slow</span>
                        <input
                            id="speed-slider"
                            type="range"
                            min="50"
                            max="1000"
                            step="50"
                            value={animationSpeed}
                            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
                            style={{ flex: 1 }}
                            disabled={isRunning}
                        />
                        <span style={{ marginLeft: '10px', fontSize: '0.9rem' }}>Fast</span>
                    </div>
                </div>
            </div>
            
            <div className="button-group">
                {/* Main action buttons */}
                <button type="submit">Initialize</button>
                <button type="button" onClick={onResetSimulation}>Reset</button>
                
                {/* Step and play/pause controls */}
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <button 
                        type="button" 
                        onClick={onStepSimulation}
                        disabled={isRunning || currentStep >= maxSteps || maxSteps === 0}
                        style={{ flex: 1, marginRight: '5px' }}
                    >
                        Step
                    </button>
                    <button 
                        type="button" 
                        onClick={onToggleSimulation}
                        disabled={currentStep >= maxSteps || maxSteps === 0}
                        style={{ flex: 1 }}
                    >
                        {isRunning ? 'Pause' : 'Play'}
                    </button>
                </div>
            </div>
        </form>
    );
}

/**
 * Rule matrix editor component
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.ruleMatrix - 2x6 rule matrix
 * @param {Function} props.onRuleMatrixChange - Callback when rule matrix changes
 */
export function RuleMatrixEditor({ ruleMatrix = DEFAULT_RULE_MATRIX, onRuleMatrixChange }) {
    const [matrix, setMatrix] = useState(ruleMatrix);
    
    const handleCellChange = (row, col, value) => {
        const newValue = parseInt(value, 10) % 2; // Ensure binary (0 or 1)
        const newMatrix = [...matrix];
        newMatrix[row] = [...newMatrix[row]];
        newMatrix[row][col] = newValue;
        
        setMatrix(newMatrix);
        
        if (onRuleMatrixChange) {
            onRuleMatrixChange(newMatrix);
        }
    };
    
    const handleReset = () => {
        setMatrix(DEFAULT_RULE_MATRIX);
        
        if (onRuleMatrixChange) {
            onRuleMatrixChange(DEFAULT_RULE_MATRIX);
        }
    };
    
    return (
        <div className="rule-matrix-editor">
            <h3>Rule Matrix (2×6 over F₂)</h3>
            <div className="matrix-container">
                <div className="matrix-labels">
                    <div className="matrix-label">A_left</div>
                    <div className="matrix-label">A_center</div>
                    <div className="matrix-label">A_right</div>
                </div>
                <table className="matrix-table">
                    <tbody>
                        {matrix.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <td 
                                        key={colIndex}
                                        className={
                                            colIndex < 2 ? 'left-matrix' : 
                                            colIndex < 4 ? 'center-matrix' : 'right-matrix'
                                        }
                                    >
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            value={cell}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button className="reset-matrix-button" onClick={handleReset}>
                Reset to Default
            </button>
        </div>
    );
} 