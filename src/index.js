/**
 * Main entry point for the 1D Clifford QCA Simulator
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import './styles.css';

// Render the application
const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />); 