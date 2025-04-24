/**
 * Spacetime diagram visualization for 1D Clifford QCA
 * 
 * This module provides functions to render the spacetime diagram
 * showing the evolution of the automaton over time.
 */
import * as d3 from 'd3';
import { getPauliLabel, getPauliColor, SECONDARY_COLORS } from '../simulation/clifford.js';

// Keep track of rendering state for spacetime diagram
let canvasContext = null;
let canvasElement = null;
let currentTimeStep = 0;
let cellSize = 0;
let lastLatticeSize = 0;

/**
 * Reset the spacetime diagram rendering state
 * (Call this when switching simulations)
 */
export function resetSpacetimeDiagram() {
    canvasContext = null;
    canvasElement = null;
    currentTimeStep = 0;
    cellSize = 0;
    lastLatticeSize = 0;
}

/**
 * Render a spacetime diagram showing the evolution of a 1D QCA using Canvas for performance
 * 
 * @param {string} elementId - ID of the container element
 * @param {Array} history - Automaton state history
 * @param {number} [cellSizeParam] - Optional fixed cell size in pixels (will be auto-calculated if omitted)
 */
export function renderSpacetimeDiagram(elementId, history, cellSizeParam = null) {
    // Get the container element
    const container = d3.select(`#${elementId}`);
    
    // Skip if no history or empty container
    if (!history || history.length === 0 || container.empty()) {
        return;
    }
    
    const latticeSize = history[0].length;
    
    // Get container dimensions
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height || 400;
    
    // Calculate cell size if not provided
    if (!cellSize || lastLatticeSize !== latticeSize) {
        cellSize = cellSizeParam || Math.min(
            Math.floor(containerWidth / latticeSize),
            Math.floor(containerHeight / 20)
        );
        lastLatticeSize = latticeSize;
    }
    
    // Set up canvas dimensions
    const width = latticeSize * cellSize;
    
    // Initialize canvas if needed (first render or container cleared)
    if (!canvasElement || !canvasContext || container.select('canvas').empty()) {
        // Reset state
        currentTimeStep = 0;
        
        // Clear container
        container.html('');
        
        // Create canvas element 
        canvasElement = container.append('canvas')
            .attr('width', width)
            .attr('height', containerHeight)
            .style('width', '100%')
            .style('height', '100%')
            .style('background', '#fafafa')
            .node();
        
        canvasContext = canvasElement.getContext('2d');
        
        // Draw grid 
        canvasContext.strokeStyle = '#eee';
        canvasContext.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let x = 0; x <= latticeSize; x++) {
            canvasContext.beginPath();
            canvasContext.moveTo(x * cellSize, 0);
            canvasContext.lineTo(x * cellSize, containerHeight);
            canvasContext.stroke();
        }
        
        // Horizontal grid lines (add many for future steps)
        for (let t = 0; t <= 100; t++) {
            canvasContext.beginPath();
            canvasContext.moveTo(0, t * cellSize);
            canvasContext.lineTo(width, t * cellSize);
            canvasContext.stroke();
        }
    }
    
    // Only render new cells that we haven't rendered yet (incremental rendering)
    for (let t = currentTimeStep; t < history.length; t++) {
        // Render cells for this time step
        for (let x = 0; x < latticeSize; x++) {
            const pauli = history[t][x];
            const pauliLabel = getPauliLabel(pauli);
            const color = getPauliColor(pauli);
            
            // Draw cell rectangle
            canvasContext.fillStyle = color;
            canvasContext.globalAlpha = pauliLabel === 'I' ? 0.3 : 0.9;
            canvasContext.fillRect(
                x * cellSize, 
                t * cellSize, 
                cellSize, 
                cellSize
            );
            
            // Draw cell border
            canvasContext.strokeStyle = '#ddd';
            canvasContext.lineWidth = 0.5;
            canvasContext.globalAlpha = 1.0;
            canvasContext.strokeRect(
                x * cellSize, 
                t * cellSize, 
                cellSize, 
                cellSize
            );
        }
    }
    
    // Update current time step
    currentTimeStep = history.length;
    
    // Resize canvas height if needed
    const currentHeight = Math.max(history.length * cellSize, containerHeight);
    if (canvasElement.height < currentHeight) {
        canvasElement.height = currentHeight;
        
        // Redraw entire grid and diagram when canvas resizes
        canvasContext.clearRect(0, 0, width, currentHeight);
        
        // Redraw grid
        canvasContext.strokeStyle = '#eee';
        canvasContext.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let x = 0; x <= latticeSize; x++) {
            canvasContext.beginPath();
            canvasContext.moveTo(x * cellSize, 0);
            canvasContext.lineTo(x * cellSize, currentHeight);
            canvasContext.stroke();
        }
        
        // Horizontal grid lines
        for (let t = 0; t <= Math.ceil(currentHeight / cellSize); t++) {
            canvasContext.beginPath();
            canvasContext.moveTo(0, t * cellSize);
            canvasContext.lineTo(width, t * cellSize);
            canvasContext.stroke();
        }
        
        // Redraw all cells
        for (let t = 0; t < history.length; t++) {
            for (let x = 0; x < latticeSize; x++) {
                const pauli = history[t][x];
                const pauliLabel = getPauliLabel(pauli);
                const color = getPauliColor(pauli);
                
                // Draw cell rectangle
                canvasContext.fillStyle = color;
                canvasContext.globalAlpha = pauliLabel === 'I' ? 0.3 : 0.9;
                canvasContext.fillRect(
                    x * cellSize, 
                    t * cellSize, 
                    cellSize, 
                    cellSize
                );
                
                // Draw cell border
                canvasContext.strokeStyle = '#ddd';
                canvasContext.lineWidth = 0.5;
                canvasContext.globalAlpha = 1.0;
                canvasContext.strokeRect(
                    x * cellSize, 
                    t * cellSize, 
                    cellSize, 
                    cellSize
                );
            }
        }
    }
}

