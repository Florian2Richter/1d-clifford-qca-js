/**
 * 1D Clifford Quantum Cellular Automaton implementation
 * 
 * This module provides the core logic for simulating a 1D Clifford QCA
 * with customizable rule matrices and initial states.
 */
import { PAULI, multiplyPauli } from './clifford.js';
import { mat2, vec2 } from 'gl-matrix';

/**
 * Preset configurations for the simulation
 */
export const PRESETS = {
    "Periodic": {
        description: "Custom configuration (current settings)",
        ruleMatrix: [
            [0, 0, 1, 1, 0, 0], // A_left=[0,0], A_center=[1,1], A_right=[0,0]
            [0, 0, 1, 0, 0, 0]  // A_left=[0,0], A_center=[1,0], A_right=[0,0]
        ],
        initialState: {
            operators: [
                { type: 'X', position: 250 }
            ]
        }
    },
    "Glider": {
        description: "A 'glider' pattern that propagates through the lattice",
        ruleMatrix: [
            [0, 0, 0, 1, 0, 0], // [Left 0,0,0,1 | Center 0,1,1,0 | Right 0,0,0,1]
            [0, 1, 1, 0, 0, 1]
        ],
        initialState: {
            operators: [
                { type: 'X', position: 250 },
                { type: 'Z', position: 251 }
            ]
        }
    },
    "Fractal": {
        description: "A pattern that creates self-similar fractal structures",
        ruleMatrix: [
            [1, 0, 1, 1, 1, 0], // [Left 1,0,0,0 | Center 1,1,1,0 | Right 1,0,0,0]
            [0, 0, 1, 0, 0, 0]
        ],
        initialState: {
            operators: [
                { type: 'X', position: 250 }
            ]
        }
    }
};

/**
 * Default rule matrix for the simulation (2x6 over F2)
 * Format: [A_left | A_center | A_right]
 */
export const DEFAULT_RULE_MATRIX = PRESETS.Periodic.ruleMatrix;

/**
 * CliffordQCA class for simulating 1D Clifford Quantum Cellular Automata
 */
export class CliffordQCA {
    /**
     * Create a new CliffordQCA instance
     * 
     * @param {number} size - Number of cells in the lattice
     * @param {Array} ruleMatrix - 2x6 rule matrix over F2
     */
    constructor(size = 500, ruleMatrix = DEFAULT_RULE_MATRIX) {
        this.size = size;
        this.ruleMatrix = ruleMatrix;
        this.state = Array(size).fill(PAULI.I); // Initialize with identity
        this.history = []; // Store the evolution history
        
        // Create optimized matrices for the rule
        this.setupOptimizedMatrices();
        
        // Pre-allocate memory for computation
        this.leftVec = vec2.create();
        this.centerVec = vec2.create();
        this.rightVec = vec2.create();
        this.resultVec = vec2.create();
        this.tmpVec = vec2.create();
    }
    
    /**
     * Setup optimized matrices using gl-matrix
     */
    setupOptimizedMatrices() {
        // Extract the A_left, A_center, and A_right matrices (each is 2x2)
        this.A_left = mat2.fromValues(
            this.ruleMatrix[0][0], this.ruleMatrix[1][0],
            this.ruleMatrix[0][1], this.ruleMatrix[1][1]
        );
        
        this.A_center = mat2.fromValues(
            this.ruleMatrix[0][2], this.ruleMatrix[1][2],
            this.ruleMatrix[0][3], this.ruleMatrix[1][3]
        );
        
        this.A_right = mat2.fromValues(
            this.ruleMatrix[0][4], this.ruleMatrix[1][4],
            this.ruleMatrix[0][5], this.ruleMatrix[1][5]
        );
        
        // Pre-compute all possible transformation results for each operator
        // This is a significant optimization since there are only 4 possible inputs
        // for each of the 3 matrices (I, X, Z, Y)
        this.transformCache = new Map();
        
        const pauliValues = [PAULI.I, PAULI.X, PAULI.Z, PAULI.Y];
        
        for (const p of pauliValues) {
            // Compute and cache A_left * p
            const leftKey = `left_${p[0]}_${p[1]}`;
            this.transformCache.set(leftKey, this.transformSinglePauli(this.A_left, p));
            
            // Compute and cache A_center * p
            const centerKey = `center_${p[0]}_${p[1]}`;
            this.transformCache.set(centerKey, this.transformSinglePauli(this.A_center, p));
            
            // Compute and cache A_right * p
            const rightKey = `right_${p[0]}_${p[1]}`;
            this.transformCache.set(rightKey, this.transformSinglePauli(this.A_right, p));
        }
    }
    
    /**
     * Helper function to transform a single Pauli operator using a matrix
     * 
     * @param {mat2} matrix - 2x2 matrix
     * @param {Array} pauli - Pauli operator as [x,z]
     * @returns {Array} - Transformed Pauli operator
     */
    transformSinglePauli(matrix, pauli) {
        const v = vec2.fromValues(pauli[0], pauli[1]);
        const result = vec2.create();
        
        vec2.transformMat2(result, v, matrix);
        
        // Apply modulo 2 to result
        return [result[0] % 2, result[1] % 2];
    }

    /**
     * Set the rule matrix for the automaton
     * 
     * @param {Array} matrix - 2x6 matrix over F2
     */
    setRuleMatrix(matrix) {
        // Validate matrix dimensions
        if (matrix.length !== 2 || matrix[0].length !== 6 || matrix[1].length !== 6) {
            throw new Error("Rule matrix must be 2x6");
        }
        this.ruleMatrix = matrix;
        
        // Update optimized matrices
        this.setupOptimizedMatrices();
    }
    
