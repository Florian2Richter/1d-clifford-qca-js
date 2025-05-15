import { useState, useRef } from 'react';
import { CliffordQCA } from '../simulation/automaton.js';

export function useSimulationState() {
    const [qca, setQca] = useState(new CliffordQCA());
    const [ruleMatrix, setRuleMatrix] = useState(qca.ruleMatrix);
    const [history, setHistory] = useState([]);
    const [simulationParams, setSimulationParams] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [stepTime, setStepTime] = useState(0);
    
    const currentStateRef = useRef(null);
    const spacetimeDiagramRef = useRef(null);
    const timeoutRef = useRef(null);
    const renderTimeRef = useRef(0); // Keep this for visualization hooks

    return {
        // State variables
        qca, setQca,
        ruleMatrix, setRuleMatrix,
        history, setHistory,
        simulationParams, setSimulationParams,
        currentStep, setCurrentStep,
        isRunning, setIsRunning,
        stepTime, setStepTime,
        
        // Refs
        currentStateRef,
        spacetimeDiagramRef,
        timeoutRef,
        renderTimeRef
    };
} 