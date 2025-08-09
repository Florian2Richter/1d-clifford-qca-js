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
 * Check orthogonality *with* periodic boundary conditions.
 * We form Sₙ(z) = [X(z)Z(z⁻¹) + Z(z)X(z⁻¹)] mod (x^N - 1)
 * and verify it's identically zero.
 *
 * @param {Array} initialState  – Pauli string in F₂ form
 * @param {number} N            – chain length
 * @returns {boolean}           – true iff *all* translates commute
 */
export function hasOrthogonalStabilizerPeriodic(initialState, N) {
  // 1) infinite-chain S(z)
  const { X, Z } = initialStateToLaurent(initialState);
  const term1 = X.multiply(Z.substituteInverse());
  const term2 = Z.multiply(X.substituteInverse());
  const S_inf = term1.add(term2);
  
  // 2) reduce to length-N array mod (x^N - 1)
  //    laurentToPolynomial folds all exponents mod N
  const S_bits = laurentToPolynomial(S_inf, N);
  
  // 3) check that every coefficient is zero
  return S_bits.every(b => b === 0);
}

/**
 * Calculate the greatest common divisor (GCD) of two Laurent polynomials in F2[x±1]
 * @param {LaurentPolynomial} poly1 - First Laurent polynomial
 * @param {LaurentPolynomial} poly2 - Second Laurent polynomial
 * @returns {LaurentPolynomial} - GCD of the two polynomials
 */
export function gcd(poly1, poly2) {
    // Create copies to avoid modifying the originals
    let a = new LaurentPolynomial({ ...poly1.coeffs }, poly1.modulus);
    let b = new LaurentPolynomial({ ...poly2.coeffs }, poly2.modulus);
    
    // Handle special cases
    if (Object.keys(a.coeffs).length === 0) return b;
    if (Object.keys(b.coeffs).length === 0) return a;
    
    // Euclidean algorithm for polynomials
    while (Object.keys(b.coeffs).length > 0) {
        // We need to implement polynomial division for Laurent polynomials
        // This is a simplified version for F2[x±1]
        const aExponents = Object.keys(a.coeffs).map(e => parseInt(e));
        const bExponents = Object.keys(b.coeffs).map(e => parseInt(e));
        
        // Find highest exponents
        const aMaxExp = Math.max(...aExponents);
        const bMaxExp = Math.max(...bExponents);
        
        // If b's degree is higher, swap a and b
        if (bMaxExp > aMaxExp) {
            const temp = a;
            a = b;
            b = temp;
            continue;
        }
        
        // Calculate the shift needed for division
        const shift = aMaxExp - bMaxExp;
        
        // Create a shifted version of b
        const shiftedB = new LaurentPolynomial({}, b.modulus);
        for (const exp in b.coeffs) {
            shiftedB.coeffs[parseInt(exp) + shift] = b.coeffs[exp];
        }
        
        // Subtract shiftedB from a (which is addition in F2)
        a = a.add(shiftedB);
        
        // If a is zero, return b
        if (Object.keys(a.coeffs).length === 0) return b;
        
        // If a's degree is now less than b's, swap them
        if (Math.max(...Object.keys(a.coeffs).map(e => parseInt(e))) < 
            Math.max(...Object.keys(b.coeffs).map(e => parseInt(e)))) {
            const temp = a;
            a = b;
            b = temp;
        }
    }
    
    return a;
}

/**
 * Calculate the GCD of a Laurent polynomial with xN-1 to impose periodicity
 * @param {LaurentPolynomial} poly - Laurent polynomial
 * @param {number} N - Chain length (periodicity)
 * @returns {LaurentPolynomial} - GCD of poly and xN-1
 */
export function gcdWithPeriodicity(poly, N) {
    // Create xN-1 polynomial
    const periodicityPoly = new LaurentPolynomial({
        [N]: 1,
        [0]: poly.modulus === 2 ? 1 : -1
    }, poly.modulus);
    
    return gcd(poly, periodicityPoly);
}

/**
 * Calculate the number of logical qubits in a stabilizer code
 * @param {Array} initialState - Array of Pauli operators in F2 representation
 * @param {number} chainLength - Chain length (periodicity)
 * @returns {number} - Number of logical qubits
 */
export function calculateLogicalQubits(initialState, chainLength) {
    // Step 1: Extract the single generator in the form H(x) = [gZ(x) | gX(x)]
    const { X: gX, Z: gZ } = initialStateToLaurent(initialState);
    
    // Step 2: Compute the SNF diagonal d1(x) = gcd(gZ(x), gX(x))
    const d1 = gcd(gZ, gX);
    
    // Step 3: Impose periodicity -> finite-NN GCD: d1(N)(x) = gcd(d1(x), xN-1)
    const d1N = gcdWithPeriodicity(d1, chainLength);
    
    // Step 4: Logical qubits k = degree of d1(N)(x)
    // Calculate the degree as the maximum exponent (FIXED: was max - min)
    if (Object.keys(d1N.coeffs).length === 0) {
        return 0; // Empty polynomial, no logical qubits
    }
    
    const exponents = Object.keys(d1N.coeffs).map(e => parseInt(e));
    const degree = Math.max(...exponents);
    
    return degree;
}

/**
 * Reduce a LaurentPolynomial to an N-length binary array
 * in F₂[x]/(x^N−1).
 *
 * @param {LaurentPolynomial} poly  – your Laurent polynomial
 * @param {number} N                – chain length
 * @returns {number[]}              – array [a0,…,a_{N-1}] mod 2
 */
