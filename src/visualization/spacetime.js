import * as d3 from 'd3';
import { getPauliLabel, getPauliColor } from '../simulation/clifford.js';

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
 */
export function renderSpacetimeDiagram(elementId, history, cellSizeParam = null) {
    const container = d3.select(`#${elementId}`)
        .style('overflow-y', 'auto')       // enable vertical scrolling
        .style('position', 'relative')     // ensure proper positioning
        .style('padding-top', '0')         // remove any padding
        .style('margin-top', '0');         // remove any margin
        
    if (!history || history.length === 0 || container.empty()) return;

    const latticeSize = history[0].length;
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height || 400;

    // Determine cell size
    if (!cellSize || lastLatticeSize !== latticeSize) {
        cellSize = cellSizeParam || Math.min(
            Math.floor(containerWidth / latticeSize),
            Math.floor(containerHeight / 20)
        );
        lastLatticeSize = latticeSize;
    }
    const width = latticeSize * cellSize;
    
    // Calculate total height needed upfront to avoid resizing
    const totalRequiredHeight = Math.max(history.length * cellSize, containerHeight);

    // Initialize canvas with full required height on first render
    const isNewCanvas = !canvasElement || !canvasContext || container.select('canvas').empty();
    if (isNewCanvas) {
        currentTimeStep = 0;
        container.html('');
        
        // Create a wrapper div to ensure proper positioning
        const wrapper = container.append('div')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('width', width + 'px')
            .style('height', totalRequiredHeight + 'px');
        
        canvasElement = wrapper.append('canvas')
            .attr('width', width)
            .attr('height', totalRequiredHeight)
            .style('width', width + 'px')
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .node();

        canvasContext = canvasElement.getContext('2d');
        
        // Draw initial grid
        drawGrid(latticeSize, totalRequiredHeight, width);
        
        // Ensure the container has proper height to enable scrolling
        container.style('min-height', containerHeight + 'px');
        
        // Force scroll to top
        setTimeout(() => {
            container.node().scrollTop = 0;
        }, 0);
    } 
    // If we need to expand canvas but keep content, do it properly
    else if (canvasElement.height < totalRequiredHeight) {
        // Get the current scroll position
        const scrollPosition = container.node().scrollTop;
        
        // Create a temporary canvas to hold our current state
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = canvasElement.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy the exact pixels from the current canvas to temp
        tempCtx.drawImage(canvasElement, 0, 0);
        
        // Update wrapper size
        d3.select(canvasElement.parentNode)
            .style('height', totalRequiredHeight + 'px');
        
        // Resize our main canvas to the new height
        canvasElement.height = totalRequiredHeight;
        
        // Clear and redraw everything
        canvasContext.clearRect(0, 0, width, totalRequiredHeight);
        
        // Draw grid first (background)
        drawGrid(latticeSize, totalRequiredHeight, width);
        
        // Now draw back the original content exactly as it was
        canvasContext.drawImage(tempCanvas, 0, 0);
        
        // Restore scroll position
        container.node().scrollTop = scrollPosition;
    }

    // Draw new time steps (only the new ones)
    drawTimeSteps(history, currentTimeStep, latticeSize);
    
    // Update current time step tracker
    currentTimeStep = history.length;
    
    /**
     * Helper function to draw the grid
     */
    function drawGrid(latticeSize, height, width) {
        canvasContext.strokeStyle = '#eee';
        canvasContext.lineWidth = 0.5;
        
        // Draw vertical grid lines
        for (let x = 0; x <= latticeSize; x++) {
            canvasContext.beginPath();
            canvasContext.moveTo(x * cellSize, 0);
            canvasContext.lineTo(x * cellSize, height);
            canvasContext.stroke();
        }
        
        // Draw horizontal grid lines
        for (let t = 0; t <= Math.ceil(height / cellSize); t++) {
            canvasContext.beginPath();
            canvasContext.moveTo(0, t * cellSize);
            canvasContext.lineTo(width, t * cellSize);
            canvasContext.stroke();
        }
    }
    
    /**
     * Helper function to draw time steps
     */
    function drawTimeSteps(history, startTime, latticeSize) {
        for (let t = startTime; t < history.length; t++) {
            for (let x = 0; x < latticeSize; x++) {
                const pauli = history[t][x];
                const label = getPauliLabel(pauli);
                const color = getPauliColor(pauli);
                
                // Fill cell
                canvasContext.fillStyle = color;
                canvasContext.globalAlpha = label === 'I' ? 0.3 : 0.9;
                canvasContext.fillRect(x * cellSize, t * cellSize, cellSize, cellSize);
                
                // Draw border
                canvasContext.globalAlpha = 1;
                canvasContext.strokeStyle = '#ddd';
                canvasContext.lineWidth = 0.5;
                canvasContext.strokeRect(x * cellSize, t * cellSize, cellSize, cellSize);
            }
        }
    }
}

/**
 * Render the current state of the automaton as a row of colored cells
 */
export function renderCurrentState(el, state, sizeParam = null) {
    const container = d3.select(`#${el}`);
    container.html('');
    if (!state || !state.length) return;
    const n = state.length;
    const w = container.node().getBoundingClientRect().width;
    const s = sizeParam || Math.min(30, Math.floor(w / n));
    const width = n * s;
    const canvas = container.append('canvas')
        .attr('width', width)
        .attr('height', s + 10)
        .style('width', width + 'px')
        .node();
    const ctx = canvas.getContext('2d');
    for (let x = 0; x < n; x++) {
        const p = state[x];
        const label = getPauliLabel(p);
        const color = getPauliColor(p);
        ctx.fillStyle = color;
        ctx.globalAlpha = label === 'I' ? 0.3 : 0.9;
        ctx.fillRect(x * s, 0, s, s);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * s, 0, s, s);
    }
}
