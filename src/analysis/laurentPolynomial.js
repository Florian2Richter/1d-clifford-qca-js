/**
 * Laurent Polynomial utilities for QCA analysis
 * 
 * This module provides functions to work with Laurent polynomials,
 * which are polynomials with potentially negative exponents.
 * Used for analyzing properties of Clifford QCAs.
 */

/**
 * Represents a Laurent polynomial as a map from exponents to coefficients.
 * For example, x^2 - x^(-1) would be represented as { -1: -1, 2: 1 }
 */
export class LaurentPolynomial {
    /**
     * Create a new Laurent polynomial
     * @param {Object} coeffs - Map from exponents to coefficients
     * @param {number} modulus - Modulus for coefficients (default: 0 meaning no modulus)
     */
    constructor(coeffs = {}, modulus = 0) {
        this.coeffs = { ...coeffs };
        this.modulus = modulus;
        this.normalize();
    }

    /**
     * Remove zero coefficients and apply modulus if specified
     */
    normalize() {
        Object.keys(this.coeffs).forEach(exp => {
            // Apply modulus if needed
            if (this.modulus > 0) {
                this.coeffs[exp] = ((this.coeffs[exp] % this.modulus) + this.modulus) % this.modulus;
            }
            
            // Remove zero coefficients
            if (this.coeffs[exp] === 0) {
                delete this.coeffs[exp];
            }
        });
    }

    /**
     * Add another Laurent polynomial to this one
     * @param {LaurentPolynomial} other - Laurent polynomial to add
     * @returns {LaurentPolynomial} - Result of addition
     */
    add(other) {
        const result = new LaurentPolynomial({ ...this.coeffs }, this.modulus);
        
        Object.keys(other.coeffs).forEach(exp => {
            const exponent = parseInt(exp);
            if (!result.coeffs[exponent]) {
                result.coeffs[exponent] = 0;
            }
            result.coeffs[exponent] += other.coeffs[exponent];
        });
        
        result.normalize();
        return result;
    }

    /**
     * Multiply by another Laurent polynomial
     * @param {LaurentPolynomial} other - Laurent polynomial to multiply by
     * @returns {LaurentPolynomial} - Result of multiplication
     */
    multiply(other) {
        const result = new LaurentPolynomial({}, this.modulus);
        
        Object.keys(this.coeffs).forEach(exp1 => {
            Object.keys(other.coeffs).forEach(exp2 => {
                const exponent1 = parseInt(exp1);
                const exponent2 = parseInt(exp2);
                const resultExp = exponent1 + exponent2;
                
                if (!result.coeffs[resultExp]) {
                    result.coeffs[resultExp] = 0;
                }
                
                result.coeffs[resultExp] += this.coeffs[exponent1] * other.coeffs[exponent2];
            });
        });
        
        result.normalize();
        return result;
    }

    /**
     * Substitute x -> x^(-1) in the polynomial
     * @returns {LaurentPolynomial} - Result of substitution
     */
    substituteInverse() {
        const result = new LaurentPolynomial({}, this.modulus);
        
        Object.keys(this.coeffs).forEach(exp => {
            const exponent = parseInt(exp);
            result.coeffs[-exponent] = this.coeffs[exponent];
        });
        
        return result;
    }

    /**
     * Check if the polynomial is a monomial of the form ±x^k
     * @returns {boolean} - True if polynomial is a monomial
     */
    isMonomial() {
        const keys = Object.keys(this.coeffs);
        
        // Should have exactly one term
        if (keys.length !== 1) return false;
        
        const coefficient = this.coeffs[keys[0]];
        
        // For mod 2, the coefficient must be 1
        if (this.modulus === 2) return coefficient === 1;
        
        // For other cases, coefficient must be ±1
        return coefficient === 1 || coefficient === -1;
    }

    /**
     * Get the degree of the monomial (assuming it is a monomial)
     * @returns {number|null} - The exponent if it's a monomial, null otherwise
     */
    getMonomialDegree() {
        if (!this.isMonomial()) return null;
        return parseInt(Object.keys(this.coeffs)[0]);
    }

    /**
     * Create a Laurent polynomial from a single monomial
     * @param {number} exponent - Exponent of the monomial
     * @param {number} coefficient - Coefficient of the monomial
     * @param {number} modulus - Modulus for coefficients
     * @returns {LaurentPolynomial} - The resulting monomial
     */
    static monomial(exponent, coefficient = 1, modulus = 0) {
        const coeffs = {};
        coeffs[exponent] = coefficient;
        return new LaurentPolynomial(coeffs, modulus);
    }

