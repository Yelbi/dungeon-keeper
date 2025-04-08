// src/components/TrapSelector.js
import React, { useState } from 'react';
import '../styles/ItemSelector.css';

const TrapSelector = ({ 
  traps, 
  selectedTrapId, 
  onSelectTrap, 
  onUpgradeTrap,
  gold,
  experience
}) => {
  const [showDetails, setShowDetails] = useState(null);
  
  // Filtrar solo trampas desbloqueadas
  const unlockedTraps = traps.filter(trap => trap.unlocked);
  
  // Callback para seleccionar una trampa
  const handleSelectTrap = (trap) => {
    onSelectTrap(trap);
  };
  
  // Callback para mejorar una trampa
  const handleUpgradeTrap = (e, trap) => {
    e.stopPropagation(); // Evitar seleccionar la trampa al hacer clic en mejorar
    onUpgradeTrap(trap.id);
  };
  
  // Verificar si hay suficiente oro para comprar una trampa
  const canAfford = (trap) => {
    return gold >= trap.cost;
  };
  
  // Verificar si hay suficiente experiencia para mejorar una trampa
  const canUpgrade = (trap) => {
    return (
      trap.level < trap.maxLevel && 
      experience >= trap.getUpgradeCost()
    );
  };
  
  // Renderiza los detalles de una trampa
  const renderTrapDetails = (trap) => {
    if (showDetails !== trap.id) return null;
    
    return (
      <div className="trap-details-panel">
        <div className="trap-details-header">
          <h4>{trap.name}</h4>
          <span className="trap-level">Nivel {trap.level}</span>
        </div>
        <div className="trap-description">{trap.description}</div>
        <div className="trap-stats-grid">
          <div className="trap-stat">
            <span className="stat-icon">💥</span>
            <span className="stat-label">Daño</span>
            <span className="stat-value">{trap.damage}</span>
          </div>
          <div className="trap-stat">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Coste</span>
            <span className="stat-value">{trap.cost}</span>
          </div>
          <div className="trap-stat">
            <span className="stat-icon">🎯</span>
            <span className="stat-label">Activación</span>
            <span className="stat-value">{Math.round(trap.triggerChance * 100)}%</span>
          </div>
          <div className="trap-stat">
            <span className="stat-icon">🔄</span>
            <span className="stat-label">Usos</span>
            <span className="stat-value">{trap.remainingUses}</span>
          </div>
        </div>
        
        {/* Efectos especiales */}
        <div className="trap-effects">
          <h5>Efectos especiales</h5>
          <ul className="effects-list">
            {trap.effectType === 'damage' && (
              <li>
                <span className="effect-icon">💥</span>
                <span>Daño directo</span>
              </li>
            )}
            {trap.effectType === 'trap' && (
              <li>
                <span className="effect-icon">🕸️</span>
                <span>Atrapa durante {trap.trapDuration} turnos</span>
              </li>
            )}
            {trap.effectType === 'area' && (
              <li>
                <span className="effect-icon">💥</span>
                <span>Daño en área (radio: {trap.areaRange})</span>
              </li>
            )}
            {trap.effectType === 'poison' && (
              <li>
                <span className="effect-icon">☠️</span>
                <span>Envenena durante {trap.poisonDuration} turnos ({trap.poisonDamage} daño/turno)</span>
              </li>
            )}
            {trap.effectType === 'crush' && (
              <li>
                <span className="effect-icon">🧱</span>
                <span>Daño aplastante (×{trap.crushDamage / trap.damage}) y aturde {trap.stunDuration} turno(s)</span>
              </li>
            )}
            {trap.effectType === 'slow' && (
              <li>
                <span className="effect-icon">❄️</span>
                <span>Ralentiza durante {trap.slowDuration} turnos</span>
              </li>
            )}
            {trap.effectType === 'arcane' && (
              <li>
                <span className="effect-icon">✨</span>
                <span>Efecto aleatorio (Daño/Trampa/Veneno/Ralentización)</span>
              </li>
            )}
            <li>
              <span className="effect-icon">🔄</span>
              <span>Probabilidad de rearmarse: {Math.round(trap.reset * 100)}%</span>
            </li>
          </ul>
        </div>
        
        {/* Mejora */}
        {trap.level < trap.maxLevel && (
          <div className="trap-upgrade-info">
            <h5>Próxima mejora (Nivel {trap.level + 1})</h5>
            <div className="upgrade-preview">
              <div>
                <span className="stat-icon">💥</span>
                <span className="current-value">{trap.damage}</span>
                <span className="arrow">→</span>
                <span className="upgraded-value">{Math.floor(trap.damage * 1.4)}</span>
              </div>
              <div>
                <span className="stat-icon">🔄</span>
                <span className="current-value">{trap.remainingUses}</span>
                <span className="arrow">→</span>
                <span className="upgraded-value">{trap.level + 2}</span>
              </div>
              <div>
                <span className="stat-icon">🔄</span>
                <span className="current-value">{Math.round(trap.reset * 100)}%</span>
                <span className="arrow">→</span>
                <span className="upgraded-value">{Math.min(95, Math.round((trap.reset + 0.1) * 100))}%</span>
              </div>
            </div>
            <div className="upgrade-cost">
              <span>Coste: {trap.getUpgradeCost()} EXP</span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Renderiza la lista de trampas
  return (
    <div className="trap-selector">
      {unlockedTraps.length === 0 ? (
        <div className="no-items-message">
          No hay trampas disponibles aún. Continúa avanzando para desbloquear nuevas trampas.
        </div>
      ) : (
        <div className="traps-grid">
          {unlockedTraps.map(trap => (
            <div 
              key={trap.id}
              className={`trap-card ${selectedTrapId === trap.id ? 'selected' : ''} ${!canAfford(trap) ? 'unaffordable' : ''}`}
              onClick={() => handleSelectTrap(trap)}
            >
              <div className="trap-card-header">
                <div className="trap-emoji">{trap.emoji}</div>
                <div className="trap-info">
                  <div className="trap-name">{trap.name}</div>
                  <div className="trap-level">Nivel {trap.level}</div>
                </div>
                <button 
                  className="details-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(showDetails === trap.id ? null : trap.id);
                  }}
                >
                  {showDetails === trap.id ? '▼' : 'ℹ️'}
                </button>
              </div>
              
              <div className="trap-card-body">
                <div className="trap-quick-stats">
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
                
                {renderTrapDetails(trap)}
              </div>
              
              <div className="trap-card-footer">
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
};

export default TrapSelector;