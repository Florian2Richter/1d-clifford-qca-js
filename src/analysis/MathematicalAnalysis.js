/**
 * Mathematical Analysis component for QCA properties
 * 
 * Displays analysis results for invertibility, symplecticity, and orthogonal stabilizer properties
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
    isInvertible, 
    isSymplecticRuleMatrix, 
    hasOrthogonalStabilizer,
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
export function MathematicalAnalysis({ ruleMatrix, initialState, operators, latticeSize, onPropertiesChange }) {
    const [invertible, setInvertible] = useState(false);
    const [symplectic, setSymplectic] = useState(false);
    const [orthogonalStabilizer, setOrthogonalStabilizer] = useState(false);
    const [logicalQubits, setLogicalQubits] = useState(0);
    const [codeDistance, setCodeDistance] = useState(0);
    const [invertibleDetails, setInvertibleDetails] = useState('');
    const [symplecticDetails, setSymplecticDetails] = useState('');
    const [stabilizerDetails, setStabilizerDetails] = useState('');
    
    // Keep the state but don't display it
    const [logicalQubitsDetails, setLogicalQubitsDetails] = useState('');

    // Create state array if needed - memoized for performance
    const state = useMemo(() => {
        console.log("Recalculating state from operators", operators);
        // If initialState is directly provided (e.g., current simulation state), use it
        if (initialState) return initialState;
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
    }, [initialState, operators, latticeSize]);

    // Analyze invertibility when rule matrix changes
    useEffect(() => {
        if (!ruleMatrix || ruleMatrix.length !== 2) return;
        
        try {
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

    // Analyze stabilizer orthogonality when state changes
    useEffect(() => {
        console.log("Orthogonal stabilizer effect running, state:", state);
        if (!state) return;
        
        try {
            // Check for orthogonal stabilizer with periodic boundary conditions
            const isOrthogonal = hasOrthogonalStabilizerPeriodic(state, latticeSize);
            console.log("Is orthogonal:", isOrthogonal);
            setOrthogonalStabilizer(isOrthogonal);
            
            // Get Laurent polynomials for details
            const { X, Z } = initialStateToLaurent(state);
            setStabilizerDetails(
                `X(z) = ${X.toString()}\nZ(z) = ${Z.toString()}\n` + 
                (isOrthogonal ? 
                    "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) = 0" : 
                    "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) ≠ 0")
            );

            // Calculate logical qubits and code distance if the stabilizer is orthogonal
            if (isOrthogonal && latticeSize) {
                const k = calculateLogicalQubits(state, latticeSize);
                setLogicalQubits(k);
                setLogicalQubitsDetails(`k = ${k} logical qubits`);
                
                // Only calculate code distance if there are logical qubits
                let d = 0;
                if (k > 0) {
                    d = calculateCodeDistance(state, latticeSize);
                    console.log("Code distance calculated:", d);
                }
                setCodeDistance(d);
            } else {
                setLogicalQubits(0);
                setCodeDistance(0);
                setLogicalQubitsDetails('Cannot calculate logical qubits (non-orthogonal stabilizer)');
            }
        } catch (error) {
            console.error("Error in stabilizer analysis:", error);
            setStabilizerDetails('Error calculating Laurent polynomials');
            setLogicalQubitsDetails('Error calculating logical qubits');
        }
    }, [state, initialState, latticeSize]); // Add initialState as a dependency

    // Notify parent component when properties change
    useEffect(() => {
        if (onPropertiesChange) {
            onPropertiesChange({
                invertible,
                symplectic,
                orthogonalStabilizer,
                logicalQubits,
                codeDistance
            });
        }
    }, [invertible, symplectic, orthogonalStabilizer, logicalQubits, codeDistance, onPropertiesChange]);

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