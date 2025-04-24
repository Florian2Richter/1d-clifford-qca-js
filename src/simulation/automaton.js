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
 * CliffordQCA class for simulating 1D Clifford Quantum Cellular Automata
 */
export class CliffordQCA {
    /**
     * Create a new CliffordQCA instance
     * 
     * @param {number} size - Number of cells in the lattice
     * @param {Array} ruleMatrix - 2x6 rule matrix over F2
     */
    constructor(size = 20, ruleMatrix = DEFAULT_RULE_MATRIX) {
        this.size = size;
        this.ruleMatrix = ruleMatrix;
        this.state = Array(size).fill(PAULI.I); // Initialize with identity
        this.history = []; // Store the evolution history
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
        
        // Extract the A_left, A_center, and A_right matrices (each is 2x2)
        const A_left = [
            [this.ruleMatrix[0][0], this.ruleMatrix[0][1]],
            [this.ruleMatrix[1][0], this.ruleMatrix[1][1]]
        ];
        
        const A_center = [
            [this.ruleMatrix[0][2], this.ruleMatrix[0][3]],
            [this.ruleMatrix[1][2], this.ruleMatrix[1][3]]
        ];
        
        const A_right = [
            [this.ruleMatrix[0][4], this.ruleMatrix[0][5]],
            [this.ruleMatrix[1][4], this.ruleMatrix[1][5]]
        ];
        
        // Matrix-vector multiplication over F2
        // Multiply each 2x2 matrix with the corresponding Pauli operator
        const leftContribution = math.mod(math.multiply(A_left, left), 2);
        const centerContribution = math.mod(math.multiply(A_center, center), 2);
        const rightContribution = math.mod(math.multiply(A_right, right), 2);
        
        // Sum the contributions (XOR in F2)
        const result = [
            (leftContribution[0] + centerContribution[0] + rightContribution[0]) % 2,
            (leftContribution[1] + centerContribution[1] + rightContribution[1]) % 2
        ];
        
        return result;
    }

    /**
     * Evolve the automaton for one time step
     */
    step() {
        const newState = Array(this.size).fill().map((_, index) => {
            return this.applyRule(index, this.state);
        });
        
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