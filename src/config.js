/**
 * Global configuration for the 1D Clifford QCA Simulator
 */

// Default simulation parameters
export const DEFAULT_CONFIG = {
    // Lattice size (number of cells)
    latticeSize: 20,
    
    // Number of time steps to simulate
    timeSteps: 20,
    
    // Cell size in pixels for visualization
    cellSize: 20,
    
    // Initial state type: 'single-x', 'random', or 'custom'
    initialStateType: 'single-x',
    
    // Position for single X in initial state
    initialPosition: 10,
    
    // Colors for Pauli operators
    colors: {
        I: '#FFFFFF', // White
        X: '#FF6B6B', // Red
        Z: '#4ECDC4', // Teal
        Y: '#FFD166'  // Yellow
    }
}; 