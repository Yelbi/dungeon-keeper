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
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  
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
  
  // Manejar selección de zona (habitación o sala)
  const handleZoneSelect = (type) => {
    if (type === 'room' && !canAffordRoom) return;
    if (type === 'hall' && !canAffordHall) return;
    
    handleToolSelect(type);
    setIsZoneDropdownOpen(false);
  };

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
        <div className="tool-sidebar">
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
            
            {/* Zone button (combines Room and Hall) */}
            <div className="zone-button">
              <button 
                className={`tool-button ${selectedTool === 'room' || selectedTool === 'hall' ? 'selected' : ''}`}
                onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                aria-pressed={selectedTool === 'room' || selectedTool === 'hall'}
                aria-label="Crear zona"
                title="Crea habitaciones o salas para mejorar a tus monstruos"
              >
                <span className="tool-icon" role="img" aria-hidden="true">🏗️</span>
                <span className="tool-name">Zona</span>
              </button>
              
              <div className={`zone-dropdown ${isZoneDropdownOpen ? 'open' : ''}`}>
                <div 
                  className={`zone-option ${!canAffordRoom ? 'disabled' : ''}`}
                  onClick={() => handleZoneSelect('room')}
                >
                  <span className="zone-icon">🏠</span>
                  <span className="zone-name">Habitación ({roomCost}💰)</span>
                </div>
                <div 
                  className={`zone-option ${!canAffordHall ? 'disabled' : ''}`}
                  onClick={() => handleZoneSelect('hall')}
                >
                  <span className="zone-icon">🏛️</span>
                  <span className="zone-name">Sala ({hallCost}💰)</span>
                </div>
              </div>
            </div>
            
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
        </div>
        
        {/* Sidebar for selector content */}
        {(selectedTool === 'monster' || selectedTool === 'trap') && (
          <div className="selector-sidebar">
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
          </div>
        )}
        
        {/* Display tool info for other tools */}
        {selectedTool === 'delete' && !activeTab && (
          <div className="selector-sidebar">
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
          </div>
        )}
        
        {selectedTool === 'path' && !activeTab && (
          <div className="selector-sidebar">
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
          </div>
        )}
        
        {selectedTool === 'room' && !activeTab && (
          <div className="selector-sidebar">
            <div className="tool-info-panel">
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
          </div>
        )}
        
        {selectedTool === 'hall' && !activeTab && (
          <div className="selector-sidebar">
            <div className="tool-info-panel">
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
      </div>
    </div>
  );
};

export default BuildTools;