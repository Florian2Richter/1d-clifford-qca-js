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
  canvasContext    = null;
  canvasElement    = null;
  currentTimeStep  = 0;
  cellSize         = 0;
  lastLatticeSize  = 0;
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
    cellSize = cellSizeParam || Math.max(1, Math.min(
      Math.floor(containerWidth  / latticeSize),
      Math.floor(containerHeight / 20)
    ));
    lastLatticeSize = latticeSize;
  }
  const width = latticeSize * cellSize;
  const totalRequiredHeight = Math.max(history.length * cellSize, containerHeight);

  // First‐time initialization
  const isNewCanvas = !canvasElement || !canvasContext || container.select('canvas').empty();
  if (isNewCanvas) {
    currentTimeStep = 0;
    container.html('');

    // Limit canvas dimensions for very large states to prevent browser limitations
    // Most browsers have a max canvas size limit (~32k pixels)
    const safeWidth = Math.min(width, 32000);
    
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
    drawGrid(latticeSize, totalRequiredHeight, safeWidth);
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
    drawGrid(latticeSize, totalRequiredHeight, canvasElement.width);
    canvasContext.drawImage(tempCanvas, 0, 0);
    container.node().scrollTop = scrollPosition;
  }

  drawTimeSteps(history, currentTimeStep, latticeSize);
  currentTimeStep = history.length;

  function drawGrid(latticeSize, height, width) {
    // Only draw grid lines if lattice size is less than 250
    if (latticeSize < 250) {
      canvasContext.strokeStyle = '#eee';
      canvasContext.lineWidth   = 0.5;
      for (let x = 0; x <= latticeSize; x++) {
        // Ensure grid lines stay within canvas bounds
        if (x * cellSize > width) break;
        
        canvasContext.beginPath();
        canvasContext.moveTo(x * cellSize, 0);
        canvasContext.lineTo(x * cellSize, height);
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

  function drawTimeSteps(history, startTime, latticeSize) {
    // Store whether grid lines should be drawn
    const drawGridLines = latticeSize < 250;
    const canvasWidth = canvasElement.width;
    
    for (let t = startTime; t < history.length; t++) {
      for (let x = 0; x < latticeSize; x++) {
        // Skip cells that are beyond the canvas width
        if (x * cellSize >= canvasWidth) continue;
        
        const pauli = history[t][x];
        const label = getPauliLabel(pauli);
        const color = getPauliColor(pauli);

        canvasContext.fillStyle   = color;
        canvasContext.globalAlpha = (label === 'I' ? 0.3 : 0.9);
        canvasContext.fillRect(x * cellSize, t * cellSize, cellSize, cellSize);

        // Only draw cell borders if lattice size is less than 250
        if (drawGridLines) {
          canvasContext.globalAlpha = 1;
          canvasContext.strokeStyle = '#ddd';
          canvasContext.lineWidth   = 0.5;
          canvasContext.strokeRect(x * cellSize, t * cellSize, cellSize, cellSize);
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
    const containerWidth = canvas.parentNode.clientWidth;
    
    // Ensure minimum cell size of 1px to prevent canvas from disappearing
    // This handles very large lattice sizes (>1900)
    const s = sizeParam || Math.max(1, Math.min(15, Math.floor(containerWidth / n)));
    
    const width = n * s;
    const height = s;
    
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
    
    // Draw cells
    for (let x = 0; x < n; x++) {
        const p = state[x];
        const label = getPauliLabel(p);
        const color = getPauliColor(p);
        
        ctx.fillStyle = color;
        ctx.globalAlpha = label === 'I' ? 0.3 : 0.9;
        ctx.fillRect(x * s, 0, s, s);
        
        // Only draw cell borders if lattice size is less than 250
        if (drawGridLines) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * s, 0, s, s);
        }
    }
}