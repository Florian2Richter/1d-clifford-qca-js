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
 * @param {number} props.defaultSize - Default lattice size
 * @param {number} props.defaultSteps - Default number of time steps
 */
export function SimulationControls({ 
    onRunSimulation, 
    onResetSimulation, 
    defaultSize = 20, 
    defaultSteps = 20 
}) {
    const [latticeSize, setLatticeSize] = useState(defaultSize);
    const [timeSteps, setTimeSteps] = useState(defaultSteps);
    const [initialStateType, setInitialStateType] = useState('single-x');
    const [initialPosition, setInitialPosition] = useState(Math.floor(defaultSize / 2));
    const [customPauliString, setCustomPauliString] = useState('');
    
    const handleRunSimulation = () => {
        if (onRunSimulation) {
            onRunSimulation({
                latticeSize,
                timeSteps,
                initialStateType,
                initialPosition,
                customPauliString
            });
        }
    };
    
    const handleResetSimulation = () => {
        if (onResetSimulation) {
            onResetSimulation();
        }
    };
    
    return (
        <div className="simulation-controls">
            <h3>Simulation Parameters</h3>
            
            <div className="control-group">
                <label htmlFor="lattice-size">Lattice Size:</label>
                <input
                    id="lattice-size"
                    type="number"
                    min="5"
                    max="100"
                    value={latticeSize}
                    onChange={(e) => setLatticeSize(parseInt(e.target.value, 10))}
                />
            </div>
            
            <div className="control-group">
                <label htmlFor="time-steps">Time Steps:</label>
                <input
                    id="time-steps"
                    type="number"
                    min="1"
                    max="100"
                    value={timeSteps}
                    onChange={(e) => setTimeSteps(parseInt(e.target.value, 10))}
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
                        Single X
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="initial-state"
                            value="random"
                            checked={initialStateType === 'random'}
                            onChange={() => setInitialStateType('random')}
                        />
                        Random
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="initial-state"
                            value="custom"
                            checked={initialStateType === 'custom'}
                            onChange={() => setInitialStateType('custom')}
                        />
                        Custom Pauli String
                    </label>
                </div>
            </div>
            
            {initialStateType === 'single-x' && (
                <div className="control-group">
                    <label htmlFor="initial-position">X Position:</label>
                    <input
                        id="initial-position"
                        type="number"
                        min="0"
                        max={latticeSize - 1}
                        value={initialPosition}
                        onChange={(e) => setInitialPosition(parseInt(e.target.value, 10))}
                    />
                </div>
            )}
            
            {initialStateType === 'custom' && (
                <div className="control-group">
                    <label htmlFor="custom-pauli">Pauli String (I, X, Z, Y):</label>
                    <input
                        id="custom-pauli"
                        type="text"
                        placeholder="e.g., IXZYI..."
                        value={customPauliString}
                        onChange={(e) => setCustomPauliString(e.target.value.toUpperCase())}
                    />
                    <small>Enter a string of I, X, Z, Y with length {latticeSize}</small>
                </div>
            )}
            
            <div className="button-group">
                <button 
                    className="run-button" 
                    onClick={handleRunSimulation}
                >
                    Run Simulation
                </button>
                <button 
                    className="reset-button" 
                    onClick={handleResetSimulation}
                >
                    Reset
                </button>
            </div>
        </div>
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