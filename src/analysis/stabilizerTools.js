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
                // Compute sum of all non-pivot terms in this row
                for (let col = 0; col < cols; col++) {
                    if (col === pivotCol) continue;
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
 * Matrix-vector multiplication in GF(2)
 * @param {Array} matrix - M×N matrix of Uint8Array rows
 * @param {Uint8Array} vector - N-length vector
 * @returns {Uint8Array} - M-length result vector
 */
function mulMod2(matrix, vector) {
    const result = new Uint8Array(matrix.length);
    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < vector.length; j++) {
            sum ^= matrix[i][j] & vector[j];
        }
        result[i] = sum;
    }
    return result;
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
    if (k === 0 || S.length === 0) return [];
  
    const N  = S[0].length >>> 1;
    const M2 = S[0].length;
  
    // SΩ = S·J  (swap halves per row)
    const SOmega = S.map(row => {
      const out = new Uint8Array(M2);
      out.set(row.subarray(N, 2*N), 0);
      out.set(row.subarray(0, N),   N);
      return out;
    });
  
    const centralizer = nullspaceMod2(SOmega);
  
    // ===== key change: build a FULL pool, not just 2k vectors =====
    // keep all centralizer vectors that extend rank beyond span(S)
    let span = S.map(r => r.slice());
    let rNow = rankMod2(span);
    const pool = [];
    for (const v of centralizer) {
      const trial = span.concat([v]);
      const r2 = rankMod2(trial);
      if (r2 > rNow) {
        pool.push(v.slice());
        span = trial;
        rNow = r2;
      }
    }
    // If pool < 2k, we can’t form all logicals
    if (pool.length < 2*k) {
      console.log(`DEBUG: Only ${pool.length} independent centralizer vectors outside span(S); need at least ${2*k}.`);
    }
  
    const sp = (a, b) => {
      let s = 0;
      for (let i = 0; i < N; i++) s ^= (a[i] & b[N+i]) ^ (a[N+i] & b[i]);
      return s & 1;
    };
    const xorInPlace = (dst, src) => { for (let i=0;i<M2;i++) dst[i]^=src[i]; };
  
    const logicals = [];
    // Work on a mutable copy of the full pool
    const work = pool.map(v => v.slice());
  
    while (logicals.length < 2*k && work.length) {
      // pick any nonzero Xi
      let idxX = work.findIndex(v => v.some(b => b));
      if (idxX < 0) break;
      const Xi = work.splice(idxX, 1)[0];
  
      // find a Zi in the remaining work with <Xi,Zi>=1
      let idxZ = -1;
      for (let i = 0; i < work.length; i++) {
        if (sp(Xi, work[i]) === 1) { idxZ = i; break; }
      }
      if (idxZ === -1) {
        // no partner among current work; try next Xi (put this one back at end)
        work.push(Xi);
        continue;
      }
      const Zi = work.splice(idxZ, 1)[0];
  
      // orthogonalize the rest w.r.t. (Xi, Zi)
      for (const w of work) {
        if (sp(w, Zi)) xorInPlace(w, Xi);
        if (sp(w, Xi)) xorInPlace(w, Zi);
      }
  
      logicals.push(Xi.slice(), Zi.slice());
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
export function computeEntanglement(tableau, logicals = []) {
    if (!tableau || tableau.length === 0) return 0;
  
    const twoN = tableau[0].length;
    const N = twoN >>> 1;
    const cut = N >>> 1;
  
    // 1) Augment with Z-logicals: those with X part == 0
    const augmented = tableau.slice();
    if (logicals && logicals.length) {
      for (const op of logicals) {
        let hasX = false;
        for (let i = 0; i < N; i++) { if (op[i]) { hasX = true; break; } }
        if (!hasX) augmented.push(op); // append Z-logical as additional stabilizer
      }
    }
  
    // 2) Count rows with support on both sides of the cut
    let crossing = 0;
    for (const row of augmented) {
      let left = false, right = false;
  
      // left half: any X or Z on [0, cut)
      for (let i = 0; i < cut && !left; i++) {
        if (row[i] | row[N + i]) left = true;
      }
  
      // right half: any X or Z on [cut, N)
      for (let i = cut; i < N && !right; i++) {
        if (row[i] | row[N + i]) right = true;
      }
  
      if (left && right) crossing++;
    }
  
    // 3) Entanglement is half the number of crossing rows
    return (crossing / 2) | 0; // integer division
}