export function laurentToPolynomial(poly, N) {
  const arr = Array(N).fill(0);
  // For each term x^e in poly.coeffs, reduce e mod N and toggle arr[e mod N].
  Object.entries(poly.coeffs).forEach(([expStr, coeff]) => {
    const e = parseInt(expStr, 10);
    const i = ((e % N) + N) % N;
    // In F₂ we just xor the coefficient
    arr[i] = (arr[i] + coeff) & 1;
  });
  return arr;
}

/**
 * Compute Hamming weight of a binary array.
 *
 * @param {number[]} bits  – array of 0/1
 * @returns {number}       – count of 1's
 */
export function hammingWeight(bits) {
  return bits.reduce((sum, b) => sum + (b === 1 ? 1 : 0), 0);
}

/**
 * Exact division of two LaurentPolynomials in F₂[x], assuming
 * divisor is monic and divides dividend exactly.
 * Returns Q(x) such that dividend = Q·divisor.
 */
export function laurentDivide(dividend, divisor) {
  // Make working copies
  let R = new LaurentPolynomial({ ...dividend.coeffs }, 2);
  let Q = new LaurentPolynomial({}, 2);

  // Degree of the divisor (highest exponent)
  const degDiv = Math.max(...Object.keys(divisor.coeffs).map(e => parseInt(e, 10)));

  // While R still has a term of degree ≥ degDiv:
  while (true) {
    // Compute current degree of R properly:
    const expsR = Object.keys(R.coeffs).map(e => parseInt(e, 10));
    if (expsR.length === 0) break;         // R == 0
    const degR = Math.max(...expsR);
    if (degR < degDiv) break;

    // We need to subtract (XOR) divisor·x^(degR−degDiv)
    const shift = degR - degDiv;
    const term  = divisor.multiply(
      LaurentPolynomial.monomial(shift, 1, 2)
    );

    // XOR it into R:
    R = R.add(term);

    // Record that factor into Q (also XOR):
    const old = Q.coeffs[shift] || 0;
    Q.coeffs[shift] = (old ^ 1);
    Q.normalize();
  }

  return Q;
}

/**
 * Calculate the code distance d for a single-generator 1D cyclic code.
 * 
 * @param {Array} initialState - Array of Pauli operators in F2 representation
 * @param {number} N - Chain length (periodicity)
 * @returns {number} - Code distance d
 */
export function calculateCodeDistance(initialState, N) {
  // (a) first, how many logicals?
  const k = calculateLogicalQubits(initialState, N);
  if (k === 0) {
    return 0;   // no logical qubits → no distance
  }

  // (b) build the two generator polynomials
  const { X: gX, Z: gZ } = initialStateToLaurent(initialState);

  // --- Z-distance: weight of normalized gX(x) ---
  const expsX = Object.keys(gX.coeffs).map(e => parseInt(e,10));
  let dZ;
  if (expsX.length === 0) {
    dZ = N+1;     // no X-checks → infinite Z-distance
  } else {
    const minExp = Math.min(...expsX);
    // normalized exponents
    dZ = expsX.length;
  }

  // --- X-distance: residual scan ---
  // 1) compute the finite-chain Smith factor
  const d1   = gcd(gZ, gX);
  const d1N  = gcdWithPeriodicity(d1, N);

  // 2) form the true dividend x^N - 1 as a LaurentPolynomial
  const dividend = new LaurentPolynomial({ [N]:1, [0]:1 }, 2);

  // 3) exact polynomial quotient = (x^N-1)/d1N
  const residualPoly = laurentDivide(dividend, d1N);

  // 4) reduce to an N-bit array
  const Rbits = laurentToPolynomial(residualPoly, N);

  // 5) scan all shifts for minimum nonzero weight
  let dX = Infinity;
  for (let s = 0; s < N; s++) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      if (Rbits[(i + s) % N] === 1) w++;
    }
    if (w > 0 && w < dX) dX = w;
    if (dX === 1) break;
  }
  if (dX === Infinity) dX = 0;

  // (c) final quantum distance is the smaller of the two
  return Math.min(dZ, dX);
}

/**
 * Placeholder function for detailed code distance and logical operators analysis.
 * TODO: Implement the complete algorithm for computing logical operators.
 * 
 * @param {Array} initialState - Array of Pauli operators in F2 representation
 * @param {number} N - Chain length (periodicity)
 * @returns {Object} - Object containing distance, logical operators, and intermediate results
 */
export function calculateCodeDistanceAndLogicals(initialState, N) {
  // Use existing working functions for basic calculations
  const k = calculateLogicalQubits(initialState, N);
  const d = k > 0 ? calculateCodeDistance(initialState, N) : 0;
  
  return {
    distance: d,
    logicalQubits: k,
    logicalZOperators: [],
    logicalXOperators: [],
    canonicalZSeed: {
      polynomial: new LaurentPolynomial({ 0: 1 }, 2), // Placeholder: constant 1
      supportVector: Array(N).fill(0),
      hammingWeight: 0
    },
    canonicalXSeed: {
      polynomial: new LaurentPolynomial({ 0: 1 }, 2), // Placeholder: constant 1
      supportVector: Array(N).fill(0),
      hammingWeight: 0
    },
    periodicGX: {
      polynomial: new LaurentPolynomial({}, 2),
      degree: 0
    },
    periodicGZ: {
      polynomial: new LaurentPolynomial({}, 2),
      degree: 0
    },
    commonFactor: {
      d1: new LaurentPolynomial({}, 2),
      d1N: new LaurentPolynomial({}, 2)
    }
  };
} 