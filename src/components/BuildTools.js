import React, { useState, useEffect } from 'react';
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
  
  // Filtrar solo monstruos y trampas desbloqueados
  const unlockedMonsters = availableMonsters.filter(monster => monster.unlocked);
  const unlockedTraps = availableTraps.filter(trap => trap.unlocked);
  
  // Callback para seleccionar un monstruo
  const handleSelectMonster = (monster) => {
    setSelectedItem(monster);
    setSelectedTool('monster');
  };
  
  // Callback para seleccionar una trampa
  const handleSelectTrap = (trap) => {
    setSelectedItem(trap);
    setSelectedTool('trap');
  };
  
  // Callback para mejorar un monstruo
  const handleUpgradeMonster = (e, monster) => {
    e.stopPropagation(); // Evitar seleccionar el monstruo al hacer clic en mejorar
    upgradeMonster(monster.id);
  };
  
  // Callback para mejorar una trampa
  const handleUpgradeTrap = (e, trap) => {
    e.stopPropagation(); // Evitar seleccionar la trampa al hacer clic en mejorar
    upgradeTrap(trap.id);
  };
  
  // Verificar si hay suficiente oro para comprar un item
  const canAfford = (item) => {
    return gold >= item.cost;
  };
  
  // Verificar si hay suficiente experiencia para mejorar
  const canUpgrade = (item) => {
    return (
      item.level < item.maxLevel && 
      experience >= item.getUpgradeCost()
    );
  };

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'monsters':
        return (
          <div className="selector-content">
            <h4 className="section-title">Monstruos</h4>
            {unlockedMonsters.length === 0 ? (
              <div className="no-items-message">
                No hay monstruos disponibles aún. Continúa avanzando para desbloquear nuevos monstruos.
              </div>
            ) : (
              <div className="items-grid-horizontal">
                {unlockedMonsters.map(monster => (
                  <div 
                    key={monster.id}
                    className={`item-card-horizontal ${selectedItem && selectedItem.id === monster.id && selectedTool === 'monster' ? 'selected' : ''} ${!canAfford(monster) ? 'unaffordable' : ''}`}
                    onClick={() => handleSelectMonster(monster)}
                  >
                    <div className="item-card-header-horizontal">
                      <div className="item-emoji">{monster.emoji}</div>
                      <div className="item-info">
                        <div className="item-name">{monster.name}</div>
                        <div className="item-level">Nivel {monster.level}</div>
                      </div>
                    </div>
                    
                    <div className="item-card-body-horizontal">
                      <div className="item-quick-stats">
                        <div className="stat">
                          <span className="stat-icon">❤️</span>
                          <span className="stat-value">{monster.health}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">⚔️</span>
                          <span className="stat-value">{monster.damage}</span>
                        </div>
                        <div className="stat cost-stat">
                          <span className="stat-icon">💰</span>
                          <span className={`stat-value ${!canAfford(monster) ? 'unaffordable' : ''}`}>
                            {monster.cost}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="item-card-footer-horizontal">
                      <button 
                        className={`upgrade-button ${!canUpgrade(monster) ? 'disabled' : ''}`}
                        onClick={(e) => handleUpgradeMonster(e, monster)}
                        disabled={!canUpgrade(monster)}
                      >
                        {monster.level >= monster.maxLevel ? (
                          'Nivel Máximo'
                        ) : (
                          <>
                            Mejorar ({monster.getUpgradeCost()} <span className="exp-icon">✨</span>)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'traps':
        return (
          <div className="selector-content">
            <h4 className="section-title">Trampas</h4>
            {unlockedTraps.length === 0 ? (
              <div className="no-items-message">
                No hay trampas disponibles aún. Continúa avanzando para desbloquear nuevas trampas.
              </div>
            ) : (
              <div className="items-grid-horizontal">
                {unlockedTraps.map(trap => (
                  <div 
                    key={trap.id}
                    className={`item-card-horizontal ${selectedItem && selectedItem.id === trap.id && selectedTool === 'trap' ? 'selected' : ''} ${!canAfford(trap) ? 'unaffordable' : ''}`}
                    onClick={() => handleSelectTrap(trap)}
                  >
                    <div className="item-card-header-horizontal">
                      <div className="item-emoji">{trap.emoji}</div>
                      <div className="item-info">
                        <div className="item-name">{trap.name}</div>
                        <div className="item-level">Nivel {trap.level}</div>
                      </div>
                    </div>
                    
                    <div className="item-card-body-horizontal">
                      <div className="item-quick-stats">
                        <div className="stat">
                          <span className="stat-icon">💥</span>
                          <span className="stat-value">{trap.damage}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">🔄</span>
                          <span className="stat-value">{trap.remainingUses}</span>
                        </div>
                        <div className="stat cost-stat">
                          <span className="stat-icon">💰</span>
                          <span className={`stat-value ${!canAfford(trap) ? 'unaffordable' : ''}`}>
                            {trap.cost}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="item-card-footer-horizontal">
                      <button 
                        className={`upgrade-button ${!canUpgrade(trap) ? 'disabled' : ''}`}
                        onClick={(e) => handleUpgradeTrap(e, trap)}
                        disabled={!canUpgrade(trap)}
                      >
                        {trap.level >= trap.maxLevel ? (
                          'Nivel Máximo'
                        ) : (
                          <>
                            Mejorar ({trap.getUpgradeCost()} <span className="exp-icon">✨</span>)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'zones':
        return (
          <div className="selector-content">
            <h4 className="section-title">Zonas</h4>
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
          </div>
        );
        
      default:
        return (
          <div className="selector-content">
            <div className="no-items-message">
              Selecciona una categoría para ver elementos disponibles.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="build-tools-new" role="region" aria-label="Herramientas de construcción">
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
      
      <div className="tools-content-new">
        <div className="tool-sidebar-new">
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
              onClick={() => { handleToolSelect('monster'); setActiveTab('monsters'); }}
              aria-pressed={selectedTool === 'monster'}
              aria-label="Colocar monstruo"
              title="Coloca monstruos para defender tu mazmorra"
            >
              <span className="tool-icon" role="img" aria-hidden="true">👾</span>
            </button>
            
            <button 
              className={`tool-button ${selectedTool === 'trap' ? 'selected' : ''}`}
              onClick={() => { handleToolSelect('trap'); setActiveTab('traps'); }}
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
        
        <div className="selector-container">
          <div className="selector-tabs">
            <button 
              className={`tab-button ${activeTab === 'monsters' ? 'active' : ''}`}
              onClick={() => { setActiveTab('monsters'); setSelectedTool('monster'); }}
            >
              Monstruos
            </button>
            <button 
              className={`tab-button ${activeTab === 'traps' ? 'active' : ''}`}
              onClick={() => { setActiveTab('traps'); setSelectedTool('trap'); }}
            >
              Trampas
            </button>
            <button 
              className={`tab-button ${activeTab === 'zones' ? 'active' : ''}`}
              onClick={() => { setActiveTab('zones'); setSelectedTool('room'); }}
            >
              Zonas
            </button>
          </div>
          
          {renderContent()}
        </div>
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