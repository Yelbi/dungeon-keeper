// src/components/MonsterSelector.js
import React, { useState } from 'react';
import '../styles/ItemSelector.css';

const MonsterSelector = ({ 
  monsters, 
  selectedMonsterId, 
  onSelectMonster, 
  onUpgradeMonster,
  gold,
  experience
}) => {
  const [showDetails, setShowDetails] = useState(null);
  
  // Filtrar solo monstruos desbloqueados
  const unlockedMonsters = monsters.filter(monster => monster.unlocked);
  
  // Callback para seleccionar un monstruo
  const handleSelectMonster = (monster) => {
    onSelectMonster(monster);
  };
  
  // Callback para mejorar un monstruo
  const handleUpgradeMonster = (e, monster) => {
    e.stopPropagation(); // Evitar seleccionar el monstruo al hacer clic en mejorar
    onUpgradeMonster(monster.id);
  };
  
  // Verificar si hay suficiente oro para comprar un monstruo
  const canAfford = (monster) => {
    return gold >= monster.cost;
  };
  
  // Verificar si hay suficiente experiencia para mejorar un monstruo
  const canUpgrade = (monster) => {
    return (
      monster.level < monster.maxLevel && 
      experience >= monster.getUpgradeCost()
    );
  };
  
  // Renderiza los detalles de un monstruo
  const renderMonsterDetails = (monster) => {
    if (showDetails !== monster.id) return null;
    
    return (
      <div className="monster-details-panel">
        <div className="monster-details-header">
          <h4>{monster.name}</h4>
          <span className="monster-level">Nivel {monster.level}</span>
        </div>
        <div className="monster-description">{monster.description}</div>
        <div className="monster-stats-grid">
          <div className="monster-stat">
            <span className="stat-icon">❤️</span>
            <span className="stat-label">Vida</span>
            <span className="stat-value">{monster.health}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-icon">⚔️</span>
            <span className="stat-label">Daño</span>
            <span className="stat-value">{monster.damage}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Coste</span>
            <span className="stat-value">{monster.cost}</span>
          </div>
          <div className="monster-stat">
            <span className="stat-icon">⏱️</span>
            <span className="stat-label">Velocidad</span>
            <span className="stat-value">{monster.attackSpeed} turnos</span>
          </div>
        </div>
        
        {/* Habilidades especiales */}
        <div className="monster-abilities">
          <h5>Habilidades especiales</h5>
          <ul className="abilities-list">
            {monster.criticalChance && (
              <li>
                <span className="ability-icon">🎯</span>
                <span>Golpe crítico ({Math.round(monster.criticalChance * 100)}% prob.)</span>
              </li>
            )}
            {monster.stunChance && (
              <li>
                <span className="ability-icon">💫</span>
                <span>Aturdir ({Math.round(monster.stunChance * 100)}% prob.)</span>
              </li>
            )}
            {monster.armor && (
              <li>
                <span className="ability-icon">🛡️</span>
                <span>Armadura ({monster.armor} puntos)</span>
              </li>
            )}
            {monster.regeneration && (
              <li>
                <span className="ability-icon">💖</span>
                <span>Regeneración ({monster.regeneration} por turno)</span>
              </li>
            )}
            {monster.areaAttack && (
              <li>
                <span className="ability-icon">💥</span>
                <span>Ataque de área</span>
              </li>
            )}
            {monster.physicalResistance && (
              <li>
                <span className="ability-icon">🔰</span>
                <span>Resistencia física ({Math.round(monster.physicalResistance * 100)}%)</span>
              </li>
            )}
            {monster.poisonChance && (
              <li>
                <span className="ability-icon">☠️</span>
                <span>Veneno ({Math.round(monster.poisonChance * 100)}% prob.)</span>
              </li>
            )}
            {monster.fireImmunity && (
              <li>
                <span className="ability-icon">🔥</span>
                <span>Inmunidad al fuego</span>
              </li>
            )}
            {monster.burnChance && (
              <li>
                <span className="ability-icon">🔥</span>
                <span>Quemar ({Math.round(monster.burnChance * 100)}% prob.)</span>
              </li>
            )}
            {monster.fireBreath && (
              <li>
                <span className="ability-icon">🐉</span>
                <span>Aliento de fuego (×{monster.fireBreathDamage / monster.damage} daño)</span>
              </li>
            )}
          </ul>
        </div>
        
        {/* Mejora */}
        {monster.level < monster.maxLevel && (
          <div className="monster-upgrade-info">
            <h5>Próxima mejora (Nivel {monster.level + 1})</h5>
            <div className="upgrade-preview">
              <div>
                <span className="stat-icon">❤️</span>
                <span className="current-value">{monster.health}</span>
                <span className="arrow">→</span>
                <span className="upgraded-value">{Math.floor(monster.health * 1.5)}</span>
              </div>
              <div>
                <span className="stat-icon">⚔️</span>
                <span className="current-value">{monster.damage}</span>
                <span className="arrow">→</span>
                <span className="upgraded-value">{Math.floor(monster.damage * 1.3)}</span>
              </div>
            </div>
            <div className="upgrade-cost">
              <span>Coste: {monster.getUpgradeCost()} EXP</span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Renderiza la lista de monstruos
  return (
    <div className="monster-selector">
      {unlockedMonsters.length === 0 ? (
        <div className="no-items-message">
          No hay monstruos disponibles aún. Continúa avanzando para desbloquear nuevos monstruos.
        </div>
      ) : (
        <div className="monsters-grid">
          {unlockedMonsters.map(monster => (
            <div 
              key={monster.id}
              className={`monster-card ${selectedMonsterId === monster.id ? 'selected' : ''} ${!canAfford(monster) ? 'unaffordable' : ''}`}
              onClick={() => handleSelectMonster(monster)}
            >
              <div className="monster-card-header">
                <div className="monster-emoji">{monster.emoji}</div>
                <div className="monster-info">
                  <div className="monster-name">{monster.name}</div>
                  <div className="monster-level">Nivel {monster.level}</div>
                </div>
                <button 
                  className="details-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(showDetails === monster.id ? null : monster.id);
                  }}
                >
                  {showDetails === monster.id ? '▼' : 'ℹ️'}
                </button>
              </div>
              
              <div className="monster-card-body">
                <div className="monster-quick-stats">
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
                
                {renderMonsterDetails(monster)}
              </div>
              
              <div className="monster-card-footer">
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
};

export default MonsterSelector;