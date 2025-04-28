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
                <div className="header-content">
                    <h1>
                        <span className="header-prefix">Simulation of</span>
                        <span className="header-highlight"> 1D Clifford Automata</span>
                    </h1>
                    <p>Interactive exploration of quantum information propagation in 1D lattices</p>
                </div>
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
    defaultExpanded = true,
    style = {}
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    
    const toggleExpanded = () => {
        if (collapsible) {
            setIsExpanded(!isExpanded);
        }
    };
    
    return (
        <section className="app-section" style={style}>
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

/**
 * Three-column layout for controls, visualization, and information
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.leftColumn - Content for left column
 * @param {React.ReactNode} props.centerColumn - Content for center column
 * @param {React.ReactNode} props.rightColumn - Content for right column
 */
export function ThreeColumnLayout({ leftColumn, centerColumn, rightColumn }) {
    const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
    
    return (
        <div className="three-column-layout" style={{ 
            width: '100%',
            display: 'grid',
            gridTemplateColumns: `${leftSidebarCollapsed ? '60px' : '300px'} 1fr ${rightSidebarCollapsed ? '60px' : '350px'}`,
            gap: '10px'
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
                    onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                >
                    <span 
                        style={{ 
                            transition: 'transform 0.3s',
                            transform: leftSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                            fontSize: '1rem'
                        }}
                    >
                        ◀
                    </span>
                </div>
                
                <div style={{ 
                    display: leftSidebarCollapsed ? 'none' : 'block',
                    opacity: leftSidebarCollapsed ? 0 : 1,
                    transition: 'opacity 0.3s'
                }}>
                    {leftColumn}
                </div>
                
                {leftSidebarCollapsed && (
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
            
            <div className="center-column">
                {centerColumn}
            </div>
            
            <div className="right-column" style={{ 
                transition: 'width 0.3s',
                position: 'relative'
            }}>
                <div 
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '-15px',
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
                    onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                >
                    <span 
                        style={{ 
                            transition: 'transform 0.3s',
                            transform: rightSidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                            fontSize: '1rem'
                        }}
                    >
                        ◀
                    </span>
                </div>
                
                <div style={{ 
                    display: rightSidebarCollapsed ? 'none' : 'block',
                    opacity: rightSidebarCollapsed ? 0 : 1,
                    transition: 'opacity 0.3s'
                }}>
                    {rightColumn}
                </div>
                
                {rightSidebarCollapsed && (
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
                        About
                    </div>
                )}
            </div>
        </div>
    );
}

/* Add a style tag for additional CSS classes */
const styles = document.createElement('style');
styles.innerHTML = `
    .info-panel {
        background: #f5f5f5;
        border-radius: 6px;
        padding: 12px 16px;
        margin-top: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .info-panel p {
        margin: 8px 0;
        display: flex;
        justify-content: space-between;
    }
    
    .info-panel strong {
        font-weight: 600;
        color: #333;
    }
`;
document.head.appendChild(styles); 