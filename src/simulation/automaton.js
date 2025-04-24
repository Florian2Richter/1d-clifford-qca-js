/**
 * 1D Clifford Quantum Cellular Automaton implementation
 * 
 * This module provides the core logic for simulating a 1D Clifford QCA
 * with customizable rule matrices and initial states.
 */
import { PAULI, multiplyPauli } from './clifford.js';
import * as math from 'mathjs';

/**
 * Default rule matrix for the simulation (2x6 over F2)
 * Format: [A_left | A_center | A_right]
 */
export const DEFAULT_RULE_MATRIX = [
    [1, 0, 1, 1, 0, 1], // First row
    [0, 1, 0, 1, 1, 0]  // Second row
];

/**
 * Clifford Quantum Cellular Automaton with configurable update rules
 */
export class CliffordQCA {
    /**
     * Create a new Clifford QCA
     * 
     * @param {number} [size=20] - Size of the 1D lattice
     * @param {Array} [ruleMatrix=null] - Optional custom rule matrices
     */
    constructor(size = 20, ruleMatrix = null) {
        this.latticeSize = size;
        
        // Initialize state to all identity operators
        this.reset();
        
        // Default rule matrices (identity rule)
        if (ruleMatrix) {
            this.ruleMatrix = ruleMatrix;
        } else {
            // Default rule: Identity rule (center = identity, neighbors = 0)
            const leftMatrix = Array(2).fill().map(() => Array(2).fill(0));
            const centerMatrix = [[1, 0], [0, 1]]; // Identity matrix
            const rightMatrix = Array(2).fill().map(() => Array(2).fill(0));
            
            this.ruleMatrix = [leftMatrix, centerMatrix, rightMatrix];
        }
        
        // Initialize history with current state
        this.history = [this.state.slice()];
    }
    
    /**
     * Reset the QCA to all identity operators
     */
    reset() {
        this.state = Array(this.latticeSize).fill().map(() => PAULI.I.slice());
        this.history = [this.state.slice()];
    }
    
    /**
     * Set the state of the QCA
     * 
     * @param {Array} state - Array of Pauli operators
     */
    setState(state) {
        if (state.length === this.latticeSize) {
            this.state = state.map(pauli => pauli.slice());
            this.history = [this.state.slice()];
        } else {
            throw new Error(`State length (${state.length}) does not match lattice size (${this.latticeSize})`);
        }
    }
    
    /**
     * Get the current state of the QCA
     * 
     * @returns {Array} - Current state as array of Pauli operators
     */
    getState() {
        return this.state.slice();
    }
    
    /**
     * Get the history of states
     * 
     * @returns {Array} - History of states
     */
    getHistory() {
        return this.history.slice();
    }
    
    /**
     * Initialize with a single X operator at the specified position
     * 
     * @param {number} position - Position for the X operator (0-indexed)
     */
    setSingleX(position) {
        this.reset();
        if (position >= 0 && position < this.latticeSize) {
            this.state[position] = PAULI.X.slice();
            this.history = [this.state.slice()];
        }
    }
    
    /**
     * Initialize with a random state
     */
    setRandomState() {
        this.reset();
        const pauliOperators = [PAULI.I, PAULI.X, PAULI.Z, PAULI.Y];
        
        for (let i = 0; i < this.latticeSize; i++) {
            const randomIndex = Math.floor(Math.random() * 4);
            this.state[i] = pauliOperators[randomIndex].slice();
        }
        
        this.history = [this.state.slice()];
    }
    
    /**
     * Perform a single update step based on the rule matrices
     */
    step() {
        const newState = Array(this.latticeSize).fill().map(() => [0, 0]);
        
        for (let i = 0; i < this.latticeSize; i++) {
            const left = this.state[(i - 1 + this.latticeSize) % this.latticeSize];
            const center = this.state[i];
            const right = this.state[(i + 1) % this.latticeSize];
            
            // Apply left matrix to left neighbor
            const leftEffect = this.applyMatrix(this.ruleMatrix[0], left);
            
            // Apply center matrix to center cell
            const centerEffect = this.applyMatrix(this.ruleMatrix[1], center);
            
            // Apply right matrix to right neighbor
            const rightEffect = this.applyMatrix(this.ruleMatrix[2], right);
            
            // Combine effects by multiplying Pauli operators
            let result = [0, 0];
            result = multiplyPauli(result, leftEffect);
            result = multiplyPauli(result, centerEffect);
            result = multiplyPauli(result, rightEffect);
            
            newState[i] = result;
        }
        
        // Update state and add to history
        this.state = newState;
        this.history.push(this.state.slice());
        
        return this.state;
    }
    
    /**
     * Run the QCA for a specified number of time steps
     * 
     * @param {number} steps - Number of time steps to run
     */
    run(steps) {
        // Start fresh with current state
        this.history = [this.state.slice()];
        
        // Run specified number of steps
        for (let t = 0; t < steps; t++) {
            this.step();
        }
        
        return this.history;
    }
    
    /**
     * Apply a matrix to a Pauli operator
     * 
     * @param {Array} matrix - 2x2 matrix
     * @param {Array} pauli - Pauli operator as [x,z]
     * @returns {Array} - Resulting Pauli operator
     */
    applyMatrix(matrix, pauli) {
        // Extract x and z bits from the input Pauli
        const [x, z] = pauli;
        
        // Apply matrix transformation
        const newX = (matrix[0][0] * x + matrix[0][1] * z) % 2;
        const newZ = (matrix[1][0] * x + matrix[1][1] * z) % 2;
        
        return [newX, newZ];
    }
} 