    /**
     * Returns a string representation of the Laurent polynomial
     * @returns {string} - String representation
     */
    toString() {
        if (Object.keys(this.coeffs).length === 0) return "0";
        
        const terms = Object.keys(this.coeffs)
            .sort((a, b) => parseInt(b) - parseInt(a)) // Sort by descending exponent
            .map(exp => {
                const exponent = parseInt(exp);
                const coefficient = this.coeffs[exponent];
                
                if (exponent === 0) {
                    return coefficient.toString();
                } else {
                    const xTerm = exponent === 1 ? "x" : `x^${exponent}`;
                    if (coefficient === 1) return xTerm;
                    if (coefficient === -1) return `-${xTerm}`;
                    return `${coefficient}${xTerm}`;
                }
            });
        
        return terms.join(" + ").replace(/\+ -/g, "- ");
    }
}

/**
 * Creates a 2x2 matrix of Laurent polynomials
 * @param {Array} entries - 4 Laurent polynomials [a, b, c, d] representing [[a, b], [c, d]]
 * @returns {Array} - 2x2 matrix of Laurent polynomials
 */
export function createLaurentMatrix(entries) {
    return [
        [entries[0], entries[1]],
        [entries[2], entries[3]]
    ];
}

/**
 * Calculates the determinant of a 2x2 matrix of Laurent polynomials
 * @param {Array} matrix - 2x2 matrix of Laurent polynomials
 * @returns {LaurentPolynomial} - Determinant as a Laurent polynomial
 */
export function determinant(matrix) {
    return matrix[0][0].multiply(matrix[1][1]).add(
        matrix[0][1].multiply(matrix[1][0]).multiply(
            new LaurentPolynomial({ 0: -1 }, matrix[0][0].modulus)
        )
    );
}

/**
 * Performs matrix multiplication for 2x2 matrices of Laurent polynomials
 * @param {Array} A - First 2x2 matrix
 * @param {Array} B - Second 2x2 matrix
 * @returns {Array} - Resulting 2x2 matrix
 */
export function multiplyMatrices(A, B) {
    return [
        [
            A[0][0].multiply(B[0][0]).add(A[0][1].multiply(B[1][0])),
            A[0][0].multiply(B[0][1]).add(A[0][1].multiply(B[1][1]))
        ],
        [
            A[1][0].multiply(B[0][0]).add(A[1][1].multiply(B[1][0])),
            A[1][0].multiply(B[0][1]).add(A[1][1].multiply(B[1][1]))
        ]
    ];
}

/**
 * Transposes a 2x2 matrix of Laurent polynomials
 * @param {Array} matrix - 2x2 matrix to transpose
 * @returns {Array} - Transposed matrix
 */
export function transpose(matrix) {
    return [
        [matrix[0][0], matrix[1][0]],
        [matrix[0][1], matrix[1][1]]
    ];
}

/**
 * Creates the symplectic matrix Ω = [[0, 1], [-1, 0]]
 * @param {number} modulus - Modulus for the coefficients
 * @returns {Array} - The symplectic matrix
 */
export function symplecticMatrix(modulus = 0) {
    return [
        [new LaurentPolynomial({ 0: 0 }, modulus), new LaurentPolynomial({ 0: 1 }, modulus)],
        [new LaurentPolynomial({ 0: modulus ? modulus - 1 : -1 }, modulus), new LaurentPolynomial({ 0: 0 }, modulus)]
    ];
}

/**
 * Check if a 2x2 matrix of Laurent polynomials preserves the symplectic form
 * Tests if M(x^-1)^T Ω M(x) = Ω
 * @param {Array} matrix - 2x2 matrix to check
 * @returns {boolean} - True if matrix preserves the symplectic form
 */
