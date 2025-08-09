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
    LaurentPolynomial
} from './laurentPolynomial.js';
import { polyToBinaryTableau } from './polyToTableau.js';
import { findLogicalOperators, findDistance, computeEntanglement } from './stabilizerTools.js';

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
    
    // Add state for entanglement trajectory
    const [entanglementTrajectory, setEntanglementTrajectory] = useState([]);
    
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
            
            // Simplified display for orthogonal stabilizer - condition only
            let detailsText;
            
            if (isOrthogonal) {
                detailsText = "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) = 0";
            } else {
                detailsText = "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) ≠ 0";
            }
            
            setStabilizerDetails(detailsText);

            // Calculate logical qubits and binary stabilizer analysis for initial configuration
            if (isOrthogonal && latticeSize) {
                const k = calculateLogicalQubits(syntheticState, latticeSize);
                console.log("=== BINARY STABILIZER ANALYSIS (Initial) ===");
                console.log(`Logical qubits k = ${k}`);
                
                setLogicalQubits(k);
                setLogicalQubitsDetails(`k = ${k} logical qubits`);
                
                // Binary tableau analysis only
                let d = 0;
                let entanglement = 0;
                if (k > 0) {
                    try {
                        const { X, Z } = initialStateToLaurent(syntheticState);
                        
                        // Generate ALL cyclic shifts of the seed stabilizer (S0, S1, ..., S_{N-1})
                        const allStabilizers = [];
                        for (let shift = 0; shift < latticeSize; shift++) {
                            // Create shifted versions by multiplying by x^shift
                            const shiftedX = X.multiply(new LaurentPolynomial({[shift]: 1}, 2));
                            const shiftedZ = Z.multiply(new LaurentPolynomial({[shift]: 1}, 2));
                            allStabilizers.push({ X: shiftedX, Z: shiftedZ });
                        }
                        
                        const binTableau = polyToBinaryTableau(allStabilizers, latticeSize);
                        
                        // GUARD: Verify we have the full set of stabilizers
                        if (binTableau.length !== latticeSize) {
                            console.error(`CRITICAL: Expected ${latticeSize} stabilizers, got ${binTableau.length}!`);
                            console.error("This means we're not passing the full cyclic shift set S0, S1, ..., S_{N-1}");
                        } else {
                            console.log(`✓ CORRECT: Generated all ${binTableau.length} cyclic shifts (S0, S1, ..., S${latticeSize-1})`);
                        }
                        
                        // Debug: Show binary tableau
                        console.log("=== BINARY STABILIZER TABLEAU ===");
                        binTableau.forEach((row, index) => {
                            const xPart = Array.from(row.slice(0, latticeSize));
                            const zPart = Array.from(row.slice(latticeSize));
                            console.log(`Stabilizer ${index}: X=[${xPart.join(',')}] Z=[${zPart.join(',')}]`);
                        });
                        console.log("==================================");
                        
                        const logicals = findLogicalOperators(binTableau, k);
                        const binaryDistance = findDistance(binTableau, logicals);
                        entanglement = computeEntanglement(binTableau, logicals);
                        
                        d = binaryDistance;
                        
                        // Output key results immediately
                        console.log(`📊 RESULTS (Initial): Distance=${d}, Entanglement=${entanglement}, Logicals=${logicals.length}/${2*k}`);
                        
                        console.log("Initial configuration - Binary analysis:", {
                            distance: d,
                            entanglement,
                            logicalCount: logicals.length,
                            k: k,
                            tableauRows: binTableau.length
                        });
                        
                        // Enhanced entanglement output
                        console.log(`🔗 ENTANGLEMENT (Initial): ${entanglement}`);
                        
                        // Debug: Always show what we tried to find
                        console.log(`Searching for ${2*k} logical operators with tableau of ${binTableau.length} rows`);
                        
                        // Debug: Show actual logical operators
                        console.log(`DEBUG: About to check if logicals.length (${logicals.length}) > 0`);
                        if (logicals.length > 0) {
                            console.log("=== LOGICAL OPERATORS (Binary Stabilizer Formalism) ===");
                            logicals.forEach((logical, index) => {
                                const xPart = Array.from(logical.slice(0, latticeSize));
                                const zPart = Array.from(logical.slice(latticeSize));
                                const weight = xPart.reduce((sum, x, i) => sum + (x || zPart[i] ? 1 : 0), 0);
                                console.log(`Logical ${index}: X=[${xPart.join(',')}] Z=[${zPart.join(',')}] weight=${weight}`);
                            });
                            console.log("===============================================");
                        }
                    } catch (error) {
                        console.error("Error in binary tableau analysis:", error);
                    }
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
            console.log("Clearing trajectory - pauliArray:", !!pauliArray, "latticeSize:", latticeSize, "trigger:", analysisStepTrigger);
            setCodeDistanceTrajectory([]);
            setEntanglementTrajectory([]);
            return;
        }
        
        console.log("Simulation-step analysis triggered:", analysisStepTrigger, "for pauliArray:", pauliArray);
        
        try {
            // Analyze the current simulation state
            const isOrthogonal = hasOrthogonalStabilizerPeriodic(pauliArray, latticeSize);
            
            // Update stabilizer details for simulation state
            const { X, Z } = initialStateToLaurent(pauliArray);
            const xString = X && typeof X.toString === 'function' ? X.toString() : '0';
            const zString = Z && typeof Z.toString === 'function' ? Z.toString() : '0';
            
            // Simplified display for orthogonal stabilizer - condition only
            let detailsText;
            
            if (isOrthogonal) {
                detailsText = "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) = 0";
            } else {
                detailsText = "S(z) = X(z)Z(z⁻¹) + Z(z)X(z⁻¹) mod (x^N-1) ≠ 0";
            }
            
            setStabilizerDetails(detailsText);
            
            // Only update logical qubits and code distance for simulation steps
            if (isOrthogonal && latticeSize) {
                const k = calculateLogicalQubits(pauliArray, latticeSize);
                console.log(`=== BINARY STABILIZER ANALYSIS Step ${analysisStepTrigger} ===`);
                console.log(`Logical qubits k = ${k}`);
                
                setLogicalQubits(k);
                setLogicalQubitsDetails(`k = ${k} logical qubits`);
                
                // Binary tableau analysis only
                let d = 0;
                let entanglement = 0;
                if (k > 0) {
                    try {
                        const { X, Z } = initialStateToLaurent(pauliArray);
                        
                        // Generate ALL cyclic shifts of the seed stabilizer (S0, S1, ..., S_{N-1})
                        const allStabilizers = [];
                        for (let shift = 0; shift < latticeSize; shift++) {
                            // Create shifted versions by multiplying by x^shift
                            const shiftedX = X.multiply(new LaurentPolynomial({[shift]: 1}, 2));
                            const shiftedZ = Z.multiply(new LaurentPolynomial({[shift]: 1}, 2));
                            allStabilizers.push({ X: shiftedX, Z: shiftedZ });
                        }
                        
                        const binTableau = polyToBinaryTableau(allStabilizers, latticeSize);
                        
                        // GUARD: Verify we have the full set of stabilizers
                        if (binTableau.length !== latticeSize) {
                            console.error(`CRITICAL (Step ${analysisStepTrigger}): Expected ${latticeSize} stabilizers, got ${binTableau.length}!`);
                            console.error("This means we're not passing the full cyclic shift set S0, S1, ..., S_{N-1}");
                        } else {
                            console.log(`✓ CORRECT (Step ${analysisStepTrigger}): Generated all ${binTableau.length} cyclic shifts (S0, S1, ..., S${latticeSize-1})`);
                        }
                        
                        // Debug: Show binary tableau for simulation step
                        console.log(`=== BINARY STABILIZER TABLEAU Step ${analysisStepTrigger} ===`);
                        binTableau.forEach((row, index) => {
                            const xPart = Array.from(row.slice(0, latticeSize));
                            const zPart = Array.from(row.slice(latticeSize));
                            console.log(`Stabilizer ${index}: X=[${xPart.join(',')}] Z=[${zPart.join(',')}]`);
                        });
                        console.log("================================================");
                        
                        const logicals = findLogicalOperators(binTableau, k);
                        const binaryDistance = findDistance(binTableau, logicals);
                        entanglement = computeEntanglement(binTableau, logicals);
                        
                        d = binaryDistance;
                        
                        // Output key results immediately
                        console.log(`📊 RESULTS (Step ${analysisStepTrigger}): Distance=${d}, Entanglement=${entanglement}, Logicals=${logicals.length}/${2*k}`);
                        
                        console.log("Simulation step - Binary analysis:", {
                            distance: d,
                            entanglement,
                            logicalCount: logicals.length,
                            k: k,
                            tableauRows: binTableau.length
                        });
                        
                        // Enhanced entanglement output
                        console.log(`🔗 ENTANGLEMENT (Step ${analysisStepTrigger}): ${entanglement}`);
                        
                        // Debug: Always show what we tried to find
                        console.log(`Searching for ${2*k} logical operators with tableau of ${binTableau.length} rows`);
                        
                        // Debug: Show actual logical operators
                        console.log(`DEBUG: About to check if logicals.length (${logicals.length}) > 0`);
                        if (logicals.length > 0) {
                            console.log(`=== LOGICAL OPERATORS Step ${analysisStepTrigger} (Binary Stabilizer Formalism) ===`);
                            logicals.forEach((logical, index) => {
                                const xPart = Array.from(logical.slice(0, latticeSize));
                                const zPart = Array.from(logical.slice(latticeSize));
                                const weight = xPart.reduce((sum, x, i) => sum + (x || zPart[i] ? 1 : 0), 0);
                                console.log(`Logical ${index}: X=[${xPart.join(',')}] Z=[${zPart.join(',')}] weight=${weight}`);
                            });
                            console.log("=======================================================");
                        }
                    } catch (error) {
                        console.error("Error in binary tableau analysis:", error);
                    }
                }
                setCodeDistance(d);
                
                // Update code distance trajectory
                setCodeDistanceTrajectory(prev => {
                    const newTrajectory = [...prev, { step: analysisStepTrigger, distance: d }];
                    console.log("Updating trajectory:", newTrajectory);
                    // Keep full trajectory from the first time step
                    return newTrajectory;
                });
                
                // Update entanglement trajectory
                setEntanglementTrajectory(prev => {
                    const newTrajectory = [...prev, { step: analysisStepTrigger, entanglement }];
                    console.log("Updating entanglement trajectory:", newTrajectory);
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
                
                // Update entanglement trajectory with 0
                setEntanglementTrajectory(prev => {
                    const newTrajectory = [...prev, { step: analysisStepTrigger, entanglement: 0 }];
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
            console.log("Mathematical Analysis - Updating properties:", {
                invertible,
                symplectic,
                orthogonalStabilizer,
                logicalQubits,
                codeDistance,
                trajectoryLength: codeDistanceTrajectory.length,
                entanglementLength: entanglementTrajectory.length
            });
            onPropertiesChange({
                invertible,
                symplectic,
                orthogonalStabilizer,
                logicalQubits,
                codeDistance,
                codeDistanceTrajectory,
                entanglementTrajectory
            });
        }
    }, [invertible, symplectic, orthogonalStabilizer, logicalQubits, codeDistance, codeDistanceTrajectory, entanglementTrajectory, onPropertiesChange]);

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