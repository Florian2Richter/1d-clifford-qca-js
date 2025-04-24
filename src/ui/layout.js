/**
 * Main layout components for the 1D Clifford QCA simulator
 * 
 * This module provides the main layout structure for the application.
 */
import React, { useState } from 'react';

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
 * Section component with optional collapsible behavior
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Section title
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} props.collapsible - Whether the section can be collapsed
 * @param {boolean} props.defaultExpanded - Whether the section is expanded by default
 */
export function Section({ 
    title, 
    children, 
    collapsible = false, 
    defaultExpanded = true 
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    
    const toggleExpanded = () => {
        if (collapsible) {
            setIsExpanded(!isExpanded);
        }
    };
    
    return (
        <section className="app-section">
            <h2 
                className="section-title" 
                onClick={toggleExpanded}
                style={{ 
                    cursor: collapsible ? 'pointer' : 'default',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                {title}
                {collapsible && (
                    <span 
                        style={{ 
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            fontSize: '1.2rem'
                        }}
                    >
                        ▾
                    </span>
                )}
            </h2>
            
            <div 
                className="section-content"
                style={{
                    display: isExpanded ? 'block' : 'none',
                    overflow: 'hidden',
                    transition: 'height 0.3s'
                }}
            >
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    return (
        <div className="two-column-layout" style={{ 
            width: '100%',
            gridTemplateColumns: sidebarCollapsed ? '60px 1fr' : '350px 1fr'
        }}>
            <div className="left-column" style={{ 
                transition: 'width 0.3s',
                position: 'relative'
            }}>
                <div 
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '-15px',
                        width: '30px',
                        height: '30px',
                        background: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                        zIndex: 100,
                        transition: 'transform 0.3s'
                    }}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                    <span 
                        style={{ 
                            transition: 'transform 0.3s',
                            transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                            fontSize: '1rem'
                        }}
                    >
                        ◀
                    </span>
                </div>
                
                <div style={{ 
                    display: sidebarCollapsed ? 'none' : 'block',
                    opacity: sidebarCollapsed ? 0 : 1,
                    transition: 'opacity 0.3s'
                }}>
                    {leftColumn}
                </div>
                
                {sidebarCollapsed && (
                    <div style={{ 
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: 'var(--text-color-secondary)',
                        padding: '20px 0'
                    }}>
                        Controls
                    </div>
                )}
            </div>
            
            <div className="right-column">
                {rightColumn}
            </div>
        </div>
    );
} 