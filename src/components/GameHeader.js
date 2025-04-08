// src/components/GameHeader.js
import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameHeader.css';

const GameHeader = ({ 
  day, 
  gold, 
  experience, 
  message, 
  difficulty, 
  setDifficulty,
  gamePhase
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState('legend');
  const [isMessageNew, setIsMessageNew] = useState(false);

  // Mapear dificultad a texto legible
  const difficultyInfo = {
    easy: {
      name: 'Fácil',
      description: 'Menos aventureros, más oro y experiencia',
      color: '#5cb85c' // Verde
    },
    normal: {
      name: 'Normal',
      description: 'Experiencia equilibrada',
      color: '#5bc0de' // Azul
    },
    hard: {
      name: 'Difícil',
      description: 'Más aventureros, menos oro',
      color: '#f0ad4e' // Naranja
    },
    nightmare: {
      name: 'Pesadilla',
      description: 'Hordas de aventureros muy fuertes',
      color: '#d9534f' // Rojo
    }
  };
  
  // Solo permitir cambiar la dificultad en la fase de construcción del día 1
  const canChangeDifficulty = gamePhase === 'build' && day === 1;
  
  // Detectar cambios en el mensaje para animarlo
  useEffect(() => {
    setIsMessageNew(true);
    const timer = setTimeout(() => {
      setIsMessageNew(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <header className={`game-header ${gamePhase === 'battle' ? 'battle-phase' : ''}`}>
      <div className="game-title">
        <h1>Dungeon Keeper</h1>
      </div>
      
      <div className="message-display" role="status" aria-live="polite">
        <div className={`message-content ${isMessageNew ? 'new-message' : ''}`}>{message}</div>
      </div>
      
      <div className="header-actions">
        {/* Difficulty display */}
        {canChangeDifficulty ? (
          <div className="difficulty-selector">
            <select 
              id="difficulty-select" 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label="Seleccionar dificultad"
            >
              {Object.entries(difficultyInfo).map(([key, info]) => (
                <option key={key} value={key}>{info.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="difficulty-display">
            <span 
              className="difficulty-value" 
              style={{ backgroundColor: difficultyInfo[difficulty].color }}
            >
              {difficultyInfo[difficulty].name}
            </span>
          </div>
        )}
        
        <button 
          className="help-button" 
          title="Mostrar ayuda"
          onClick={() => setIsHelpOpen(true)}
        >
          <span role="img" aria-hidden="true">❓</span>
          <span className="visually-hidden">Ayuda</span>
        </button>
      </div>
      
      {/* Help overlay */}
      <div className={`help-overlay ${isHelpOpen ? 'visible' : ''}`}>
        <div className="help-content">
          <button 
            className="help-close"
            onClick={() => setIsHelpOpen(false)}
          >
            ✕
          </button>
          
          <div className="help-tabs">
            <div 
              className={`help-tab ${activeHelpTab === 'legend' ? 'active' : ''}`}
              onClick={() => setActiveHelpTab('legend')}
            >
              Leyenda
            </div>
            <div 
              className={`help-tab ${activeHelpTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveHelpTab('stats')}
            >
              Estadísticas
            </div>
            <div 
              className={`help-tab ${activeHelpTab === 'tips' ? 'active' : ''}`}
              onClick={() => setActiveHelpTab('tips')}
            >
              Consejos
            </div>
          </div>
          
          <div className={`help-tab-content ${activeHelpTab === 'legend' ? 'active' : ''}`}>
            <h3 className="legend-title">Leyenda</h3>
            <div className="legend-grid">
              <div className="legend-item">
                <div className="legend-icon entrance">🚪</div>
                <div className="legend-text">Entrada</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon player">👑</div>
                <div className="legend-text">Jefe Final</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon path"></div>
                <div className="legend-text">Camino</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon room">🏠</div>
                <div className="legend-text">Habitación</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon hall">🏛️</div>
                <div className="legend-text">Sala</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon monster">👾</div>
                <div className="legend-text">Monstruo</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon trap">⚠️</div>
                <div className="legend-text">Trampa</div>
              </div>
              <div className="legend-item">
                <div className="legend-icon highlight-path"></div>
                <div className="legend-text">Ruta actual</div>
              </div>
            </div>
          </div>
          
          <div className={`help-tab-content ${activeHelpTab === 'stats' ? 'active' : ''}`}>
            <h3 className="stats-title">Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Caminos:</span>
                <span className="stat-value">{/* pathsCount */}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Monstruos:</span>
                <span className="stat-value">{/* monstersCount */}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trampas:</span>
                <span className="stat-value">{/* trapsCount */}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Habitaciones:</span>
                <span className="stat-value">{/* roomCount */}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Salas:</span>
                <span className="stat-value">{/* hallCount */}</span>
              </div>
              <div className="stat-item total">
                <span className="stat-label">Total celdas:</span>
                <span className="stat-value">{/* totalCells */}</span>
              </div>
            </div>
          </div>
          
          <div className={`help-tab-content ${activeHelpTab === 'tips' ? 'active' : ''}`}>
            <h3 className="tips-title">Consejos</h3>
            <ul className="tips-list">
              <li>Coloca monstruos estratégicamente para maximizar su efectividad</li>
              <li>Las habitaciones aumentan el daño de los monstruos en un 15%</li>
              <li>Las salas aumentan el daño en un 20% y la salud en un 10%</li>
              <li>Los caminos deben estar conectados desde la entrada hasta el jefe final</li>
              <li>Combina trampas y monstruos para crear defensas efectivas</li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;