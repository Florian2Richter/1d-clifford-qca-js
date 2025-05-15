/**
 * UI controls for the 1D Clifford QCA simulator
 * 
 * This module provides React components for controlling the simulation
 * parameters and running the automaton.
 */
import React, { useState, useEffect } from 'react';
import { DEFAULT_RULE_MATRIX, PRESETS } from '../simulation/automaton.js';

/**
 * Simulation controls component
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onRunSimulation - Callback when simulation is run
 * @param {Function} props.onStopSimulation - Callback when simulation is stopped
 * @param {Function} props.onResetSimulation - Callback when simulation is reset
 * @param {boolean} props.isRunning - Indicates whether the simulation is running
 * @param {boolean} props.isDisabled - Indicates whether controls should be disabled
 * @param {number} props.defaultSize - Default lattice size
 * @param {number} props.defaultSteps - Default number of time steps
 */
export function SimulationControls({ 
    onRunSimulation, 
    onStopSimulation,
    onResetSimulation, 
    isRunning,
    isDisabled,
    defaultSize = 500, 
    defaultSteps = 250 
}) {
    const [latticeSize, setLatticeSize] = useState(defaultSize);
    const [timeSteps, setTimeSteps] = useState(defaultSteps);
    const [selectedPreset, setSelectedPreset] = useState('Fractal');
    // Track whether we just selected a new preset
    const [isNewPresetSelection, setIsNewPresetSelection] = useState(false);
    
    // Make a deep copy of the default rule matrix to ensure it's correctly initialized
    const [ruleMatrix, setRuleMatrix] = useState(
        DEFAULT_RULE_MATRIX.map(row => [...row])
    );
    
    // For multiple operators
    const [operators, setOperators] = useState([
        { type: 'X', position: 250 }
    ]);
    
    // Update operators when preset changes
    useEffect(() => {
        if (selectedPreset && PRESETS[selectedPreset]) {
            const preset = PRESETS[selectedPreset];
            
            // Update operators based on preset
            const newOperators = [...preset.initialState.operators];
            setOperators(newOperators);
            
            // Update rule matrix based on preset
            setRuleMatrix(preset.ruleMatrix.map(row => [...row]));
            
            // Mark that we've just selected a new preset (will be reset after next run)
            setIsNewPresetSelection(true);
        }
    }, [selectedPreset]);
    
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
            // Validate and process position
            let position = parseInt(value);
            if (isNaN(position)) return;
            
            // Apply modulo to ensure position is within lattice bounds
            position = ((position % latticeSize) + latticeSize) % latticeSize;
            
            // Check for duplicates
            if (newOperators.some((op, i) => i !== index && op.position === position)) return;
            
            newOperators[index].position = position;
        } else if (field === 'type') {
            newOperators[index].type = value;
        }
        
        setOperators(newOperators);
    };
    
    const handlePresetChange = (preset) => {
        setSelectedPreset(preset);
        // This will trigger the useEffect above
    };
    
    const handleRunSimulation = () => {
        if (onRunSimulation) {
            // Create an array of I's with length latticeSize
            const stateArray = Array(parseInt(latticeSize) || 500).fill('I');
            
            // Replace I's with other operators at specified positions
            operators.forEach(op => {
                if (op.position >= 0 && op.position < stateArray.length) {
                    stateArray[op.position] = op.type;
                }
            });
            
            // Join into a string
            const customString = 'OPERATORS'; // Special marker to use operators array
            
            onRunSimulation({
                latticeSize: parseInt(latticeSize) || 500,
                timeSteps: parseInt(timeSteps) || 250,
                initialStateType: 'custom',
                customPauliString: customString,
                selectedPreset: selectedPreset,
                ruleMatrix: ruleMatrix,
                operators: operators, // Pass the operators directly
                isNewPresetSelection: isNewPresetSelection // Let app know if we just changed presets
            });
            
            // Reset the new preset selection flag after running
            setIsNewPresetSelection(false);
        }
    };
    
    const handleStopSimulation = () => {
        if (onStopSimulation) {
            onStopSimulation();
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
            const oldSize = latticeSize;
            setLatticeSize(parsedValue);
            
            // Update operators positions using modulo to maintain relative positions
            const newOperators = operators.map(op => {
                // Keep the same relative position but apply modulo to ensure it's within bounds
                const newPosition = op.position % parsedValue;
                return { ...op, position: newPosition };
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
    
    const handleRuleMatrixChange = (newMatrix) => {
        setRuleMatrix(newMatrix.map(row => [...row]));
        // Do not automatically switch presets when rule matrix changes
    };
    
    // For UI, controls should be disabled if either simulation is running OR isDisabled is true
    const controlsDisabled = isRunning || isDisabled;
    
    return (
        <div className="simulation-controls">
            <div className="prominent-button-container">
                {isRunning ? (
                    <button 
                        className="prominent-stop-button" 
                        onClick={handleStopSimulation}
                    >
                        Stop Simulation
                    </button>
                ) : (
                    <button 
                        className="prominent-run-button" 
                        onClick={handleRunSimulation}
                    >
                        Run Simulation
                    </button>
                )}
                <button className="reset-button" onClick={handleResetSimulation} style={{ marginLeft: '10px' }}>
                    Reset
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div className="control-group" style={{ flex: 1 }}>
                    <label htmlFor="lattice-size">Lattice Size:</label>
                    <input
                        id="lattice-size"
                        type="number"
                        min="2"
                        max="1000"
                        value={latticeSize}
                        onChange={(e) => handleLatticeSize(e.target.value)}
                        disabled={controlsDisabled}
                    />
                </div>
                
                <div className="control-group" style={{ flex: 1 }}>
                    <label htmlFor="time-steps">Time Steps:</label>
                    <input
                        id="time-steps"
                        type="number"
                        min="1"
                        max="1000"
                        value={timeSteps}
                        onChange={(e) => handleTimeSteps(e.target.value)}
                        disabled={controlsDisabled}
                    />
                </div>
            </div>
            
            <div className="control-group">
                <div className={controlsDisabled ? 'disabled-container' : ''}>
                    <h3 style={{ textAlign: 'center', margin: '10px 0 10px' }}>Rule Matrices</h3>
                    <div style={{ marginTop: '5px' }}>
                        <RuleMatrixEditor 
                            ruleMatrix={ruleMatrix} 
                            onRuleMatrixChange={handleRuleMatrixChange}
                            disabled={controlsDisabled}
                        />
                    </div>
                </div>
            </div>
            
            <div className="control-group">
                <label htmlFor="preset-select">Examples:</label>
                <select 
                    id="preset-select"
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    style={{ width: '100%', marginBottom: '10px' }}
                    disabled={controlsDisabled}
                >
                    {Object.keys(PRESETS).map(preset => (
                        <option key={preset} value={preset}>
                            {preset}
                        </option>
                    ))}
                </select>
            </div>
            
            <h3 style={{ textAlign: 'center', margin: '20px 0 10px' }}>Initial Configuration</h3>
            
            <div className="control-group">
                <div className={controlsDisabled ? 'disabled-container' : ''}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ margin: 0 }}>Non-identity Operators: {operators.length}</label>
                        <div style={{ display: 'flex' }}>
                        <button 
                            type="button" 
                            onClick={addOperator}
                            disabled={operators.length >= latticeSize || controlsDisabled}
                                style={{ marginRight: '5px', padding: '2px 8px' }}
                        >
                            +
                        </button>
                        <button 
                            type="button" 
                            onClick={() => operators.length > 1 && removeOperator(operators.length - 1)}
                            disabled={operators.length <= 1 || controlsDisabled}
                                style={{ padding: '2px 8px' }}
                        >
                            -
                        </button>
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
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <label style={{ marginRight: '10px' }}>Type:</label>
                                    <select 
                                        value={op.type} 
                                        onChange={(e) => updateOperator(index, 'type', e.target.value)}
                                        style={{ marginRight: '15px' }}
                                        disabled={controlsDisabled}
                                    >
                                        <option value="X">X</option>
                                        <option value="Y">Y</option>
                                        <option value="Z">Z</option>
                                    </select>
                                    
                                    <label style={{ marginRight: '10px' }}>Position:</label>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={op.position}
                                        onChange={(e) => updateOperator(index, 'position', e.target.value)}
                                        style={{ 
                                            width: '50px',
                                            textAlign: 'center',
                                            padding: '4px'
                                        }}
                                        disabled={controlsDisabled}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
 * @param {boolean} props.disabled - Whether the editor is disabled
 */
export function RuleMatrixEditor({ ruleMatrix = DEFAULT_RULE_MATRIX, onRuleMatrixChange, disabled }) {
    const [matrix, setMatrix] = useState(ruleMatrix);
    
    const handleCellChange = (row, col, value) => {
        if (disabled) return;
        
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
        if (disabled) return;
        
        setMatrix(DEFAULT_RULE_MATRIX);
        
        if (onRuleMatrixChange) {
            onRuleMatrixChange(DEFAULT_RULE_MATRIX);
        }
    };
    
    return (
        <div className="rule-matrix-editor">
            <h3>Rule Matrix (2×6 over F₂)</h3>
            <div className="matrix-vertical-container">
                {/* A_left Matrix */}
                <div className="matrix-section">
                    <div className="matrix-label">A_left</div>
                    <table className="matrix-table">
                        <tbody>
                            {[0, 1].map(rowIndex => (
                                <tr key={rowIndex}>
                                    {[0, 1].map(colIndex => {
                                        const actualColIndex = colIndex;
                                        return (
                                            <td key={colIndex} className="left-matrix">
                                                <div className="number-picker">
                                                    <button 
                                                        className="number-picker-btn"
                                                        onClick={() => {
                                                            const newMatrix = [...matrix];
                                                            newMatrix[rowIndex] = [...newMatrix[rowIndex]];
                                                            newMatrix[rowIndex][actualColIndex] = (newMatrix[rowIndex][actualColIndex] === 0) ? 1 : 0;
                                                            handleCellChange(rowIndex, actualColIndex, newMatrix[rowIndex][actualColIndex]);
                                                        }}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="number-picker-value">{matrix[rowIndex][actualColIndex]}</span>
                                                    <button 
                                                        className="number-picker-btn"
                                                        onClick={() => {
                                                            const newMatrix = [...matrix];
                                                            newMatrix[rowIndex] = [...newMatrix[rowIndex]];
                                                            newMatrix[rowIndex][actualColIndex] = (newMatrix[rowIndex][actualColIndex] + 1) % 2;
                                                            handleCellChange(rowIndex, actualColIndex, newMatrix[rowIndex][actualColIndex]);
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* A_center Matrix */}
                <div className="matrix-section">
                    <div className="matrix-label">A_center</div>
                    <table className="matrix-table">
                        <tbody>
                            {[0, 1].map(rowIndex => (
                                <tr key={rowIndex}>
                                    {[0, 1].map(colIndex => {
                                        const actualColIndex = colIndex + 2;
                                        return (
                                            <td key={colIndex} className="center-matrix">
                                                <div className="number-picker">
                                                    <button 
                                                        className="number-picker-btn"
                                                        onClick={() => {
                                                            const newMatrix = [...matrix];
                                                            newMatrix[rowIndex] = [...newMatrix[rowIndex]];
                                                            newMatrix[rowIndex][actualColIndex] = (newMatrix[rowIndex][actualColIndex] === 0) ? 1 : 0;
                                                            handleCellChange(rowIndex, actualColIndex, newMatrix[rowIndex][actualColIndex]);
                                                        }}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="number-picker-value">{matrix[rowIndex][actualColIndex]}</span>
                                                    <button 
                                                        className="number-picker-btn"
                                                        onClick={() => {
                                                            const newMatrix = [...matrix];
                                                            newMatrix[rowIndex] = [...newMatrix[rowIndex]];
                                                            newMatrix[rowIndex][actualColIndex] = (newMatrix[rowIndex][actualColIndex] + 1) % 2;
                                                            handleCellChange(rowIndex, actualColIndex, newMatrix[rowIndex][actualColIndex]);
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* A_right Matrix */}
                <div className="matrix-section">
                    <div className="matrix-label">A_right</div>
                    <table className="matrix-table">
                        <tbody>
                            {[0, 1].map(rowIndex => (
                                <tr key={rowIndex}>
                                    {[0, 1].map(colIndex => {
                                        const actualColIndex = colIndex + 4;
                                        return (
                                            <td key={colIndex} className="right-matrix">
                                                <div className="number-picker">
                                                    <button 
                                                        className="number-picker-btn"
                                                        onClick={() => {
                                                            const newMatrix = [...matrix];
                                                            newMatrix[rowIndex] = [...newMatrix[rowIndex]];
                                                            newMatrix[rowIndex][actualColIndex] = (newMatrix[rowIndex][actualColIndex] === 0) ? 1 : 0;
                                                            handleCellChange(rowIndex, actualColIndex, newMatrix[rowIndex][actualColIndex]);
                                                        }}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="number-picker-value">{matrix[rowIndex][actualColIndex]}</span>
                                                    <button 
                                                        className="number-picker-btn"
                                                        onClick={() => {
                                                            const newMatrix = [...matrix];
                                                            newMatrix[rowIndex] = [...newMatrix[rowIndex]];
                                                            newMatrix[rowIndex][actualColIndex] = (newMatrix[rowIndex][actualColIndex] + 1) % 2;
                                                            handleCellChange(rowIndex, actualColIndex, newMatrix[rowIndex][actualColIndex]);
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 