export function isSymplectic(matrix) {
    // Create matrix with x -> x^-1 substitution
    const inverseMatrix = matrix.map(row => 
        row.map(poly => poly.substituteInverse())
    );
    
    // Transpose the inverse matrix
    const transposedInverse = transpose(inverseMatrix);
    
    // Create symplectic matrix
    const omega = symplecticMatrix(matrix[0][0].modulus);
    
    // Calculate M(x^-1)^T Ω M(x)
    const product1 = multiplyMatrices(transposedInverse, omega);
    const product2 = multiplyMatrices(product1, matrix);
    
    // Check if result equals Ω
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            const diff = product2[i][j].add(
                omega[i][j].multiply(new LaurentPolynomial({ 0: -1 }, matrix[0][0].modulus))
            );
            if (Object.keys(diff.coeffs).length > 0) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Converts the Clifford QCA rule matrix format to a Laurent polynomial matrix
 * @param {Array} ruleMatrix - 2x6 rule matrix in the format [A_left | A_center | A_right]
 * @param {number} modulus - Modulus for coefficients (default: 2 for binary)
 * @returns {Array} - 2x2 matrix of Laurent polynomials representing M(x)
 */
export function ruleMatrixToLaurent(ruleMatrix, modulus = 2) {
    // Extract the components of the rule matrix
    const A_left = [
        [ruleMatrix[0][0], ruleMatrix[0][1]],
        [ruleMatrix[1][0], ruleMatrix[1][1]]
    ];
    
    const A_center = [
        [ruleMatrix[0][2], ruleMatrix[0][3]],
        [ruleMatrix[1][2], ruleMatrix[1][3]]
    ];
    
    const A_right = [
        [ruleMatrix[0][4], ruleMatrix[0][5]],
        [ruleMatrix[1][4], ruleMatrix[1][5]]
    ];
    
    // Convert to Laurent polynomials: A_left * x^-1 + A_center + A_right * x
    const M = Array(2).fill().map(() => Array(2).fill());
    
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            // Create Laurent polynomials for each position in the matrix
            const coeffs = {};
            
            // Add A_left coefficients (x^-1)
            if (A_left[i][j] !== 0) {
                coeffs[-1] = A_left[i][j];
            }
            
            // Add A_center coefficients (x^0)
            if (A_center[i][j] !== 0) {
                coeffs[0] = A_center[i][j];
            }
            
            // Add A_right coefficients (x^1)
            if (A_right[i][j] !== 0) {
                coeffs[1] = A_right[i][j];
            }
            
            M[i][j] = new LaurentPolynomial(coeffs, modulus);
        }
    }
    
    return M;
}

/**
 * Checks if a rule matrix represents a valid invertible matrix
 * @param {Array} ruleMatrix - 2x6 rule matrix
 * @returns {boolean} - True if the matrix is invertible
 */
export function isInvertible(ruleMatrix) {
    const laurentMatrix = ruleMatrixToLaurent(ruleMatrix, 2);
    const det = determinant(laurentMatrix);
    return det.isMonomial();
}

/**
 * Checks if a rule matrix preserves the symplectic form
 * @param {Array} ruleMatrix - 2x6 rule matrix
 * @returns {boolean} - True if the matrix preserves the symplectic form
 */
export function isSymplecticRuleMatrix(ruleMatrix) {
    const laurentMatrix = ruleMatrixToLaurent(ruleMatrix, 2);
    return isSymplectic(laurentMatrix);
}

/**
 * Convert initial state to Laurent polynomials X(z) and Z(z)
 * @param {Array} initialState - Array of Pauli operators in F2 representation
 * @returns {Object} - Object with X(z) and Z(z) Laurent polynomials
 */
export function initialStateToLaurent(initialState) {
    const xCoeffs = {};
    const zCoeffs = {};
    
    initialState.forEach((pauli, index) => {
        // Add X component if present
        if (pauli[0] === 1) {
            xCoeffs[index] = 1;
        }
        
        // Add Z component if present
        if (pauli[1] === 1) {
            zCoeffs[index] = 1;
        }
    });
    
    return {
        X: new LaurentPolynomial(xCoeffs, 2),
        Z: new LaurentPolynomial(zCoeffs, 2)
    };
}

/**
 * Check if the initial state generates orthogonal stabilizers
 * S(z) = X(z)Z(z^-1) + Z(z)X(z^-1) mod 2 = 0
 * @param {Array} initialState - Array of Pauli operators in F2 representation
 * @returns {boolean} - True if S(z) = 0
 */
export function hasOrthogonalStabilizer(initialState) {
    const { X, Z } = initialStateToLaurent(initialState);
    
    // Calculate S(z) = X(z)Z(z^-1) + Z(z)X(z^-1) mod 2
    const term1 = X.multiply(Z.substituteInverse());
    const term2 = Z.multiply(X.substituteInverse());
    const S = term1.add(term2);
    
    // Check if S(z) = 0
    return Object.keys(S.coeffs).length === 0;
} 