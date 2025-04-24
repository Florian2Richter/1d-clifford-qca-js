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
    
    // Create tooltip element
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('pointer-events', 'none');
    
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
    
    // Draw grid lines
    if (actualCellSize > 3) {
        for (let t = 0; t <= timeSteps; t++) {
            grid.append('line')
                .attr('x1', 0)
                .attr('y1', t * actualCellSize)
                .attr('x2', width)
                .attr('y2', t * actualCellSize)
                .attr('stroke', '#EEEEEE')
                .attr('stroke-width', 0.5);
        }
        
        for (let x = 0; x <= latticeSize; x++) {
            grid.append('line')
                .attr('x1', x * actualCellSize)
                .attr('y1', 0)
                .attr('x2', x * actualCellSize)
                .attr('y2', height)
                .attr('stroke', '#EEEEEE')
                .attr('stroke-width', 0.5);
        }
    }
    
    // Create cells for each time step and position
    for (let t = 0; t < timeSteps; t++) {
        for (let x = 0; x < latticeSize; x++) {
            const pauli = history[t][x];
            const pauliLabel = getPauliLabel(pauli);
            const color = getPauliColor(pauli);
            
            // Cell rectangle
            const cell = cells.append('rect')
                .attr('x', x * actualCellSize)
                .attr('y', t * actualCellSize)
                .attr('width', actualCellSize)
                .attr('height', actualCellSize)
                .attr('fill', pauliLabel === 'I' ? 'url(#identityPattern)' : color)
                .attr('stroke', '#EEEEEE')
                .attr('stroke-width', 0.5)
                .attr('rx', pauliLabel !== 'I' ? 2 : 0)
                .attr('opacity', pauliLabel === 'I' ? 0.6 : 0.9)
                .style('cursor', 'pointer')
                .style('transition', 'opacity 0.2s, transform 0.2s');
            
            // Add hover effects
            cell.on('mouseover', function(event) {
                d3.select(this)
                    .attr('opacity', 1)
                    .attr('stroke', SECONDARY_COLORS.highlight)
                    .attr('stroke-width', 1.5);
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                
                tooltip.html(`
                    <div style="font-weight: bold; margin-bottom: 5px;">
                        Position: ${x}, Time: ${t}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="
                            width: 12px; 
                            height: 12px; 
                            background-color: ${color}; 
                            margin-right: 5px;
                            border-radius: 2px;
                        "></div>
                        <span>State: ${pauliLabel}</span>
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('opacity', pauliLabel === 'I' ? 0.6 : 0.9)
                    .attr('stroke', '#EEEEEE')
                    .attr('stroke-width', 0.5);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
            
            // Add Pauli label if cell is big enough
            if (pauliLabel !== 'I' && actualCellSize > 14) {
                cells.append('text')
                    .attr('x', x * actualCellSize + actualCellSize / 2)
                    .attr('y', t * actualCellSize + actualCellSize / 2)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .style('font-size', `${Math.min(12, actualCellSize / 2.5)}px`)
                    .style('font-weight', '500')
                    .style('user-select', 'none')
                    .style('pointer-events', 'none')
                    .style('fill', pauliLabel === 'Y' ? '#333' : '#FFF')
                    .text(pauliLabel);
            }
        }
    }
    
    // Add x-axis labels (only if enough space, and every N positions)
    const labelInterval = Math.max(5, Math.ceil(latticeSize / 20));
    if (actualCellSize > 10) {
        const xAxis = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height + 5})`);
        
        for (let x = 0; x < latticeSize; x += labelInterval) {
            xAxis.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', 10)
                .attr('text-anchor', 'middle')
                .style('font-size', `${Math.min(10, actualCellSize / 2)}px`)
                .style('fill', SECONDARY_COLORS.text.secondary)
                .text(x);
        }
        
        // Add x-axis title
        xAxis.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', '500')
            .style('fill', SECONDARY_COLORS.text.secondary)
            .text('Position');
    }
    
    // Add time axis labels (only if enough space, and every N time steps)
    const timeInterval = Math.max(5, Math.ceil(timeSteps / 20));
    if (actualCellSize > 10) {
        const yAxis = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(-5, 0)');
        
        for (let t = 0; t < timeSteps; t += timeInterval) {
            yAxis.append('text')
                .attr('x', -5)
                .attr('y', t * actualCellSize + actualCellSize / 2)
                .attr('text-anchor', 'end')
                .attr('dominant-baseline', 'middle')
                .style('font-size', `${Math.min(10, actualCellSize / 2)}px`)
                .style('fill', SECONDARY_COLORS.text.secondary)
                .text(t);
        }
        
        // Add y-axis title
        yAxis.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -25)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', '500')
            .style('fill', SECONDARY_COLORS.text.secondary)
            .text('Time');
    }
    
    // Add legend
    if (actualCellSize > 8) {
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 80}, 10)`);
        
        const legendItems = [
            { label: 'I', color: '#F7F7F7', pattern: true },
            { label: 'X', color: getPauliColor([1, 0]) },
            { label: 'Z', color: getPauliColor([0, 1]) },
            { label: 'Y', color: getPauliColor([1, 1]) }
        ];
        
        legendItems.forEach((item, i) => {
            const g = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);
            
            g.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('rx', 2)
                .attr('fill', item.pattern ? 'url(#identityPattern)' : item.color)
                .attr('stroke', '#EEEEEE');
            
            g.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '11px')
                .style('fill', SECONDARY_COLORS.text.primary)
                .text(item.label);
        });
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
    const actualCellSize = cellSize || Math.min(36, Math.floor(containerWidth / latticeSize));
    
    // Set up the SVG dimensions
    const width = latticeSize * actualCellSize;
    const height = actualCellSize;
    
    // Create tooltip element if it doesn't exist
    let tooltip = d3.select('body').select('.tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none');
    }
    
    // Create SVG element with responsive attributes
    const svg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', actualCellSize + 10) // Add padding
        .attr('viewBox', `0 0 ${width} ${height + 10}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', SECONDARY_COLORS.background)
        .style('border-radius', '4px')
        .style('box-shadow', 'inset 0 0 10px rgba(0, 0, 0, 0.05)');
    
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
        .attr('transform', 'translate(0, 5)'); // Center vertically
    
    // Create cells for each position
    for (let x = 0; x < latticeSize; x++) {
        const pauli = state[x];
        const pauliLabel = getPauliLabel(pauli);
        const color = getPauliColor(pauli);
        
        // Create cell rectangle
        const cell = cells.append('rect')
            .attr('x', x * actualCellSize)
            .attr('y', 0)
            .attr('width', actualCellSize)
            .attr('height', actualCellSize)
            .attr('fill', pauliLabel === 'I' ? 'url(#identityPatternCurrent)' : color)
            .attr('stroke', '#DDDDDD')
            .attr('stroke-width', 1)
            .attr('rx', 4) // Rounded corners
            .attr('opacity', pauliLabel === 'I' ? 0.6 : 0.9)
            .style('cursor', 'pointer')
            .style('transition', 'opacity 0.2s, transform 0.2s');
        
        // Add hover effects
        cell.on('mouseover', function(event) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', SECONDARY_COLORS.highlight)
                .attr('stroke-width', 2);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 5px;">
                    Position: ${x}
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="
                        width: 12px; 
                        height: 12px; 
                        background-color: ${color}; 
                        margin-right: 5px;
                        border-radius: 2px;
                    "></div>
                    <span>State: ${pauliLabel}</span>
                </div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', pauliLabel === 'I' ? 0.6 : 0.9)
                .attr('stroke', '#DDDDDD')
                .attr('stroke-width', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
        
        // Add Pauli label if not identity and if cell is big enough
        if (pauliLabel !== 'I' && actualCellSize > 14) {
            cells.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', actualCellSize / 2)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', `${Math.min(14, actualCellSize / 2)}px`)
                .style('font-weight', 'bold')
                .style('user-select', 'none')
                .style('pointer-events', 'none')
                .style('fill', pauliLabel === 'Y' ? '#333' : '#FFF')
                .text(pauliLabel);
        }
        
        // Add position labels below cells
        if (x % 5 === 0 && actualCellSize > 12) {
            cells.append('text')
                .attr('x', x * actualCellSize + actualCellSize / 2)
                .attr('y', actualCellSize + 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', SECONDARY_COLORS.text.secondary)
                .text(x);
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