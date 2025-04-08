// src/components/BuildTools.js (Versión Final)
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
  
  // Callback para cuando se selecciona una herramienta
  const handleToolSelect = (tool) => {
    // Si ya está seleccionada, no hacer nada
    if (tool === selectedTool) return;
    
    setSelectedTool(tool);
    setSelectedItem(null);
    
    // Establecer la pestaña activa según la herramienta
    if (tool === 'monster') {
      setActiveTab('monsters');
    } else if (tool === 'trap') {
      setActiveTab('traps');
    } else if (tool === 'room' || tool === 'hall') {
      setActiveTab('zones');
    }
  };

  // Verificar si hay suficiente oro para las estructuras
  const canAffordRoom = gold >= roomCost;
  const canAffordHall = gold >= hallCost;
  
  // Renderizar el panel de zonas
  const renderZonesPanel = () => {
    return (
      <div className="zones-panel">
        <div className="zone-card" onClick={() => canAffordRoom && handleToolSelect('room')}>
          <div className="zone-card-header">
            <div className="zone-emoji">🏠</div>
            <div className="zone-info">
              <div className="zone-name">Habitación</div>
              <div className="zone-size">Tamaño 2x2</div>
            </div>
          </div>
          
          <div className="zone-card-body">
            <div className="zone-description">
              <p>Crea un espacio fortificado que otorga bonificaciones a tus monstruos.</p>
            </div>
            
            <div className="zone-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">⚔️</span>
                <span className="benefit-text">+15% daño para monstruos</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🛡️</span>
                <span className="benefit-text">+10% defensa para monstruos</span>
              </div>
            </div>
            
            <div className="zone-cost">
              <span className="cost-label">Coste:</span>
              <span className={`cost-value ${!canAffordRoom ? 'unaffordable' : ''}`}>
                {roomCost} <span className="cost-icon">💰</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="zone-card" onClick={() => canAffordHall && handleToolSelect('hall')}>
          <div className="zone-card-header">
            <div className="zone-emoji">🏛️</div>
            <div className="zone-info">
              <div className="zone-name">Sala</div>
              <div className="zone-size">Tamaño 3x3</div>
            </div>
          </div>
          
          <div className="zone-card-body">
            <div className="zone-description">
              <p>Crea un espacio más grande con mayores bonificaciones y efectos contra aventureros.</p>
            </div>
            
            <div className="zone-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">⚔️</span>
                <span className="benefit-text">+20% daño para monstruos</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">❤️</span>
                <span className="benefit-text">+10% salud para monstruos</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🐢</span>
                <span className="benefit-text">-15% velocidad para aventureros</span>
              </div>
            </div>
            
            <div className="zone-cost">
              <span className="cost-label">Coste:</span>
              <span className={`cost-value ${!canAffordHall ? 'unaffordable' : ''}`}>
                {hallCost} <span className="cost-icon">💰</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar el contenido según la herramienta seleccionada
  const renderToolContent = () => {
    if ((selectedTool === 'room' || selectedTool === 'hall')) {
      return (
        <div className="selector-sidebar">
          <div className="selector-tabs">
            <div 
              className={`tab ${activeTab === 'monsters' ? 'active' : ''}`}
              onClick={() => { setActiveTab('monsters'); setSelectedTool('monster'); }}
            >
              Monstruos
            </div>
            <div 
              className={`tab ${activeTab === 'traps' ? 'active' : ''}`}
              onClick={() => { setActiveTab('traps'); setSelectedTool('trap'); }}
            >
              Trampas
            </div>
            <div 
              className={`tab ${activeTab === 'zones' ? 'active' : ''}`}
              onClick={() => { setActiveTab('zones'); }}
            >
              Zonas
            </div>
          </div>
          
          <div className="selector-panel">
            {renderZonesPanel()}
          </div>
        </div>
      );
    }
    
    if (selectedTool === 'monster' || activeTab === 'monsters') {
      return (
        <div className="selector-sidebar">
          <div className="selector-tabs">
            <div 
              className={`tab ${activeTab === 'monsters' ? 'active' : ''}`}
              onClick={() => { setActiveTab('monsters'); setSelectedTool('monster'); }}
            >
              Monstruos
            </div>
            <div 
              className={`tab ${activeTab === 'traps' ? 'active' : ''}`}
              onClick={() => { setActiveTab('traps'); setSelectedTool('trap'); }}
            >
              Trampas
            </div>
            <div 
              className={`tab ${activeTab === 'zones' ? 'active' : ''}`}
              onClick={() => { setActiveTab('zones'); selectedTool === 'monster' && setSelectedTool('room'); }}
            >
              Zonas
            </div>
          </div>
          
          <div className="selector-panel">
            <MonsterSelector 
              monsters={availableMonsters}
              selectedMonsterId={selectedItem?.id}
              onSelectMonster={setSelectedItem}
              onUpgradeMonster={upgradeMonster}
              gold={gold}
              experience={experience}
            />
          </div>
        </div>
      );
    }
    
    if (selectedTool === 'trap' || activeTab === 'traps') {
      return (
        <div className="selector-sidebar">
          <div className="selector-tabs">
            <div 
              className={`tab ${activeTab === 'monsters' ? 'active' : ''}`}
              onClick={() => { setActiveTab('monsters'); setSelectedTool('monster'); }}
            >
              Monstruos
            </div>
            <div 
              className={`tab ${activeTab === 'traps' ? 'active' : ''}`}
              onClick={() => { setActiveTab('traps'); setSelectedTool('trap'); }}
            >
              Trampas
            </div>
            <div 
              className={`tab ${activeTab === 'zones' ? 'active' : ''}`}
              onClick={() => { setActiveTab('zones'); selectedTool === 'trap' && setSelectedTool('room'); }}
            >
              Zonas
            </div>
          </div>
          
          <div className="selector-panel">
            <TrapSelector 
              traps={availableTraps}
              selectedTrapId={selectedItem?.id}
              onSelectTrap={setSelectedItem}
              onUpgradeTrap={upgradeTrap}
              gold={gold}
              experience={experience}
            />
          </div>
        </div>
      );
    }
    
    // Para otras herramientas, mostrar consejos generales
    return (
      <div className="tool-help">
        <h3>Consejos para Caminos</h3>
        <p>Los caminos conectan la entrada con el jefe final. Puedes:</p>
        <ul>
          <li>Hacer clic y arrastrar para crear caminos continuos</li>
          <li>Crear formaciones de 2x2 para habitaciones</li>
          <li>Crear formaciones de 3x3 para salas</li>
        </ul>
      </div>
    );
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
            </button>
            
            {/* Zona button simplificado */}
            <button 
              className={`tool-button ${activeTab === 'zones' ? 'selected' : ''}`}
              onClick={() => { setActiveTab('zones'); setSelectedTool('room'); }}
              aria-pressed={activeTab === 'zones'}
              aria-label="Crear zona"
              title="Crea habitaciones o salas para mejorar a tus monstruos"
            >
              <span className="tool-icon" role="img" aria-hidden="true">🏗️</span>
            </button>
            
            <button 
              className={`tool-button ${selectedTool === 'monster' ? 'selected' : ''}`}
              onClick={() => handleToolSelect('monster')}
              aria-pressed={selectedTool === 'monster'}
              aria-label="Colocar monstruo"
              title="Coloca monstruos para defender tu mazmorra"
            >
              <span className="tool-icon" role="img" aria-hidden="true">👾</span>
            </button>
            
            <button 
              className={`tool-button ${selectedTool === 'trap' ? 'selected' : ''}`}
              onClick={() => handleToolSelect('trap')}
              aria-pressed={selectedTool === 'trap'}
              aria-label="Colocar trampa"
              title="Coloca trampas para dañar a los aventureros"
            >
              <span className="tool-icon" role="img" aria-hidden="true">⚠️</span>
            </button>
            
            <button 
              className={`tool-button ${selectedTool === 'delete' ? 'selected' : ''}`}
              onClick={() => handleToolSelect('delete')}
              aria-pressed={selectedTool === 'delete'}
              aria-label="Borrar elementos"
              title="Elimina elementos de la mazmorra"
            >
              <span className="tool-icon" role="img" aria-hidden="true">🗑️</span>
            </button>
          </div>
        </div>
        
        {renderToolContent()}
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