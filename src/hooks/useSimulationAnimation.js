import { useEffect } from 'react';

export function useSimulationAnimation({
    isRunning,
    currentStep,
    qca,
    simulationParams,
    setHistory,
    setCurrentStep,
    setStepTime,
    timeoutRef,
    setIsRunning,
    setAnalysisStepTrigger
}) {
    // Incremental animation effect
    useEffect(() => {
        if (!isRunning || !simulationParams) return;
        
        // If we've reached the target number of steps, stop
        if (currentStep >= simulationParams.timeSteps) {
            setIsRunning(false);
            return;
        }
        
        // Schedule the next step with increased delay (50ms instead of 10ms)
        timeoutRef.current = setTimeout(() => {
            // Measure time for the step
            const startTime = performance.now();
            
            // Take one step in the simulation
            const newState = qca.step();
            
            // Calculate time taken
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            
            // Store the raw millisecond value without formatting
            if (typeof setStepTime === 'function') {
                setStepTime(timeTaken);
            }
            
            // Update history with the new state (using functional update to avoid dependency)
            setHistory(prevHistory => [...prevHistory, newState]);
            setCurrentStep(prevStep => prevStep + 1);
            
            // Trigger analysis for this simulation step
            if (typeof setAnalysisStepTrigger === 'function') {
                setAnalysisStepTrigger(prev => prev + 1);
            }
            
        }, 10); // Changed back to 10ms since rendering is now around 5ms
        
        // Cleanup on unmount or when running state changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isRunning, currentStep, qca, simulationParams, 
        setHistory, setCurrentStep, setStepTime, timeoutRef, setIsRunning, setAnalysisStepTrigger]);
} 