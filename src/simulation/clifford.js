/**
 * Core Clifford operations for 1D QCA simulation
 * 
 * This module provides the basic operations to work with Pauli operators in F2
 * representation, where each operator is represented as a pair of bits:
 * I = [0,0], X = [1,0], Z = [0,1], Y = [1,1]
 */

// Constants for Pauli operators in F2 representation
export const PAULI = {
    I: [0, 0],
    X: [1, 0],
    Z: [0, 1],
    Y: [1, 1]
};

// Map F2 representation back to Pauli label
export const PAULI_LABELS = {
    '0,0': 'I',
    '1,0': 'X',
    '0,1': 'Z',
    '1,1': 'Y'
};

// Map Pauli label to color - updated with more sophisticated palette
export const PAULI_COLORS = {
    'I': '#F7F7F7', // Light grey
    'X': '#FF9488', // Coral red
    'Z': '#4285F4', // Google blue
    'Y': '#F4B400'  // Google yellow
};

/**
 * Multiply two Pauli operators in F2 representation
 * 
 * @param {Array} a - First Pauli operator as [x,z]
 * @param {Array} b - Second Pauli operator as [x,z]
 * @returns {Array} - Result of multiplication as [x,z]
 */
export function multiplyPauli(a, b) {
    // Multiply Pauli operators using binary arithmetic
    const [ax, az] = a;
    const [bx, bz] = b;
    
    // XOR the bits
    const resultX = (ax + bx) % 2;
    const resultZ = (az + bz) % 2;
    
    return [resultX, resultZ];
}

/**
 * Get the Pauli label for an F2 representation
 * 
 * @param {Array} pauli - Pauli operator as [x,z]
 * @returns {string} - Pauli label (I, X, Z, Y)
 */
export function getPauliLabel(pauli) {
    return PAULI_LABELS[`${pauli[0]},${pauli[1]}`];
}

/**
 * Get the color for a Pauli operator
 * 
 * @param {Array} pauli - Pauli operator as [x,z]
 * @returns {string} - Color hex code
 */
export function getPauliColor(pauli) {
    const label = getPauliLabel(pauli);
    return PAULI_COLORS[label];
}

/**
 * Convert string representation to F2 array
 * 
 * @param {string} pauliString - String of Pauli operators (e.g., "IXZY")
 * @returns {Array} - Array of Pauli operators in F2 representation
 */
export function pauliStringToF2(pauliString) {
    return [...pauliString].map(char => {
        switch(char.toUpperCase()) {
            case 'I': return PAULI.I;
            case 'X': return PAULI.X;
            case 'Z': return PAULI.Z;
            case 'Y': return PAULI.Y;
            default: throw new Error(`Invalid Pauli operator: ${char}`);
        }
    });
} 