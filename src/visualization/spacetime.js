/**
 * Spacetime diagram visualization for 1D Clifford QCA
 * 
 * This module provides functions to render the spacetime diagram
 * showing the evolution of the automaton over time.
 */
import * as d3 from 'd3';
import { getPauliLabel, getPauliColor, SECONDARY_COLORS } from '../simulation/clifford.js';

// Keep track of the SVG element and current time step
let svgInstance = null;
let cellsGroup = null;
let currentTimeStep = 0;
let cellSize = 0;

/**
 * Reset the spacetime diagram rendering state
 * (Call this when switching simulations)
 */
export function resetSpacetimeDiagram() {
    svgInstance = null;
    cellsGroup = null;
    currentTimeStep = 0;
    cellSize = 0;
}

/**
 * Render a spacetime diagram showing the evolution of a 1D QCA
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
    if (!cellSize) {
        cellSize = cellSizeParam || Math.min(
            Math.floor(containerWidth / latticeSize),
            Math.floor(containerHeight / 20)
        );
    }
    
    // Set up SVG dimensions
    const width = latticeSize * cellSize;
    
    // Check if we need to create a new SVG (first render or container cleared)
    if (!svgInstance || container.select('svg').empty()) {
        // Reset state
        currentTimeStep = 0;
        
        // Clear container
        container.html('');
        
        // Create SVG
        svgInstance = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${containerHeight}`)
            .attr('preserveAspectRatio', 'xMidYStart meet')
            .style('background', '#fafafa');
        
        // Create grid
        const grid = svgInstance.append('g').attr('class', 'grid');
        
        // Vertical grid lines
        for (let x = 0; x <= latticeSize; x++) {
            grid.append('line')
                .attr('x1', x * cellSize)
                .attr('y1', 0)
                .attr('x2', x * cellSize)
                .attr('y2', containerHeight)
                .attr('stroke', '#eee')
                .attr('stroke-width', 0.5);
        }
        
        // Horizontal grid lines (add many for future steps)
        for (let t = 0; t <= 50; t++) {
            grid.append('line')
                .attr('x1', 0)
                .attr('y1', t * cellSize)
                .attr('x2', width)
                .attr('y2', t * cellSize)
                .attr('stroke', '#eee')
                .attr('stroke-width', 0.5);
        }
        
        // Create cells group
        cellsGroup = svgInstance.append('g').attr('class', 'cells');
        
        // Add axis labels
        const labels = svgInstance.append('g').attr('class', 'labels');
        
        // X-axis labels
        for (let x = 0; x < latticeSize; x += 5) {
            labels.append('text')
                .attr('x', x * cellSize + cellSize / 2)
                .attr('y', -5)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', '#666')
                .text(x);
        }
        
        // Y-axis labels container
        svgInstance.append('g').attr('class', 'y-labels');
    }
    
    // Only render new cells that we haven't rendered yet
    // Start from currentTimeStep to avoid redrawing cells
    for (let t = currentTimeStep; t < history.length; t++) {
        // Add current time step label if needed
        if (t % 5 === 0) {
            svgInstance.select('.y-labels').append('text')
                .attr('x', -5)
                .attr('y', t * cellSize + cellSize / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '10px')
                .style('fill', '#666')
                .text(t);
        }
        
        // Render cells for this time step
        for (let x = 0; x < latticeSize; x++) {
            const pauli = history[t][x];
            const pauliLabel = getPauliLabel(pauli);
            const color = getPauliColor(pauli);
            
            // Create cell rectangle
            cellsGroup.append('rect')
                .attr('x', x * cellSize)
                .attr('y', t * cellSize)
                .attr('width', cellSize)
                .attr('height', cellSize)
                .attr('fill', color)
                .attr('opacity', pauliLabel === 'I' ? 0.3 : 0.9)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 0.5)
                .attr('data-t', t)
                .attr('data-x', x);
            
            // No text labels for Pauli operators
        }
    }
    
    // Update current time step
    currentTimeStep = history.length;
    
    // Update viewBox to show all content
    const currentHeight = Math.max(history.length * cellSize, containerHeight);
    svgInstance.attr('viewBox', `0 0 ${width} ${currentHeight}`);
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
    
    // Create SVG element
    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', actualCellSize + 10) // Extra padding
        .attr('viewBox', `0 0 ${width} ${height + 10}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#fafafa');
    
    // Create cells group
    const cells = svg.append('g')
        .attr('class', 'cells')
        .attr('transform', 'translate(0, 5)'); // Center vertically
    
    // Draw each cell
    for (let x = 0; x < latticeSize; x++) {
        const pauli = state[x];
        const pauliLabel = getPauliLabel(pauli);
        const color = getPauliColor(pauli);
        
        // Create cell rectangle
        cells.append('rect')
            .attr('x', x * actualCellSize)
            .attr('y', 0)
            .attr('width', actualCellSize)
            .attr('height', actualCellSize)
            .attr('fill', color)
            .attr('opacity', pauliLabel === 'I' ? 0.3 : 0.9)
            .attr('stroke', '#ddd')
            .attr('stroke-width', 0.5);
        
        // No text labels for Pauli operators
        
        // Add position label for every 5th position
        if (x % 5 === 0) {
            cells.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', actualCellSize + 8) // Below the cell
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', '#666')
                .text(x);
        }
    }
} 