/**
 * Spacetime diagram visualization for 1D Clifford QCA
 * 
 * This module provides functions to render the spacetime diagram
 * showing the evolution of the automaton over time.
 */
import * as d3 from 'd3';
import { getPauliLabel, getPauliColor, SECONDARY_COLORS } from '../simulation/clifford.js';

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
        .style('background', SECONDARY_COLORS.background)
        .style('border-radius', '4px')
        .style('box-shadow', 'inset 0 0 10px rgba(0, 0, 0, 0.05)');
    
    // Add a pattern for identity cells
    svg.append('defs')
        .append('pattern')
        .attr('id', 'identityPattern')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4)
        .attr('height', 4)
        .append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .attr('stroke', '#EEEEEE')
        .attr('stroke-width', 1);
    
    // Create grid background
    const grid = svg.append('g')
        .attr('class', 'grid');
    
    // Create cells for each time step and position
    const cells = svg.append('g')
        .attr('class', 'cells');
    
    // Draw grid lines (simplified, only draw if cell size is large enough)
    if (actualCellSize > 3) {
        // Draw fewer grid lines for better performance
        const tStep = Math.max(1, Math.floor(timeSteps / 50));
        const xStep = Math.max(1, Math.floor(latticeSize / 50));
        
        for (let t = 0; t <= timeSteps; t += tStep) {
            grid.append('line')
                .attr('x1', 0)
                .attr('y1', t * actualCellSize)
                .attr('x2', width)
                .attr('y2', t * actualCellSize)
                .attr('stroke', '#EEEEEE')
                .attr('stroke-width', 0.5);
        }
        
        for (let x = 0; x <= latticeSize; x += xStep) {
            grid.append('line')
                .attr('x1', x * actualCellSize)
                .attr('y1', 0)
                .attr('x2', x * actualCellSize)
                .attr('y2', height)
                .attr('stroke', '#EEEEEE')
                .attr('stroke-width', 0.5);
        }
    }
    
    // Create cells for each time step and position (simplified, without interactive features)
    for (let t = 0; t < timeSteps; t++) {
        for (let x = 0; x < latticeSize; x++) {
            const pauli = history[t][x];
            const pauliLabel = getPauliLabel(pauli);
            const color = getPauliColor(pauli);
            
            // Simple cell rectangle without hover effects or interactions
            cells.append('rect')
                .attr('x', x * actualCellSize)
                .attr('y', t * actualCellSize)
                .attr('width', actualCellSize)
                .attr('height', actualCellSize)
                .attr('fill', pauliLabel === 'I' ? 'url(#identityPattern)' : color)
                .attr('stroke', '#EEEEEE')
                .attr('stroke-width', 0.5);
            
            // Add Pauli label only for larger cells and non-identity operators
            if (pauliLabel !== 'I' && actualCellSize > 16) {
                cells.append('text')
                    .attr('x', x * actualCellSize + actualCellSize / 2)
                    .attr('y', t * actualCellSize + actualCellSize / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .style('font-size', `${Math.min(10, actualCellSize / 3)}px`)
                    .style('font-weight', '500')
                    .style('fill', pauliLabel === 'Y' ? '#333' : '#FFF')
                    .text(pauliLabel);
            }
        }
    }
    
    // Add minimal axis labels, only if cells are large enough
    if (actualCellSize > 12) {
        // Add a minimum number of axis labels for performance
        const labelInterval = Math.max(10, Math.ceil(latticeSize / 10));
        const timeInterval = Math.max(10, Math.ceil(timeSteps / 10));
        
        // X-axis labels (positions)
        const xAxis = svg.append('g').attr('class', 'x-axis');
        for (let x = 0; x < latticeSize; x += labelInterval) {
            xAxis.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', height + 12)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', SECONDARY_COLORS.text.secondary)
                .text(x);
        }
        
        // Y-axis labels (time steps)
        const yAxis = svg.append('g').attr('class', 'y-axis');
        for (let t = 0; t < timeSteps; t += timeInterval) {
            yAxis.append('text')
                .attr('x', -5)
                .attr('y', t * actualCellSize + actualCellSize / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '10px')
                .style('fill', SECONDARY_COLORS.text.secondary)
                .text(t);
        }
    }
    
    // Add simplified legend for larger cell sizes
    if (actualCellSize > 12 && width > 200) {
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 60}, 10)`);
        
        const legendItems = [
            { label: 'I', color: '#F7F7F7', pattern: true },
            { label: 'X', color: getPauliColor([1, 0]) },
            { label: 'Z', color: getPauliColor([0, 1]) },
            { label: 'Y', color: getPauliColor([1, 1]) }
        ];
        
        legendItems.forEach((item, i) => {
            const g = legend.append('g')
                .attr('transform', `translate(0, ${i * 15})`);
            
            g.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', item.pattern ? 'url(#identityPattern)' : item.color);
            
            g.append('text')
                .attr('x', 16)
                .attr('y', 9)
                .style('font-size', '9px')
                .style('fill', SECONDARY_COLORS.text.primary)
                .text(item.label);
        });
    }
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
        .attr('height', actualCellSize + 10) // Add padding
        .attr('viewBox', `0 0 ${width} ${height + 10}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', SECONDARY_COLORS.background)
        .style('border-radius', '4px');
    
    // Add a pattern for identity cells if it doesn't exist
    if (svg.select('defs').empty()) {
        svg.append('defs')
            .append('pattern')
            .attr('id', 'identityPatternCurrent')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 4)
            .attr('height', 4)
            .append('path')
            .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
            .attr('stroke', '#EEEEEE')
            .attr('stroke-width', 1);
    }
    
    // Create cells group
    const cells = svg.append('g')
        .attr('class', 'cells')
        .attr('transform', 'translate(0, 5)');
    
    // Create cells for each position - simplified, no interactivity
    for (let x = 0; x < latticeSize; x++) {
        const pauli = state[x];
        const pauliLabel = getPauliLabel(pauli);
        const color = getPauliColor(pauli);
        
        // Create simple cell rectangle
        cells.append('rect')
            .attr('x', x * actualCellSize)
            .attr('y', 0)
            .attr('width', actualCellSize)
            .attr('height', actualCellSize)
            .attr('fill', pauliLabel === 'I' ? 'url(#identityPatternCurrent)' : color)
            .attr('stroke', '#DDDDDD')
            .attr('stroke-width', 0.5);
        
        // Add Pauli label only for larger cells and non-identity operators
        if (pauliLabel !== 'I' && actualCellSize > 16) {
            cells.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', actualCellSize / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', `${Math.min(12, actualCellSize / 2.5)}px`)
                .style('font-weight', '500')
                .style('fill', pauliLabel === 'Y' ? '#333' : '#FFF')
                .text(pauliLabel);
        }
        
        // Add minimal position labels below cells, only for every 10th position
        if (x % 10 === 0 && actualCellSize > 14) {
            cells.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', actualCellSize + 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', SECONDARY_COLORS.text.secondary)
                .text(x);
        }
    }
} 