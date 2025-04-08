// src/components/BuildTools.js
import React, { useState, useEffect } from 'react';
import MonsterSelector from './MonsterSelector';
import TrapSelector from './TrapSelector';
import '../styles/BuildTools.css';

const BuildTools = ({ 
  selectedTool, 
  setSelectedTool, 
  selectedItem, 
  setSelectedItem,
  availableMonsters,
  availableTraps,
  gold,
  experience,
  upgradeMonster,
  upgradeTrap,
  startBattle,
  day,
  roomCost = 50,
  hallCost = 150
}) => {
  const [activeTab, setActiveTab] = useState('monsters');
  const [showTips, setShowTips] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  
  // Lista de consejos para mostrar al usuario
  const tips = [
    "Coloca monstruos estratégicamente para maximizar su efectividad",
    "Las habitaciones aumentan el daño de los monstruos en un 15%",
    "Las salas aumentan el daño en un 20% y la salud en un 10%",
    "Los caminos deben estar conectados desde la entrada hasta el jefe final",
    "Combina trampas y monstruos para crear defensas efectivas"
  ];
  
  // Rotar consejos automáticamente
  useEffect(() => {
    if (showTips) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [showTips, tips.length]);
  
  // Callback para cuando se selecciona una herramienta
  const handleToolSelect = (tool) => {
    // Si ya está seleccionada, no hacer nada
    if (tool === selectedTool) return;
    
    setSelectedTool(tool);
    setSelectedItem(null);
    
    // Si es monstruo o trampa, activar la pestaña correspondiente
    if (tool === 'monster') {
      setActiveTab('monsters');
    } else if (tool === 'trap') {
      setActiveTab('traps');
    }
  };

  // Verificar si hay suficiente oro para las estructuras
  const canAffordRoom = gold >= roomCost;
  const canAffordHall = gold >= hallCost;
  
  // Activar tab correspondiente cuando se selecciona herramienta
  useEffect(() => {
    if (selectedTool === 'monster') {
      setActiveTab('monsters');
    } else if (selectedTool === 'trap') {
      setActiveTab('traps');
    }
  }, [selectedTool]);

  return (
    <div className="build-tools" role="region" aria-label="Herramientas de construcción">
      <div className="tools-header">
        <h3>Día {day} - Construye tu Mazmorra</h3>
        <div className="resources">
          <div className="resource" title="Oro disponible">
            <span className="resource-icon" role="img" aria-label="Oro">💰</span>
            <span className="resource-value">{gold}</span>
          </div>
          <div className="resource" title="Experiencia disponible">
            <span className="resource-icon" role="img" aria-label="Experiencia">✨</span>
            <span className="resource-value">{experience}</span>
          </div>
        </div>
      </div>
      
      <div className="tools-content">
        <div className="tool-buttons" role="toolbar" aria-label="Herramientas disponibles">
          <button 
            className={`tool-button ${selectedTool === 'path' ? 'selected' : ''}`}
            onClick={() => handleToolSelect('path')}
            aria-pressed={selectedTool === 'path'}
            aria-label="Crear camino"
            title="Coloca caminos que conecten la entrada con el jefe final"
          >
            <span className="tool-icon" role="img" aria-hidden="true">🛣️</span>
            <span className="tool-name">Camino</span>
          </button>
          
          <button 
            className={`tool-button ${selectedTool === 'room' ? 'selected' : ''} ${!canAffordRoom ? 'disabled' : ''}`}
            onClick={() => canAffordRoom && handleToolSelect('room')}
            disabled={!canAffordRoom}
            aria-pressed={selectedTool === 'room'}
            aria-label={`Crear habitación por ${roomCost} de oro`}
            title={canAffordRoom ? `Crea una habitación 2x2 que mejora a tus monstruos` : `Necesitas ${roomCost} de oro para construir una habitación`}
          >
            <span className="tool-icon" role="img" aria-hidden="true">🏠</span>
            <span className="tool-name">Habitación</span>
            <span className="tool-cost">{roomCost}💰</span>
          </button>
          
          <button 
            className={`tool-button ${selectedTool === 'hall' ? 'selected' : ''} ${!canAffordHall ? 'disabled' : ''}`}
            onClick={() => canAffordHall && handleToolSelect('hall')}
            disabled={!canAffordHall}
            aria-pressed={selectedTool === 'hall'}
            aria-label={`Crear sala por ${hallCost} de oro`}
            title={canAffordHall ? `Crea una sala 3x3 con mayores bonificaciones` : `Necesitas ${hallCost} de oro para construir una sala`}
          >
            <span className="tool-icon" role="img" aria-hidden="true">🏛️</span>
            <span className="tool-name">Sala</span>
            <span className="tool-cost">{hallCost}💰</span>
          </button>
          
          <button 
            className={`tool-button ${selectedTool === 'monster' ? 'selected' : ''}`}
            onClick={() => handleToolSelect('monster')}
            aria-pressed={selectedTool === 'monster'}
            aria-label="Colocar monstruo"
            title="Coloca monstruos para defender tu mazmorra"
          >
            <span className="tool-icon" role="img" aria-hidden="true">👾</span>
            <span className="tool-name">Monstruo</span>
          </button>
          
          <button 
            className={`tool-button ${selectedTool === 'trap' ? 'selected' : ''}`}
            onClick={() => handleToolSelect('trap')}
            aria-pressed={selectedTool === 'trap'}
            aria-label="Colocar trampa"
            title="Coloca trampas para dañar a los aventureros"
          >
            <span className="tool-icon" role="img" aria-hidden="true">⚠️</span>
            <span className="tool-name">Trampa</span>
          </button>
          
          <button 
            className={`tool-button ${selectedTool === 'delete' ? 'selected' : ''}`}
            onClick={() => handleToolSelect('delete')}
            aria-pressed={selectedTool === 'delete'}
            aria-label="Borrar elementos"
            title="Elimina elementos de la mazmorra"
          >
            <span className="tool-icon" role="img" aria-hidden="true">🗑️</span>
            <span className="tool-name">Borrar</span>
          </button>
        </div>
        
        {/* Información de herramientas */}
        {selectedTool === 'room' && (
          <div className="tool-info-panel" role="region" aria-label="Información sobre habitaciones">
            <div className="tool-info">
              <h4>Habitación (2x2)</h4>
              <p>Crea un espacio fortificado de 2x2 que otorga bonificaciones a tus monstruos.</p>
              <ul>
                <li>Coste: {roomCost} oro</li>
                <li>Monstruos: +15% de daño</li>
                <li>Requiere un espacio de 2x2 vacío o con caminos</li>
              </ul>
            </div>
          </div>
        )}
        
        {selectedTool === 'hall' && (
          <div className="tool-info-panel" role="region" aria-label="Información sobre salas">
            <div className="tool-info">
              <h4>Sala (3x3)</h4>
              <p>Crea un espacio más grande de 3x3 con mayores bonificaciones y efectos contra aventureros.</p>
              <ul>
                <li>Coste: {hallCost} oro</li>
                <li>Monstruos: +20% de daño, +10% de salud</li>
                <li>Aventureros: -15% de velocidad</li>
                <li>Requiere un espacio de 3x3 vacío o con caminos</li>
              </ul>
            </div>
          </div>
        )}
        
        {(selectedTool === 'monster' || selectedTool === 'trap') && (
          <div className="selector-tabs" role="tablist">
            <button 
              className={`tab ${activeTab === 'monsters' ? 'active' : ''}`}
              onClick={() => { setActiveTab('monsters'); setSelectedTool('monster'); }}
              role="tab"
              aria-selected={activeTab === 'monsters'}
              id="tab-monsters"
              aria-controls="panel-monsters"
            >
              Monstruos
            </button>
            <button 
              className={`tab ${activeTab === 'traps' ? 'active' : ''}`}
              onClick={() => { setActiveTab('traps'); setSelectedTool('trap'); }}
              role="tab"
              aria-selected={activeTab === 'traps'}
              id="tab-traps"
              aria-controls="panel-traps"
            >
              Trampas
            </button>
          </div>
        )}
        
        {selectedTool === 'monster' && activeTab === 'monsters' && (
          <div 
            id="panel-monsters" 
            role="tabpanel" 
            aria-labelledby="tab-monsters"
            className="selector-panel"
          >
            <MonsterSelector 
              monsters={availableMonsters}
              selectedMonsterId={selectedItem?.id}
              onSelectMonster={setSelectedItem}
              onUpgradeMonster={upgradeMonster}
              gold={gold}
              experience={experience}
            />
          </div>
        )}
        
        {selectedTool === 'trap' && activeTab === 'traps' && (
          <div 
            id="panel-traps" 
            role="tabpanel" 
            aria-labelledby="tab-traps"
            className="selector-panel"
          >
            <TrapSelector 
              traps={availableTraps}
              selectedTrapId={selectedItem?.id}
              onSelectTrap={setSelectedItem}
              onUpgradeTrap={upgradeTrap}
              gold={gold}
              experience={experience}
            />
          </div>
        )}
        
        {/* Panel de ayuda contextual */}
        {selectedTool === 'delete' && (
          <div className="tool-info-panel">
            <div className="tool-info">
              <h4>Herramienta de Borrado</h4>
              <p>Haz clic en elementos de la mazmorra para eliminarlos:</p>
              <ul>
                <li>Recuperas el 50% del oro invertido</li>
                <li>Para borrar habitaciones/salas, elimina primero los monstruos y trampas</li>
                <li>No puedes borrar la entrada ni al jefe final</li>
              </ul>
            </div>
          </div>
        )}
        
        {selectedTool === 'path' && (
          <div className="tool-info-panel">
            <div className="tool-info">
              <h4>Consejos para Caminos</h4>
              <p>Los caminos conectan la entrada con el jefe final. Puedes:</p>
              <ul>
                <li>Hacer clic y arrastrar para crear caminos continuos</li>
                <li>Crear formaciones de 2x2 para habitaciones</li>
                <li>Crear formaciones de 3x3 para salas</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="battle-controls">
        <button 
          className="start-battle-btn"
          onClick={startBattle}
          aria-label="Iniciar batalla con los aventureros"
        >
          ¡Iniciar Batalla!
        </button>
        
        <div className="tip-container">
          <div className="tip-header">
            <h4>Consejo</h4>
            <button 
              className="tip-toggle" 
              onClick={() => setShowTips(!showTips)}
              aria-label={showTips ? "Ocultar consejos" : "Mostrar consejos"}
            >
              {showTips ? "🔽" : "🔼"}
            </button>
          </div>
          
          {showTips && (
            <p className="battle-tip">
              {tips[currentTip]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildTools;