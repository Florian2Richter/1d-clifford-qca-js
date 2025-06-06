import * as d3 from 'd3';
import { getPauliLabel, getPauliColor } from '../simulation/clifford.js';

// Global state for canvas rendering
let canvasContext = null;
let canvasElement = null;
let currentTimeStep = 0;
let cellSize = 0;
let lastLatticeSize = 0;

function calculateCellSize(containerWidth, containerHeight, latticeSize, minSize = 1) {
  const maxCellSize = Math.floor(containerWidth / latticeSize);
  return Math.max(maxCellSize, minSize);
}

/**
 * Render a spacetime diagram showing the evolution of a 1D QCA
 * using Canvas for performance
 */
export function renderSpacetimeDiagram(elementId, history, cellSizeParam = null) {
  const container = d3.select(`#${elementId}`)
    .style('overflow-y', 'auto')
    .style('position',   'relative')
    .style('padding-top','0')
    .style('margin-top', '0');

  if (!history || history.length === 0 || container.empty()) return;

  const latticeSize     = history[0].length;
  const containerWidth  = container.node().getBoundingClientRect().width;
  const containerHeight = container.node().getBoundingClientRect().height || 400;

  // Determine cell size - ensure minimum size of 1px for large lattices
  if (!cellSize || lastLatticeSize !== latticeSize) {
    cellSize = cellSizeParam || calculateCellSize(containerWidth, containerHeight, latticeSize);
    lastLatticeSize = latticeSize;
  }
  const width = latticeSize * cellSize;
  const totalRequiredHeight = Math.max(history.length * cellSize, containerHeight);

  // Calculate the horizontal offset to center the visualization
  const startX = Math.floor((containerWidth - width) / 2);

  // First‐time initialization
  const isNewCanvas = !canvasElement || !canvasContext || container.select('canvas').empty();
  if (isNewCanvas) {
    currentTimeStep = 0;
    container.html('');

    // Limit canvas dimensions for very large states to prevent browser limitations
    // Most browsers have a max canvas size limit (~32k pixels)
    const safeWidth = Math.min(containerWidth, 32000);
    
    const wrapper = container.append('div')
      .style('position', 'absolute')
      .style('top',      '0')
      .style('left',     '0')
      .style('width',    `${safeWidth}px`)
      .style('height',   `${totalRequiredHeight}px`);

    canvasElement = wrapper.append('canvas')
      .attr('width',  safeWidth)
      .attr('height', totalRequiredHeight)
      .style('width',  `${safeWidth}px`)
      .style('position','absolute')
      .style('top',     '0')
      .style('left',    '0')
      .node();

    canvasContext = canvasElement.getContext('2d');
    drawGrid(latticeSize, totalRequiredHeight, safeWidth, startX);
    container.style('min-height', `${containerHeight}px`);
    setTimeout(() => { container.node().scrollTop = 0; }, 0);
  }
  // If we need to grow the canvas height
  else if (canvasElement.height < totalRequiredHeight) {
    const scrollPosition = container.node().scrollTop;
    const tempCanvas     = document.createElement('canvas');
    tempCanvas.width     = canvasElement.width;
    tempCanvas.height    = canvasElement.height;
    const tempCtx        = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvasElement, 0, 0);

    d3.select(canvasElement.parentNode)
      .style('height', `${totalRequiredHeight}px`);

    canvasElement.height = totalRequiredHeight;
    canvasContext.clearRect(0, 0, canvasElement.width, totalRequiredHeight);
    drawGrid(latticeSize, totalRequiredHeight, canvasElement.width, startX);
    canvasContext.drawImage(tempCanvas, 0, 0);
    container.node().scrollTop = scrollPosition;
  }

  drawTimeSteps(history, currentTimeStep, latticeSize, startX);
  currentTimeStep = history.length;

  // Store the startX value to use for current state visualization
  window.currentVisualizationStartX = startX;
  
  // Return the cell size for other visualizations to use
  return cellSize;

  function drawGrid(latticeSize, height, width, startX) {
    // Only draw grid lines if lattice size is less than 250
    if (latticeSize < 250) {
      canvasContext.strokeStyle = '#eee';
      canvasContext.lineWidth   = 0.5;
      for (let x = 0; x <= latticeSize; x++) {
        // Ensure grid lines stay within canvas bounds
        if ((startX + x * cellSize) > width) break;
        
        canvasContext.beginPath();
        canvasContext.moveTo(startX + x * cellSize, 0);
        canvasContext.lineTo(startX + x * cellSize, height);
        canvasContext.stroke();
      }
      for (let t = 0; t <= Math.ceil(height / cellSize); t++) {
        canvasContext.beginPath();
        canvasContext.moveTo(0, t * cellSize);
        canvasContext.lineTo(width, t * cellSize);
        canvasContext.stroke();
      }
    }
  }

  function drawTimeSteps(history, startTime, latticeSize, startX) {
    // Store whether grid lines should be drawn
    const drawGridLines = latticeSize < 250;
    const canvasWidth = canvasElement.width;
    
    for (let t = startTime; t < history.length; t++) {
      for (let x = 0; x < latticeSize; x++) {
        // Skip cells that are beyond the canvas width
        if ((startX + x * cellSize) >= canvasWidth) continue;
        
        const pauli = history[t][x];
        const label = getPauliLabel(pauli);
        const color = getPauliColor(pauli);

        canvasContext.fillStyle   = color;
        canvasContext.globalAlpha = (label === 'I' ? 0.3 : 0.9);
        canvasContext.fillRect(startX + x * cellSize, t * cellSize, cellSize, cellSize);

        // Only draw cell borders if lattice size is less than 250
        if (drawGridLines) {
          canvasContext.globalAlpha = 1;
          canvasContext.strokeStyle = '#ddd';
          canvasContext.lineWidth   = 0.5;
          canvasContext.strokeRect(startX + x * cellSize, t * cellSize, cellSize, cellSize);
        }
      }
    }
  }
}

