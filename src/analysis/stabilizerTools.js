/**
 * Stabilizer Analysis Tools
 * 
 * This module provides GF(2) linear algebra tools for analyzing stabilizer codes
 * including row reduction, null space computation, logical operator finding, 
 * distance calculation, and entanglement computation.
 */

// Note: omegaBinary function removed - new implementation uses more efficient
// SΩ computation by direct array swapping rather than explicit matrix multiplication

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
 * Compute the rank of a binary matrix using Gaussian elimination
 * @param {Array} matrix - Array of Uint8Array rows
 * @returns {number} - Rank of the matrix
 */
function rankMod2(matrix) {
    if (matrix.length === 0) return 0;
    
    // Make a copy to avoid modifying the original
    const mat = matrix.map(row => new Uint8Array(row));
    const rows = mat.length;
    const cols = mat[0].length;
    let rank = 0;
    
    for (let col = 0; col < cols && rank < rows; col++) {
        // Find pivot row
        let pivotRow = -1;
        for (let row = rank; row < rows; row++) {
            if (mat[row][col] === 1) {
                pivotRow = row;
                break;
            }
        }
        
        if (pivotRow === -1) continue; // No pivot in this column
        
        // Swap rows if needed
        if (pivotRow !== rank) {
            [mat[rank], mat[pivotRow]] = [mat[pivotRow], mat[rank]];
        }
        
        // Eliminate other rows
        for (let row = 0; row < rows; row++) {
            if (row !== rank && mat[row][col] === 1) {
                // XOR rows (GF(2) elimination)
                for (let c = 0; c < cols; c++) {
                    mat[row][c] ^= mat[rank][c];
                }
            }
        }
        
        rank++;
    }
    
    return rank;
}

/**
 * Find logical operators using centralizer construction with symplectic Gram-Schmidt
 * @param {Array} S - M×2N stabilizer tableau 
 * @param {number} k - Number of logical qubits
 * @returns {Array} - Array of 2k logical operators (alternating X, Z pairs)
 */
export function findLogicalOperators(S, k) {
    // S: M x 2N Uint8Array, rows are stabilizers [X | Z]
    if (k === 0 || S.length === 0) return [];

    const N  = S[0].length >>> 1;
    const M2 = S[0].length;

    // 1) Build SΩ by swapping halves: row·Ω = [Z | X]
    const SOmega = S.map(row => {
        const out = new Uint8Array(M2);
        out.set(row.subarray(N, 2*N), 0);   // Z -> left
        out.set(row.subarray(0, N),   N);   // X -> right
        return out;
    });

    // 2) Centralizer basis: nullspace(SΩ)
    const centralizer = nullspaceMod2(SOmega); // array of Uint8Array(M2)

    // 3) Select a complement to the stabilizer span (size = 2k)
    //    by greedily keeping vectors that increase rank of [S; chosen]
    const basis = [];
    let span = S.map(r => r.slice());   // working matrix to test rank increase
    let rankNow = rankMod2(span);

    for (const v of centralizer) {
        const trial = span.concat([v]);
        const r2 = rankMod2(trial);
        if (r2 > rankNow) {
            basis.push(v.slice());
            span = trial;
            rankNow = r2;
            if (basis.length === 2*k) break;
        }
    }
    if (basis.length !== 2*k) {
        // Fallback: try remaining centralizer vectors to fill to 2k
        for (const v of centralizer) {
            if (basis.length === 2*k) break;
            const trial = span.concat([v]);
            const r2 = rankMod2(trial);
            if (r2 > rankNow) {
                basis.push(v.slice());
                span = trial;
                rankNow = r2;
            }
        }
    }
    if (basis.length !== 2*k) {
        // Not enough independent centralizer vectors beyond stabilizers
        return basis; // or throw, depending on your app
    }

    // Helpers
    const sp = (a, b) => {
        // symplectic product <a,b> = a_X·b_Z + a_Z·b_X  (mod 2)
        let s = 0;
        for (let i = 0; i < N; i++) {
            s ^= (a[i] & b[N+i]) ^ (a[N+i] & b[i]);
        }
        return s & 1;
    };
    const xorInPlace = (dst, src) => { for (let i=0;i<M2;i++) dst[i]^=src[i]; };

    // 4) Symplectic Gram–Schmidt on 'basis' to produce [X1,Z1,...,Xk,Zk]
    const pool = basis.map(v => v.slice());
    const logicals = [];

    while (logicals.length < 2*k && pool.length) {
        // pick a nonzero vector as Xi
        let Xi = null, idxX = -1;
        for (let i = 0; i < pool.length; i++) {
            const v = pool[i];
            let nonzero = 0; for (let j=0;j<M2;j++) nonzero |= v[j];
            if (nonzero) { Xi = v; idxX = i; break; }
        }
        if (!Xi) break;
        pool.splice(idxX, 1);

        // find a Zi with <Xi, Zi> = 1
        let Zi = null, idxZ = -1;
        for (let i = 0; i < pool.length; i++) {
            if (sp(Xi, pool[i]) === 1) { Zi = pool[i]; idxZ = i; break; }
        }
        if (!Zi) {
            // put Xi back and try next; in well-formed cases you should find a partner
            continue;
        }
        pool.splice(idxZ, 1);

        // orthogonalize the remaining pool w.r.t. (Xi, Zi)
        for (const w of pool) {
            const ax = sp(w, Zi); if (ax) xorInPlace(w, Xi);
            const az = sp(w, Xi); if (az) xorInPlace(w, Zi);
        }

        logicals.push(Xi.slice(), Zi.slice()); // enforce order [X1,Z1,...]
    }

    return logicals; // length should be 2k
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