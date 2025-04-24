/**
 * UI controls for the 1D Clifford QCA simulator
 * 
 * This module provides React components for controlling the simulation
 * parameters and running the automaton.
 */
import React, { useState, useEffect } from 'react';
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
    defaultSize = 500, 
    defaultSteps = 250 
}) {
    const [latticeSize, setLatticeSize] = useState(defaultSize);
    const [timeSteps, setTimeSteps] = useState(defaultSteps);
    const [initialStateType, setInitialStateType] = useState('custom-ops');
    
    // For multiple operators
    const [operators, setOperators] = useState([
        { type: 'X', position: 250 }
    ]);
    
    const [customPauliString, setCustomPauliString] = useState('X');
    
    // Find next available position
    const findNextPosition = () => {
        if (operators.length === 0) return Math.floor(latticeSize / 2);
        
        // Sort current positions to find gaps
        const positions = operators.map(op => op.position).sort((a, b) => a - b);
        
        // If we have room after the last position
        if (positions[positions.length - 1] < latticeSize - 1) {
            return positions[positions.length - 1] + 1;
        }
        
        // Try to find a gap between positions
        for (let i = 0; i < positions.length - 1; i++) {
            if (positions[i + 1] - positions[i] > 1) {
                return positions[i] + 1;
            }
        }
        
        // If no gaps and the smallest position is > 0, use 0
        if (positions[0] > 0) return 0;
        
        // Last resort: return middle position and user will need to change it
        return Math.floor(latticeSize / 2);
    };
    
    const addOperator = () => {
        if (operators.length >= latticeSize) return; // Can't add more operators than lattice size
        
        const nextPosition = findNextPosition();
        setOperators([...operators, { type: 'X', position: nextPosition }]);
    };
    
    const removeOperator = (index) => {
        const newOperators = [...operators];
        newOperators.splice(index, 1);
        setOperators(newOperators);
    };
    
    const updateOperator = (index, field, value) => {
        const newOperators = [...operators];
        
        if (field === 'position') {
            // Validate position within lattice bounds
            const position = parseInt(value);
            if (isNaN(position) || position < 0 || position >= latticeSize) return;
            
            // Check for duplicates
            if (newOperators.some((op, i) => i !== index && op.position === position)) return;
            
            newOperators[index].position = position;
        } else if (field === 'type') {
            newOperators[index].type = value;
        }
        
        setOperators(newOperators);
    };
    
    const handleRunSimulation = () => {
        if (onRunSimulation) {
            // Convert operators to a custom Pauli string for existing simulation logic
            if (initialStateType === 'custom-ops') {
                // Create an array of I's with length latticeSize
                const stateArray = Array(parseInt(latticeSize) || 500).fill('I');
                
                // Replace I's with other operators at specified positions
                operators.forEach(op => {
                    if (op.position >= 0 && op.position < stateArray.length) {
                        stateArray[op.position] = op.type;
                    }
                });
                
                // Join into a string
                const customString = stateArray.join('');
                
                onRunSimulation({
                    latticeSize: parseInt(latticeSize) || 500,
                    timeSteps: parseInt(timeSteps) || 250,
                    initialStateType: 'custom',
                    customPauliString: customString
                });
            } else {
                onRunSimulation({
                    latticeSize: parseInt(latticeSize) || 500,
                    timeSteps: parseInt(timeSteps) || 250,
                    initialStateType,
                    customPauliString
                });
            }
        }
    };
    
    const handleResetSimulation = () => {
        if (onResetSimulation) {
            onResetSimulation();
        }
    };
    
    // Handler to safely update lattice size
    const handleLatticeSize = (value) => {
        const parsedValue = parseInt(value);
        if (!isNaN(parsedValue) && parsedValue > 0) {
            setLatticeSize(parsedValue);
            
            // Update operators if their positions are now out of bounds
            const newOperators = operators.map(op => {
                if (op.position >= parsedValue) {
                    return { ...op, position: parsedValue - 1 };
                }
                return op;
            });
            
            setOperators(newOperators);
        } else {
            setLatticeSize('');
        }
    };
    
    // Handler to safely update time steps
    const handleTimeSteps = (value) => {
        const parsedValue = parseInt(value);
        if (!isNaN(parsedValue) && parsedValue > 0) {
            setTimeSteps(parsedValue);
        } else {
            setTimeSteps('');
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
                    min="2"
                    max="1000"
                    value={latticeSize}
                    onChange={(e) => handleLatticeSize(e.target.value)}
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
                    onChange={(e) => handleTimeSteps(e.target.value)}
                />
            </div>
            
            <div className="control-group">
                <label>Initial State:</label>
                <div className="radio-group">
                    <label>
                        <input
                            type="radio"
                            name="initial-state"
                            value="custom-ops"
                            checked={initialStateType === 'custom-ops'}
                            onChange={() => setInitialStateType('custom-ops')}
                        />
                        Non-identity Operators
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
            
            {initialStateType === 'custom-ops' && (
                <div className="non-identity-operators">
                    <div className="control-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Non-identity Operators: {operators.length}</label>
                            <div>
                                <button 
                                    type="button" 
                                    onClick={addOperator}
                                    disabled={operators.length >= latticeSize}
                                    style={{ marginRight: '5px' }}
                                >
                                    +
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => operators.length > 1 && removeOperator(operators.length - 1)}
                                    disabled={operators.length <= 1}
                                >
                                    -
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="operators-list" style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                        {operators.map((op, index) => (
                            <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '5px',
                                padding: '5px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginRight: '10px' }}>Type:</label>
                                    <select 
                                        value={op.type} 
                                        onChange={(e) => updateOperator(index, 'type', e.target.value)}
                                        style={{ marginRight: '15px' }}
                                    >
                                        <option value="X">X</option>
                                        <option value="Y">Y</option>
                                        <option value="Z">Z</option>
                                    </select>
                                    
                                    <label style={{ marginRight: '10px' }}>Position:</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={latticeSize - 1}
                                        value={op.position}
                                        onChange={(e) => updateOperator(index, 'position', e.target.value)}
                                        style={{ width: '60px' }}
                                    />
                                </div>
                                
                                <button 
                                    type="button" 
                                    onClick={() => removeOperator(index)}
                                    disabled={operators.length <= 1}
                                    style={{ marginLeft: '10px' }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
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
                <button className="run-button" onClick={handleRunSimulation}>
                    Run Simulation
                </button>
                <button className="reset-button" onClick={handleResetSimulation}>
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