# 1D Clifford Quantum Cellular Automaton Simulator

A JavaScript simulator for 1D Clifford Quantum Cellular Automata.

## Features

- Interactive visualization of quantum cellular automata evolution
- Customizable rule matrices
- Support for various initial states
- Real-time simulation and analysis

## Live Demo

Check out the live demo at: https://florian2richter.github.io/1d-clifford-qca-js/

## Mathematical Background

The simulator implements a 1D Clifford Quantum Cellular Automaton, where:

* Each cell state is represented by a Pauli operator (I, X, Z, or Y)
* The evolution is governed by a local update rule in the form of a 2×6 matrix over F₂
* The global update preserves the Clifford group structure
* Periodic boundary conditions are applied

### Local Rule Matrix Structure

The local rule is specified by a 2×6 matrix over F₂ (binary field with elements {0,1}), which can be understood as three 2×2 blocks:

```
[A_left | A_center | A_right]
```

where each block determines how a cell's new state depends on its left neighbor (A_left), itself (A_center), and its right neighbor (A_right).

Each cell's state is encoded as a pair of bits (x,z) ∈ F₂² representing Pauli operators:

* I = (0,0)
* X = (1,0)
* Z = (0,1)
* Y = (1,1)

The matrix multiplication is performed modulo 2, ensuring the output remains in F₂.

## Getting Started

### Prerequisites

* Node.js (v14+)
* npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/1d-clifford-qca-js.git
cd 1d-clifford-qca-js
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

The application will be available at http://localhost:1234.

## Usage

1. Adjust the number of cells and time steps
2. Set the local rule matrix (2×6 over F₂)
3. Choose an initial state configuration
4. Click "Run Simulation" to watch the QCA evolution in the spacetime diagram

## Building for Production

To build the application for production:

```
npm run build
```

The optimized files will be output to the `dist` directory.

## Credits

This project is a JavaScript implementation based on [Florian Richter's Python Clifford QCA Simulator](https://github.com/Florian2Richter/clifford-qca-1d).

## License

This project is licensed under the MIT License - see the LICENSE file for details. 