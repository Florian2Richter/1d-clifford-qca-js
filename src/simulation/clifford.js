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

// Secondary color palette for highlights and effects
export const SECONDARY_COLORS = {
    background: '#FAFAFA',
    highlight: '#4285F4',
    accent: '#0F9D58',
    text: {
        primary: '#212121',
        secondary: '#757575',
        disabled: '#BDBDBD'
    },
    divider: '#EEEEEE'
};

/**
 * Multiply two Pauli operators using F2 arithmetic
 * 
 * @param {Array} a - First Pauli operator as [x,z]
 * @param {Array} b - Second Pauli operator as [x,z]
 * @returns {Array} - Resulting Pauli operator
 */
export function multiplyPauli(a, b) {
    // XOR for addition in F2
    return [
        (a[0] + b[0]) % 2,
        (a[1] + b[1]) % 2
    ];
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

/**
 * Convert F2 array to string representation
 * 
 * @param {Array} f2Array - Array of Pauli operators in F2 representation
 * @returns {string} - String of Pauli operators
 */
export function f2ToPauliString(f2Array) {
    return f2Array.map(pauli => getPauliLabel(pauli)).join('');
} 