/**
 * Render the current state of the automaton using a direct canvas element
 */
export function renderCurrentState(elId, state, sizeParam = null) {
    const canvas = document.getElementById(elId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!state || !state.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    const n = state.length;
    
    // Calculate cell size based on available width
    // Use getBoundingClientRect to match the approach used in spacetime diagram
    const container = canvas.parentNode;
    const containerWidth = container.getBoundingClientRect().width;
    
    // Use the globally calculated cell size from the spacetime diagram
    // This ensures consistent cell sizes between the visualizations
    const s = cellSize || sizeParam || 1;
    
    // Get the full container width to ensure both visualizations use the same width
    const width = containerWidth;
    
    // Increase height to make cells more visible
    const height = Math.max(s, 40);
    
    // Important: Set both physical and CSS dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Set CSS dimensions to match exactly
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Clear canvas before drawing
    ctx.clearRect(0, 0, width, height);
    
    // Store whether grid lines should be drawn
    const drawGridLines = n < 250;
    
    // Use the same startX value as the spacetime diagram for perfect alignment
    // If not available, calculate it the same way
    const startX = window.currentVisualizationStartX !== undefined 
        ? window.currentVisualizationStartX 
        : Math.floor((containerWidth - n * s) / 2);
    
    for (let i = 0; i < n; i++) {
        // Skip cells that are beyond the canvas width
        if ((startX + i * s) >= width) continue;
        
        const pauli = state[i];
        const label = getPauliLabel(pauli);
        const color = getPauliColor(pauli);
        
        ctx.fillStyle = color;
        ctx.globalAlpha = (label === 'I' ? 0.3 : 0.9);
        ctx.fillRect(startX + i * s, 0, s, height);
        
        // Only draw cell borders if lattice size is less than 250
        if (drawGridLines) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(startX + i * s, 0, s, height);
        }
    }
}