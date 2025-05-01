import { useEffect } from 'react';
import { renderSpacetimeDiagram, renderCurrentState } from '../visualization/spacetime.js';

export function useVisualization({
    history,
    currentStateRef,
    spacetimeDiagramRef,
    renderTimeRef
}) {
    // Render visualization when history changes
    useEffect(() => {
        if (history.length > 0 && currentStateRef.current && spacetimeDiagramRef.current) {
            // Measure rendering time
            const renderStartTime = performance.now();
            
            // Render spacetime diagram first to calculate the cell size
            const usedCellSize = renderSpacetimeDiagram('spacetime-diagram', history);
            
            // Render current state using the same cell size
            renderCurrentState('current-state', history[history.length - 1], usedCellSize);
            
            // Calculate rendering time and store in ref (avoiding re-render)
            const renderEndTime = performance.now();
            renderTimeRef.current = renderEndTime - renderStartTime;
        }
    }, [history, currentStateRef, spacetimeDiagramRef, renderTimeRef]);
} 