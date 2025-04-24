/**
 * Main layout components for the 1D Clifford QCA simulator
 * 
 * This module provides the main layout structure for the application.
 */
import React from 'react';

/**
 * Main application layout
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components
 */
export function MainLayout({ children }) {
    return (
        <div className="main-layout" style={{ width: '100%', boxSizing: 'border-box' }}>
            <header className="app-header">
                <h1>1D Clifford QCA Simulator</h1>
                <p>Interactive simulation of 1-Dimensional Clifford Quantum Cellular Automata</p>
            </header>
            
            <main className="app-main">
                {children}
            </main>
            
            <footer className="app-footer">
                <p>Based on <a href="https://github.com/Florian2Richter/clifford-qca-1d" target="_blank" rel="noopener noreferrer">Florian Richter's Python implementation</a></p>
            </footer>
        </div>
    );
}

/**
 * Section component for organizing content
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Section title
 * @param {React.ReactNode} props.children - Child components
 */
export function Section({ title, children }) {
    return (
        <section className="app-section">
            {title && <h2 className="section-title">{title}</h2>}
            <div className="section-content">
                {children}
            </div>
        </section>
    );
}

/**
 * Two-column layout for controls and visualization
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.leftColumn - Content for left column
 * @param {React.ReactNode} props.rightColumn - Content for right column
 */
export function TwoColumnLayout({ leftColumn, rightColumn }) {
    return (
        <div className="two-column-layout" style={{ width: '100%' }}>
            <div className="left-column">
                {leftColumn}
            </div>
            <div className="right-column">
                {rightColumn}
            </div>
        </div>
    );
} 