    /**
     * Set a preset configuration (rule matrix and initial state)
     * 
     * @param {string} presetName - Name of the preset configuration
     * @param {number} latticeSize - Size of the lattice (for initial state scaling)
     */
    setPreset(presetName, latticeSize = this.size) {
        if (!PRESETS[presetName]) {
            throw new Error(`Preset '${presetName}' not found`);
        }
        
        // Set the rule matrix
        this.setRuleMatrix(PRESETS[presetName].ruleMatrix);
        
        // Create the initial state based on the preset configuration
        const preset = PRESETS[presetName];
        const centerOffset = Math.floor(latticeSize / 2) - 250; // Center the pattern regardless of lattice size
        
        // Initialize with identity operators
        const newState = Array(latticeSize).fill().map(() => [...PAULI.I]);
        
        // Place the operators according to the preset
        preset.initialState.operators.forEach(op => {
            // Adjust position to center the pattern in the current lattice
            const adjustedPosition = op.position + centerOffset;
            
            // Ensure position is within bounds with wraparound
            const position = (adjustedPosition + latticeSize) % latticeSize;
            
            // Set the operator
            if (op.type === 'X') {
                newState[position] = [...PAULI.X];
            } else if (op.type === 'Y') {
                newState[position] = [...PAULI.Y];
            } else if (op.type === 'Z') {
                newState[position] = [...PAULI.Z];
            }
        });
        
        // Set the state
        this.setState(newState);
    }

    /**
     * Set the initial state of the automaton
     * 
     * @param {Array} state - Array of Pauli operators in F2 representation
     */
    setState(state) {
        if (state.length !== this.size) {
            throw new Error(`State must have ${this.size} elements`);
        }
        this.state = state.map(pauli => [...pauli]); // Deep copy the state
        this.history = [this.state.map(pauli => [...pauli])]; // Reset history with new initial state
    }

    /**
     * Set a single X at the specified position, identity elsewhere
     * 
     * @param {number} position - Position to place the X operator
     */
    setSingleX(position) {
        if (position < 0 || position >= this.size) {
            throw new Error(`Position must be between 0 and ${this.size - 1}`);
        }
        
        const newState = Array(this.size).fill().map(() => [...PAULI.I]);
        newState[position] = [...PAULI.X];
        this.setState(newState);
    }
    
    /**
     * Set multiple operators at specific positions
     * 
     * @param {Array} operators - Array of {type, position} objects
     */
    setMultipleOperators(operators) {
        const newState = Array(this.size).fill().map(() => [...PAULI.I]);
        
        operators.forEach(op => {
            if (op.position >= 0 && op.position < this.size) {
                if (op.type === 'X') {
                    newState[op.position] = [...PAULI.X];
                } else if (op.type === 'Y') {
                    newState[op.position] = [...PAULI.Y];
                } else if (op.type === 'Z') {
                    newState[op.position] = [...PAULI.Z];
                }
            }
        });
        
        this.setState(newState);
    }
    
    /**
     * Set a random initial state
     */
    setRandomState() {
        const pauliValues = [PAULI.I, PAULI.X, PAULI.Z, PAULI.Y];
        const newState = Array(this.size).fill().map(() => {
            return [...pauliValues[Math.floor(Math.random() * 4)]];
        });
        this.setState(newState);
    }

    /**
     * Apply the rule to calculate the next state for a cell
     * Uses pre-computed transformation cache for speed
     * 
     * @param {number} index - Cell index to update
     * @param {Array} currentState - Current state of the automaton
     * @returns {Array} - New Pauli operator for the cell
     */
    applyRule(index, currentState) {
        // Get left, center, and right cells (with periodic boundary conditions)
        const left = currentState[(index - 1 + this.size) % this.size];
        const center = currentState[index];
        const right = currentState[(index + 1) % this.size];
        
        // Use cached transformations for faster computation
        const leftKey = `left_${left[0]}_${left[1]}`;
        const centerKey = `center_${center[0]}_${center[1]}`;
        const rightKey = `right_${right[0]}_${right[1]}`;
        
        const leftContrib = this.transformCache.get(leftKey);
        const centerContrib = this.transformCache.get(centerKey);
        const rightContrib = this.transformCache.get(rightKey);
        
        // Sum the contributions (XOR in F2)
        return [
            (leftContrib[0] + centerContrib[0] + rightContrib[0]) % 2,
            (leftContrib[1] + centerContrib[1] + rightContrib[1]) % 2
        ];
    }

    /**
     * Evolve the automaton for one time step
     * Optimized implementation using typed arrays
     */
    step() {
        // Create a buffer for the new state
        const newState = Array(this.size);
        
        // Use preallocated typed arrays for better performance
        for (let i = 0; i < this.size; i++) {
            newState[i] = this.applyRule(i, this.state);
        }
        
        this.state = newState;
        this.history.push(newState.map(pauli => [...pauli])); // Deep copy to history
        
        return [...this.state]; // Return a copy of the new state
    }

    /**
     * Run the automaton for multiple time steps
     * 
     * @param {number} steps - Number of time steps to evolve
     */
    run(steps) {
        for (let i = 0; i < steps; i++) {
            this.step();
        }
        return this.history;
    }

    /**
     * Get the current state of the automaton
     * 
     * @returns {Array} - Current state
     */
    getState() {
        return this.state.map(pauli => [...pauli]);
    }

    /**
     * Get the evolution history of the automaton
     * 
     * @returns {Array} - History of states
     */
    getHistory() {
        return this.history.map(state => state.map(pauli => [...pauli]));
    }

    /**
     * Reset the automaton to all identity operators
     */
    reset() {
        this.state = Array(this.size).fill().map(() => [...PAULI.I]);
        this.history = [this.state.map(pauli => [...pauli])];
    }
} 