/**
 * Stabilizer Analysis Tools
 * 
 * This module provides GF(2) linear algebra tools for analyzing stabilizer codes
 * including row reduction, null space computation, logical operator finding, 
 * distance calculation, and entanglement computation.
 */

/**
 * Create binary symplectic matrix Ω for N qubits
 * @param {number} N - Number of qubits
 * @returns {Array} - 2N×2N binary symplectic matrix
 */
export function omegaBinary(N) {
    const M = 2 * N;
    const Omega = Array.from({length: M}, () => new Uint8Array(M));
    
    for (let i = 0; i < N; i++) {
        Omega[i][N + i] = 1;   // [0 I] block
        Omega[N + i][i] = 1;   // [I 0] block
    }
    
    return Omega;
}

/**
 * In-place GF(2) row reduction of a binary matrix
 * @param {Array} tableau - M×2N matrix of Uint8Array rows
 * @returns {Array} - Array of pivot column indices
 */
export function rrefMod2(tableau) {
    if (tableau.length === 0) return [];
    
    const rows = tableau.length;
    const cols = tableau[0].length;
    const pivots = [];
    let currentRow = 0;
    
    for (let col = 0; col < cols && currentRow < rows; col++) {
        // Find pivot row
        let pivotRow = -1;
        for (let row = currentRow; row < rows; row++) {
            if (tableau[row][col] === 1) {
                pivotRow = row;
                break;
            }
        }
        
        if (pivotRow === -1) continue; // No pivot in this column
        
        // Swap rows if needed
        if (pivotRow !== currentRow) {
            [tableau[currentRow], tableau[pivotRow]] = [tableau[pivotRow], tableau[currentRow]];
        }
        
        pivots.push(col);
        
        // Eliminate other rows
        for (let row = 0; row < rows; row++) {
            if (row !== currentRow && tableau[row][col] === 1) {
                // XOR rows (GF(2) elimination)
                for (let c = 0; c < cols; c++) {
                    tableau[row][c] ^= tableau[currentRow][c];
                }
            }
        }
        
        currentRow++;
    }
    
    return pivots;
}

/**
 * Compute null space basis of a binary matrix
 * @param {Array} tableau - M×2N matrix of Uint8Array rows
 * @returns {Array} - Null space basis as array of Uint8Array vectors
 */
export function nullspaceMod2(tableau) {
    if (tableau.length === 0) return [];
    
    const rows = tableau.length;
    const cols = tableau[0].length;
    
    // Make a copy for row reduction
    const matrix = tableau.map(row => new Uint8Array(row));
    const pivots = rrefMod2(matrix);
    
    // Find free variables (non-pivot columns)
    const freeVars = [];
    for (let col = 0; col < cols; col++) {
        if (!pivots.includes(col)) {
            freeVars.push(col);
        }
    }
    
    const nullBasis = [];
    
    // For each free variable, create a basis vector
    for (const freeVar of freeVars) {
        const basisVector = new Uint8Array(cols);
        basisVector[freeVar] = 1;
        
        // Back-substitute to find values of pivot variables
        for (let i = pivots.length - 1; i >= 0; i--) {
            const pivotCol = pivots[i];
            let sum = 0;
            
            // Find the row with this pivot
            let pivotRow = -1;
            for (let row = 0; row < rows; row++) {
                if (matrix[row][pivotCol] === 1) {
                    pivotRow = row;
                    break;
                }
            }
            
            if (pivotRow !== -1) {
                // Compute sum of non-pivot terms in this row
                for (let col = pivotCol + 1; col < cols; col++) {
                    sum ^= matrix[pivotRow][col] & basisVector[col];
                }
                basisVector[pivotCol] = sum;
            }
        }
        
        nullBasis.push(basisVector);
    }
    
    return nullBasis;
}

/**
 * Find logical operators using centralizer construction
 * @param {Array} tableau - M×2N stabilizer tableau
 * @param {number} k - Number of logical qubits
 * @returns {Array} - Array of 2k logical operators (alternating X, Z pairs)
 */
