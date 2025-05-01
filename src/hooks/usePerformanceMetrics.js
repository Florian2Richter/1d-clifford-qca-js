import { useEffect } from 'react';

export function usePerformanceMetrics({
    isRunning,
    renderTimeRef,
    setRenderTime
}) {
    // Update the UI with performance metrics periodically without triggering re-renders
    useEffect(() => {
        if (!isRunning) return;
        
        const metricsInterval = setInterval(() => {
            setRenderTime(renderTimeRef.current);
        }, 500); // Update metrics every 500ms
        
        return () => clearInterval(metricsInterval);
    }, [isRunning, renderTimeRef, setRenderTime]);
} 