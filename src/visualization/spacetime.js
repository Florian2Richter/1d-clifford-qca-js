/**
 * Spacetime diagram visualization for 1D Clifford QCA
 * 
 * This module provides functions to render the spacetime diagram
 * showing the evolution of the automaton over time.
 */
import * as d3 from 'd3';
import { getPauliLabel, getPauliColor } from '../simulation/clifford.js';

/**
 * Render a spacetime diagram showing the evolution of a 1D QCA
 * 
 * @param {string} elementId - ID of the container element
 * @param {Array} history - Automaton state history
 * @param {number} [cellSize] - Optional fixed cell size in pixels (will be auto-calculated if omitted)
 */
export function renderSpacetimeDiagram(elementId, history, cellSize = null) {
    const container = d3.select(`#${elementId}`);
    
    // Clear previous content
    container.html('');
    
    // Skip if no history or empty container
    if (!history || history.length === 0 || container.empty()) {
        return;
    }
    
    const timeSteps = history.length;
    const latticeSize = history[0].length;
    
    // Get container dimensions
    const containerWidth = container.node().getBoundingClientRect().width;
    // Get actual container height from the element
    const containerElement = document.getElementById(elementId);
    const containerHeight = containerElement.clientHeight || 
                           Math.min(window.innerHeight * 0.7, containerWidth * 0.9);
    
    // Calculate cell size dynamically if not provided
    const dynamicCellSize = cellSize || Math.floor(containerWidth / latticeSize);
    
    // Calculate appropriate cell size to fit the container
    const actualCellSize = Math.min(
        dynamicCellSize,
        Math.floor(containerHeight / timeSteps)
    );
    
    // Set up the SVG dimensions
    const width = latticeSize * actualCellSize;
    const height = timeSteps * actualCellSize;
    
    // Create SVG element with responsive attributes
    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#f9f9f9')
        .style('border', '1px solid #ccc');
    
    // Create cells for each time step and position
    for (let t = 0; t < timeSteps; t++) {
        for (let x = 0; x < latticeSize; x++) {
            const pauli = history[t][x];
            const pauliLabel = getPauliLabel(pauli);
            const color = getPauliColor(pauli);
            
            // Only draw non-identity cells
            if (pauliLabel !== 'I') {
                svg.append('rect')
                    .attr('x', x * actualCellSize)
                    .attr('y', t * actualCellSize)
                    .attr('width', actualCellSize)
                    .attr('height', actualCellSize)
                    .attr('fill', color)
                    .attr('stroke', '#555')
                    .attr('stroke-width', 0.5)
                    .append('title')
                    .text(`Position: ${x}, Time: ${t}, State: ${pauliLabel}`);
            }
            
            // Add grid lines (only if cells are big enough)
            if (actualCellSize > 3) {
                svg.append('rect')
                    .attr('x', x * actualCellSize)
                    .attr('y', t * actualCellSize)
                    .attr('width', actualCellSize)
                    .attr('height', actualCellSize)
                    .attr('fill', 'none')
                    .attr('stroke', '#ddd')
                    .attr('stroke-width', 0.5);
            }
        }
    }
    
    // Add x-axis labels (only if enough space, and every N positions)
    const labelInterval = Math.max(5, Math.ceil(latticeSize / 20));
    if (actualCellSize > 10) {
        for (let x = 0; x < latticeSize; x += labelInterval) {
            svg.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', height + 15)
                .attr('text-anchor', 'middle')
                .style('font-size', `${Math.min(10, actualCellSize / 2)}px`)
                .text(x);
        }
    }
    
    // Add time axis labels (only if enough space, and every N time steps)
    const timeInterval = Math.max(5, Math.ceil(timeSteps / 20));
    if (actualCellSize > 10) {
        for (let t = 0; t < timeSteps; t += timeInterval) {
            svg.append('text')
                .attr('x', -5)
                .attr('y', t * actualCellSize + actualCellSize / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .style('font-size', `${Math.min(10, actualCellSize / 2)}px`)
                .text(t);
        }
    }
    
    // Add resize event listener to redraw when window is resized
    const resizeHandler = () => {
        renderSpacetimeDiagram(elementId, history);
    };
    
    // Remove previous resize listener if exists
    window.removeEventListener('resize', resizeHandler);
    
    // Add resize listener with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeHandler, 250);
    });
}

/**
 * Render the current state of the automaton as a row of colored cells
 * 
 * @param {string} elementId - ID of the container element
 * @param {Array} state - Current automaton state
 * @param {number} [cellSize] - Optional fixed cell size in pixels (will be auto-calculated if omitted)
 */
export function renderCurrentState(elementId, state, cellSize = null) {
    const container = d3.select(`#${elementId}`);
    
    // Clear previous content
    container.html('');
    
    // Skip if no state or empty container
    if (!state || state.length === 0 || container.empty()) {
        return;
    }
    
    const latticeSize = state.length;
    
    // Get container width
    const containerWidth = container.node().getBoundingClientRect().width;
    
    // Calculate cell size dynamically if not provided
    const actualCellSize = cellSize || Math.min(30, Math.floor(containerWidth / latticeSize));
    
    // Set up the SVG dimensions
    const width = latticeSize * actualCellSize;
    const height = actualCellSize;
    
    // Create SVG element with responsive attributes
    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', actualCellSize)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#f9f9f9')
        .style('border', '1px solid #ccc');
    
    // Create cells for each position
    for (let x = 0; x < latticeSize; x++) {
        const pauli = state[x];
        const pauliLabel = getPauliLabel(pauli);
        const color = getPauliColor(pauli);
        
        // Create cell rectangle
        svg.append('rect')
            .attr('x', x * actualCellSize)
            .attr('y', 0)
            .attr('width', actualCellSize)
            .attr('height', actualCellSize)
            .attr('fill', color)
            .attr('stroke', '#555')
            .attr('stroke-width', 1);
        
        // Add Pauli label if not identity and if cell is big enough
        if (pauliLabel !== 'I' && actualCellSize > 12) {
            svg.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', actualCellSize / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', `${Math.min(14, actualCellSize / 2)}px`)
                .style('font-weight', 'bold')
                .text(pauliLabel);
        }
    }
    
    // Add resize event listener to redraw when window is resized
    const resizeHandler = () => {
        renderCurrentState(elementId, state);
    };
    
    // Remove previous resize listener if exists
    window.removeEventListener('resize', resizeHandler);
    
    // Add resize listener with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeHandler, 250);
    });
} 