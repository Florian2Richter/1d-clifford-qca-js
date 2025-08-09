/**
 * Polynomial to Binary Tableau Conversion
 * 
 * This module converts Laurent polynomial stabilizer generators to binary tableau format
 * for use with GF(2) stabilizer analysis algorithms.
 */

import { laurentToPolynomial } from './laurentPolynomial.js';

/**
 * Convert an array of Pauli generators to a binary stabilizer tableau
 * @param {Array} gens - Array of generators in format [{X: LaurentPolynomial, Z: LaurentPolynomial}, ...]
 * @param {number} N - Ring size (number of qubits)
 * @returns {Array} - M×2N binary stabilizer tableau (array of Uint8Array rows)
 */
export function polyToBinaryTableau(gens, N) {
    const tableau = [];
    
    for (const gen of gens) {
        // Convert X and Z Laurent polynomials to binary arrays
        const xBits = new Uint8Array(laurentToPolynomial(gen.X, N));
        const zBits = new Uint8Array(laurentToPolynomial(gen.Z, N));
        
        // Concatenate X and Z parts into single 2N-bit row
        const row = new Uint8Array(2 * N);
        row.set(xBits, 0);    // X part goes in first N positions
        row.set(zBits, N);    // Z part goes in last N positions
        
        tableau.push(row);
    }
    
    return tableau;
} 