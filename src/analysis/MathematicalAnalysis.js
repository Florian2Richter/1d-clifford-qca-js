/**
 * Mathematical Analysis component for QCA properties
 * 
 * Displays analysis results for invertibility, symplecticity, and orthogonal stabilizer properties
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
    isInvertible, 
    isSymplecticRuleMatrix, 
    hasOrthogonalStabilizerPeriodic,
    determinant,
    ruleMatrixToLaurent,
    initialStateToLaurent,
    calculateLogicalQubits,
    calculateCodeDistance
} from './laurentPolynomial.js';

/**
 * Property display component with status indicator
 */
const PropertyDisplay = React.memo(({ name, isValid, details }) => {
    return (
        <div className="property-display">
            <div className="property-header">
                <span className="property-name">{name}</span>
                <span className={`property-status ${isValid ? 'valid' : 'invalid'}`}>
                    {isValid ? '✓' : '✗'}
                </span>
            </div>
            {details && <div className="property-details">{details}</div>}
        </div>
    );
});

// Import PAULI directly to avoid import in effect
const PAULI = {
    I: [0, 0],
    X: [1, 0],
    Z: [0, 1],
    Y: [1, 1]
};

/**
 * Mathematical Analysis component
 */
export function MathematicalAnalysis({ ruleMatrix, pauliArray, operators, latticeSize, analysisStepTrigger, onPropertiesChange }) {
    const [invertible, setInvertible] = useState(false);
    const [symplectic, setSymplectic] = useState(false);
    const [orthogonalStabilizer, setOrthogonalStabilizer] = useState(false);
    const [logicalQubits, setLogicalQubits] = useState(0);
    const [codeDistance, setCodeDistance] = useState(0);
    const [invertibleDetails, setInvertibleDetails] = useState('');
    const [symplecticDetails, setSymplecticDetails] = useState('');
    const [stabilizerDetails, setStabilizerDetails] = useState('');
    
    // Add state for code distance trajectory
    const [codeDistanceTrajectory, setCodeDistanceTrajectory] = useState([]);
    
    // Keep the state but don't display it
    const [logicalQubitsDetails, setLogicalQubitsDetails] = useState('');

    // Create synthetic state array from operators (for initial configuration analysis)
    const syntheticState = useMemo(() => {
        console.log("Building synthetic state from operators", operators);
        if (!operators || !latticeSize) return null;
        
        // Create state array
        const newState = Array(latticeSize).fill().map(() => [...PAULI.I]);
            
        // Place operators
        operators.forEach(op => {
            if (op.position >= 0 && op.position < latticeSize) {
                if (op.type === 'X') {
                    newState[op.position] = [...PAULI.X];
                } else if (op.type === 'Y') {
                    newState[op.position] = [...PAULI.Y];
                } else if (op.type === 'Z') {
                    newState[op.position] = [...PAULI.Z];
                }
            }
        });
        
        return newState;
    }, [operators, latticeSize]);

    // Analyze invertibility when rule matrix changes
    useEffect(() => {
        if (!ruleMatrix || ruleMatrix.length !== 2) return;
        
        try {
            console.log("Matrix analysis effect running");
            // Check invertibility
            const isInv = isInvertible(ruleMatrix);
            setInvertible(isInv);
            
            // Get details about the determinant
            const laurentMatrix = ruleMatrixToLaurent(ruleMatrix, 2);
            const det = determinant(laurentMatrix);
            setInvertibleDetails(`det(M(x)) = ${det.toString()}`);
            
            // Check symplecticity
            const isSymp = isSymplecticRuleMatrix(ruleMatrix);
            setSymplectic(isSymp);
            setSymplecticDetails(isSymp ? 
                "M(x⁻¹)ᵀ Ω M(x) = Ω" : 
                "M(x⁻¹)ᵀ Ω M(x) ≠ Ω");
        } catch (error) {
            console.error("Error in matrix analysis:", error);
            setInvertibleDetails('Error calculating determinant');
            setSymplecticDetails('Error checking symplecticity');
        }
    }, [ruleMatrix]);

    // Analyze stabilizer orthogonality for initial configuration when synthetic state changes
    useEffect(() => {
        console.log("Initial configuration analysis effect running, state:", syntheticState);
        if (!syntheticState) return;
        
        try {
            // Check for orthogonal stabilizer with periodic boundary conditions
            const isOrthogonal = hasOrthogonalStabilizerPeriodic(syntheticState, latticeSize);
            console.log("Is orthogonal:", isOrthogonal);
            setOrthogonalStabilizer(isOrthogonal);
            
            // Get Laurent polynomials for details
            const { X, Z } = initialStateToLaurent(syntheticState);
            const xString = X && typeof X.toString === 'function' ? X.toString() : '0';
            const zString = Z && typeof Z.toString === 'function' ? Z.toString() : '0';
            setStabilizerDetails(
                `X(z) = ${xString}\nZ(z) = ${zString}\n` + 
                (isOrthogonal ? 
                    "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) = 0" : 
                    "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) ≠ 0")
            );

            // Calculate logical qubits and code distance for initial configuration
            if (isOrthogonal && latticeSize) {
                const k = calculateLogicalQubits(syntheticState, latticeSize);
                setLogicalQubits(k);
                setLogicalQubitsDetails(`k = ${k} logical qubits`);
                
                // Only calculate code distance if there are logical qubits
                let d = 0;
                if (k > 0) {
                    d = calculateCodeDistance(syntheticState, latticeSize);
                    console.log("Initial configuration - Code distance calculated:", d);
                }
                setCodeDistance(d);
            } else {
                setLogicalQubits(0);
                setCodeDistance(0);
                setLogicalQubitsDetails('Cannot calculate logical qubits (non-orthogonal stabilizer)');
            }
        } catch (error) {
            console.error("Error in initial configuration analysis:", error);
            setStabilizerDetails('Error calculating Laurent polynomials');
            setLogicalQubitsDetails('Error calculating logical qubits');
        }
    }, [syntheticState, latticeSize]);

    // Simulation-step analysis (triggered by analysisStepTrigger)
    useEffect(() => {
        if (!pauliArray || !latticeSize || !analysisStepTrigger) {
            // Clear trajectory when no active simulation
            setCodeDistanceTrajectory([]);
            return;
        }
        
        console.log("Simulation-step analysis triggered:", analysisStepTrigger, "for pauliArray:", pauliArray);
        
        try {
            // Analyze the current simulation state
            const isOrthogonal = hasOrthogonalStabilizerPeriodic(pauliArray, latticeSize);
            
            // Only update logical qubits and code distance for simulation steps
            if (isOrthogonal && latticeSize) {
                const k = calculateLogicalQubits(pauliArray, latticeSize);
                setLogicalQubits(k);
                setLogicalQubitsDetails(`k = ${k} logical qubits`);
                
                // Calculate code distance for current simulation state
                let d = 0;
                if (k > 0) {
                    d = calculateCodeDistance(pauliArray, latticeSize);
                    console.log("Simulation step - Code distance calculated:", d);
                }
                setCodeDistance(d);
                
                // Update code distance trajectory
                setCodeDistanceTrajectory(prev => {
                    const newTrajectory = [...prev, { step: analysisStepTrigger, distance: d }];
                    // Keep full trajectory from the first time step
                    return newTrajectory;
                });
            } else {
                setLogicalQubits(0);
                setCodeDistance(0);
                setLogicalQubitsDetails('Cannot calculate logical qubits (non-orthogonal stabilizer)');
                
                // Update trajectory with distance 0
                setCodeDistanceTrajectory(prev => {
                    const newTrajectory = [...prev, { step: analysisStepTrigger, distance: 0 }];
                    return newTrajectory;
                });
            }
        } catch (error) {
            console.error("Error in simulation-step analysis:", error);
            setLogicalQubitsDetails('Error calculating logical qubits');
        }
    }, [analysisStepTrigger, pauliArray, latticeSize]);

    // Notify parent component when properties change
    useEffect(() => {
        if (onPropertiesChange) {
            onPropertiesChange({
                invertible,
                symplectic,
                orthogonalStabilizer,
                logicalQubits,
                codeDistance,
                codeDistanceTrajectory
            });
        }
    }, [invertible, symplectic, orthogonalStabilizer, logicalQubits, codeDistance, codeDistanceTrajectory, onPropertiesChange]);

    return (
        <div className="mathematical-analysis">
            <PropertyDisplay 
                name="Invertibility" 
                isValid={invertible} 
                details={invertibleDetails} 
            />
            <PropertyDisplay 
                name="Symplecticity" 
                isValid={symplectic} 
                details={symplecticDetails} 
            />
            <PropertyDisplay 
                name="Orthogonal Stabilizer" 
                isValid={orthogonalStabilizer} 
                details={stabilizerDetails} 
            />
        </div>
    );
} 