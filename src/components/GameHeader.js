// src/components/GameHeader.js
import React, { useState, useEffect, useRef } from 'react';
import '../styles/GameHeader.css';

/**
 * Componente GameHeader - Muestra la barra superior con información del juego
 */
const GameHeader = ({ 
  day, 
  gold, 
  experience, 
  message, 
  difficulty, 
  setDifficulty,
  gamePhase
}) => {
  // Referencias para animaciones de recursos
  const goldRef = useRef(null);
  const expRef = useRef(null);
  
  // Estados para almacenar valores previos y animar cambios
  const [prevGold, setPrevGold] = useState(gold);
  const [prevExp, setPrevExp] = useState(experience);
  const [isMessageNew, setIsMessageNew] = useState(false);
  
  // Solo permitir cambiar la dificultad en la fase de construcción del día 1
  const canChangeDifficulty = gamePhase === 'build' && day === 1;
  
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
  
  // Detectar cambios en los recursos para animarlos
  useEffect(() => {
    // Animar cambio de oro
    if (gold !== prevGold) {
      animateResourceChange(goldRef.current, gold > prevGold ? 'increase' : 'decrease');
      setPrevGold(gold);
    }
    
    // Animar cambio de experiencia
    if (experience !== prevExp) {
      animateResourceChange(expRef.current, experience > prevExp ? 'increase' : 'decrease');
      setPrevExp(experience);
    }
  }, [gold, experience, prevGold, prevExp]);
  
  // Detectar cambios en el mensaje para animarlo
  useEffect(() => {
    setIsMessageNew(true);
    const timer = setTimeout(() => {
      setIsMessageNew(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [message]);
  
  // Función para animar cambios en recursos
  const animateResourceChange = (element, changeType) => {
    if (!element) return;
    
    // Añadir clase para la animación
    element.classList.add(changeType);
    
    // Eliminar la clase después de la animación
    setTimeout(() => {
      element.classList.remove(changeType);
    }, 1000);
  };
  
  // Manejar cambio de dificultad
  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);
  };
  
  // Determinar clases para el mensaje
  const messageClasses = ['message-content'];
  if (isMessageNew) messageClasses.push('new-message');
  
  // Determinar tema para la fase actual
  const headerClasses = ['game-header'];
  if (gamePhase === 'battle') headerClasses.push('battle-phase');
  if (gamePhase === 'summary') headerClasses.push('summary-phase');
  
  return (
    <header className={headerClasses.join(' ')}>
      <div className="game-title">
        <h1>Dungeon Keeper</h1>
        
        {/* Selector de dificultad (solo en el día 1) */}
        {canChangeDifficulty ? (
          <div className="difficulty-selector">
            <label htmlFor="difficulty-select">Dificultad:</label>
            <select 
              id="difficulty-select" 
              value={difficulty}
              onChange={handleDifficultyChange}
              aria-label="Seleccionar dificultad"
            >
              {Object.entries(difficultyInfo).map(([key, info]) => (
                <option key={key} value={key}>{info.name}</option>
              ))}
            </select>
            <div className="difficulty-description">
              {difficultyInfo[difficulty].description}
            </div>
          </div>
        ) : (
          <div className="difficulty-display">
            <span className="difficulty-label">Dificultad:</span>
            <span 
              className="difficulty-value" 
              style={{ backgroundColor: difficultyInfo[difficulty].color }}
            >
              {difficultyInfo[difficulty].name}
            </span>
            
            {/* Indicador de fase */}
            <span className="phase-indicator">
              {gamePhase === 'build' && '🛠️ Fase de Construcción'}
              {gamePhase === 'battle' && '⚔️ Fase de Batalla'}
              {gamePhase === 'summary' && '📊 Resumen del Día'}
            </span>
          </div>
        )}
      </div>
      
      <div className="game-status">
        <div className="stats">
          <div className="stat-item day" title={`Día actual: ${day}`}>
            <span className="stat-icon" role="img" aria-hidden="true">📅</span>
            <span className="stat-label">Día</span>
            <span className="stat-value">{day}</span>
          </div>
          
          <div className="stat-item gold" title={`Oro disponible: ${gold}`}>
            <span className="stat-icon" role="img" aria-hidden="true">💰</span>
            <span className="stat-label">Oro</span>
            <span className="stat-value" ref={goldRef}>{gold}</span>
          </div>
          
          <div className="stat-item experience" title={`Experiencia disponible: ${experience}`}>
            <span className="stat-icon" role="img" aria-hidden="true">✨</span>
            <span className="stat-label">Exp</span>
            <span className="stat-value" ref={expRef}>{experience}</span>
          </div>
        </div>
        
        <div className="message-display" role="status" aria-live="polite">
          <div className={messageClasses.join(' ')}>{message}</div>
        </div>
      </div>
      
      {/* Botones de acciones principales según la fase */}
      <div className="header-actions">
        {gamePhase === 'build' && (
          <button 
            className="help-button" 
            title="Mostrar ayuda"
            onClick={() => showHelp()}
          >
            <span role="img" aria-hidden="true">❓</span>
            <span className="visually-hidden">Ayuda</span>
          </button>
        )}
      </div>
    </header>
  );
  
  // Función para mostrar ayuda (implementación simulada)
  function showHelp() {
    alert("Construye tu mazmorra:\n\n1. Coloca caminos para conectar la entrada con el jefe final\n2. Coloca monstruos y trampas para defender\n3. Construye habitaciones y salas para potenciar a tus monstruos\n4. Defiende tu mazmorra de los aventureros");
  }
};

export default GameHeader;