export function findLogicalOperators(tableau, k) {
    if (k === 0 || tableau.length === 0) return [];
    
    const N = tableau[0].length / 2;
    const Omega = omegaBinary(N);
    
    // Compute tableau * Omega
    const tableauOmega = [];
    for (const row of tableau) {
        const newRow = new Uint8Array(2 * N);
        for (let i = 0; i < 2 * N; i++) {
            for (let j = 0; j < 2 * N; j++) {
                newRow[i] ^= row[j] & Omega[j][i];
            }
        }
        tableauOmega.push(newRow);
    }
    
    // Find centralizer (null space of tableau * Omega)
    const centralizer = nullspaceMod2(tableauOmega);
    
    // Greedily pick 2k independent rows to form symplectic basis
    const logicals = [];
    const used = new Set();
    
    // Try to find k symplectic pairs (X_i, Z_i)
    for (let i = 0; i < k && logicals.length < 2 * k; i++) {
        // Find an unused vector from centralizer
        let xLogical = null;
        for (let j = 0; j < centralizer.length; j++) {
            if (!used.has(j)) {
                xLogical = centralizer[j];
                used.add(j);
                break;
            }
        }
        
        if (!xLogical) break;
        logicals.push(new Uint8Array(xLogical));
        
        // Find a Z logical that anticommutes with this X logical
        let zLogical = null;
        for (let j = 0; j < centralizer.length; j++) {
            if (!used.has(j)) {
                // Check if they anticommute (symplectic inner product = 1)
                let symplecticProduct = 0;
                for (let pos = 0; pos < N; pos++) {
                    symplecticProduct ^= (xLogical[pos] & centralizer[j][N + pos]) ^
                                        (xLogical[N + pos] & centralizer[j][pos]);
                }
                
                if (symplecticProduct === 1) {
                    zLogical = centralizer[j];
                    used.add(j);
                    break;
                }
            }
        }
        
        if (zLogical) {
            logicals.push(new Uint8Array(zLogical));
        } else {
            // If we can't find a symplectic partner, just add any unused vector
            for (let j = 0; j < centralizer.length; j++) {
                if (!used.has(j)) {
                    logicals.push(new Uint8Array(centralizer[j]));
                    used.add(j);
                    break;
                }
            }
        }
    }
    
    return logicals;
}

/**
 * Compute Hamming weight of a binary vector
 * @param {Uint8Array} vector - Binary vector
 * @returns {number} - Hamming weight
 */
function hammingWeight(vector) {
    return vector.reduce((sum, bit) => sum + bit, 0);
}

/**
 * Find minimum distance by brute force over logical operator combinations
 * @param {Array} tableau - M×2N stabilizer tableau  
 * @param {Array} logicals - Array of logical operators
 * @returns {number} - Minimum distance
 */
export function findDistance(tableau, logicals) {
    if (logicals.length === 0) return 0;
    
    const N = tableau[0].length / 2;
    let minDistance = Infinity;
    
    // Try all non-empty subsets of logical operators
    const numLogicals = logicals.length;
    for (let subset = 1; subset < (1 << numLogicals); subset++) {
        const combination = new Uint8Array(2 * N);
        
        // XOR together the selected logical operators
        for (let i = 0; i < numLogicals; i++) {
            if (subset & (1 << i)) {
                for (let j = 0; j < 2 * N; j++) {
                    combination[j] ^= logicals[i][j];
                }
            }
        }
        
        // Compute Hamming weight (considering both X and Z parts)
        let weight = 0;
        for (let i = 0; i < N; i++) {
            if (combination[i] || combination[N + i]) {
                weight++;
            }
        }
        
        if (weight > 0 && weight < minDistance) {
            minDistance = weight;
        }
    }
    
    return minDistance === Infinity ? 0 : minDistance;
}

/**
 * Compute entanglement by counting logical operators with bipartite support
 * @param {Array} tableau - M×2N stabilizer tableau
 * @param {Array} logicals - Array of logical operators  
 * @returns {number} - Entanglement measure (count/2)
 */
export function computeEntanglement(tableau, logicals) {
    if (logicals.length === 0) return 0;
    
    const N = tableau[0].length / 2;
    const cut = Math.floor(N / 2);
    let crossingCount = 0;
    
    // Consider only Z-logical operators (every other one if in symplectic pairs)
    for (let i = 1; i < logicals.length; i += 2) {
        const row = logicals[i];
        
        // Check support on left half (both X and Z)
        const leftSupport = Array.from({length: cut}, (_, i) => 
            row[i] || row[N + i]
        ).some(x => x);
        
        // Check support on right half (both X and Z)  
        const rightSupport = Array.from({length: N - cut}, (_, i) => 
            row[cut + i] || row[N + cut + i]
        ).some(x => x);
        
        if (leftSupport && rightSupport) {
            crossingCount++;
        }
    }
    
    return crossingCount / 2;
} 