/**
 * Render the current state of the automaton as a row of colored cells
 * 
 * @param {string} elementId - ID of the container element
 * @param {Array} state - Current automaton state
 * @param {number} [cellSizeParam] - Optional fixed cell size in pixels (will be auto-calculated if omitted)
 */
export function renderCurrentState(elementId, state, cellSizeParam = null) {
    // Get the container element
    const container = d3.select(`#${elementId}`);
    
    // Clear the container
    container.html('');
    
    // Skip if no state or empty container
    if (!state || state.length === 0 || container.empty()) {
        return;
    }
    
    const latticeSize = state.length;
    
    // Get container dimensions
    const containerWidth = container.node().getBoundingClientRect().width;
    
    // Calculate cell size dynamically if not provided
    const actualCellSize = cellSizeParam || Math.min(30, Math.floor(containerWidth / latticeSize));
    
    // Set up dimensions
    const width = latticeSize * actualCellSize;
    const height = actualCellSize;
    
    // Create canvas element (more efficient than SVG for many cells)
    const canvas = container.append('canvas')
        .attr('width', width)
        .attr('height', height + 10) // Extra padding
        .style('width', '100%')
        .style('height', (height + 10) + 'px')
        .style('background', '#fafafa')
        .node();
    
    const ctx = canvas.getContext('2d');
    
    // Draw cells on canvas
    for (let x = 0; x < latticeSize; x++) {
        const pauli = state[x];
        const pauliLabel = getPauliLabel(pauli);
        const color = getPauliColor(pauli);
        
        // Draw cell rectangle 
        ctx.fillStyle = color;
        ctx.globalAlpha = pauliLabel === 'I' ? 0.3 : 0.9;
        ctx.fillRect(x * actualCellSize, 0, actualCellSize, actualCellSize);
        
        // Draw border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(x * actualCellSize, 0, actualCellSize, actualCellSize);
    }
} 