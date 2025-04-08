// src/components/Cell.js
import React, { memo, useMemo } from 'react';
import '../styles/Cell.css';
import gameConfig from '../utils/gameConfig';

/**
 * Componente Cell - Renderiza una celda individual del tablero de juego
 */
const Cell = ({ 
  cell, 
  x, 
  y, 
  onCellClick, 
  highlightPath, 
  adventurers = [],
  onMouseDown,
  onMouseEnter,
  onMouseUp, 
  isRoom = false,
  isHall = false 
}) => {
  // Calcular clases CSS para la celda
  const classNames = useMemo(() => {
    const classes = ['cell'];
    
    if (!cell) {
      classes.push('empty');
    } else {
      classes.push(cell.type);
      
      // Añadir clases para habitaciones y salas
      if (isRoom) classes.push('room');
      if (isHall) classes.push('hall');
      
      // Si es parte del camino resaltado
      if (highlightPath && highlightPath.some(pos => pos.x === x && pos.y === y)) {
        classes.push('highlight-path');
      }
      
      // Añadir clase para entidades muertas
      if (cell.type === 'monster' && cell.item?.isDead) {
        classes.push('dead');
      } else if (cell.type === 'trap' && cell.item?.isTriggered) {
        classes.push('triggered');
      }
    }
    
    return classes.join(' ');
  }, [cell, isRoom, isHall, highlightPath, x, y]);
  
  // Filtrar aventureros en esta celda
  const cellAdventurers = useMemo(() => {
    return adventurers.filter(a => !a.isDead && a.position.x === x && a.position.y === y);
  }, [adventurers, x, y]);
  
  // Determinar el contenido principal de la celda
  const { content, cellDetails } = useMemo(() => {
    let cellContent = null;
    let details = null;
    
    if (!cell) {
      return { content: null, cellDetails: null };
    }
    
    switch (cell.type) {
      case 'player':
        cellContent = '👑';
        details = (
          <div className="cell-details player-details">
            <div>Jefe Final</div>
          </div>
        );
        break;
        
      case 'entrance':
        cellContent = '🚪';
        details = (
          <div className="cell-details entrance-details">
            <div>Entrada</div>
          </div>
        );
        break;
        
      case 'monster':
        if (cell.item) {
          const monster = cell.item;
          cellContent = monster.isDead ? '💀' : (monster.emoji || '👾');
          
          // Barra de salud para monstruos
          const healthPercent = Math.max(0, Math.min(100, (monster.health / monster.maxHealth) * 100));
          const healthBarClass = healthPercent <= 25 ? 'health-critical' : 
                               healthPercent <= 50 ? 'health-warning' : 'health-good';
          
          // Nivel con color
          const levelColor = gameConfig.utils.getLevelColor(monster.level);
          
          details = (
            <div className="cell-details monster-details">
              <div className="monster-name">
                {monster.name} 
                <span className="level-indicator" style={{ backgroundColor: levelColor }}>
                  Nv.{monster.level}
                </span>
              </div>
              
              <div className="health-bar-container" role="progressbar" 
                  aria-valuemin="0" aria-valuemax={monster.maxHealth} aria-valuenow={monster.health}
                  aria-label={`Salud: ${monster.health} de ${monster.maxHealth}`}>
                <div className={`health-bar ${healthBarClass}`} style={{ width: `${healthPercent}%` }}></div>
                <span className="health-text">{monster.health}/{monster.maxHealth}</span>
              </div>
              
              <div className="monster-stats">
                <span title="Salud">❤️ {monster.health}/{monster.maxHealth}</span>
                <span title="Daño">⚔️ {monster.damage}</span>
                {monster.defense > 0 && <span title="Defensa">🛡️ {monster.defense}</span>}
              </div>
              
              {monster.cooldown > 0 && (
                <div className="cooldown-info">Recarga: {monster.cooldown} {monster.cooldown === 1 ? 'turno' : 'turnos'}</div>
              )}
              
              {isRoom && <div className="buff-info">+15% daño</div>}
              {isHall && <div className="buff-info">+20% daño, +10% salud</div>}
              
              {monster.specialTrait && (
                <div className="trait-info">{getTraitDescription(monster.specialTrait)}</div>
              )}
            </div>
          );
        }
        break;
        
      case 'trap':
        if (cell.item) {
          const trap = cell.item;
          cellContent = trap.isTriggered ? '✓' : (trap.emoji || '⚠️');
          
          // Nivel con color
          const levelColor = gameConfig.utils.getLevelColor(trap.level);
          
          details = (
            <div className="cell-details trap-details">
              <div className="trap-name">
                {trap.name} 
                <span className="level-indicator" style={{ backgroundColor: levelColor }}>
                  Nv.{trap.level}
                </span>
              </div>
              
              <div className="trap-stats">
                <span title="Daño">💥 {trap.damage}</span>
                <span title="Usos restantes">🔄 {trap.remainingUses} usos</span>
                {trap.rearmTime > 0 && (
                  <span title="Tiempo de recarga">⏱️ {trap.rearmTime} {trap.rearmTime === 1 ? 'turno' : 'turnos'}</span>
                )}
              </div>
              
              {trap.effects && trap.effects.length > 0 && (
                <div className="trap-effects">
                  {trap.effects.map(effect => (
                    <span key={effect} className="effect-tag">{formatEffectName(effect)}</span>
                  ))}
                </div>
              )}
              
              {trap.isTriggered && <div className="status-info">Desactivada</div>}
            </div>
          );
        }
        break;
        
      case 'path':
        // Para caminos que son parte de habitación o sala
        if (isRoom) {
          cellContent = '🏠';
          details = (
            <div className="cell-details room-details">
              <div>Habitación (2x2)</div>
              <div className="buff-info">+15% daño para monstruos</div>
            </div>
          );
        } else if (isHall) {
          cellContent = '🏛️';
          details = (
            <div className="cell-details hall-details">
              <div>Sala (3x3)</div>
              <div className="buff-info">+20% daño, +10% salud para monstruos</div>
              <div className="debuff-info">-15% velocidad para aventureros</div>
            </div>
          );
        }
        break;
        
      default:
        break;
    }
    
    return { content: cellContent, cellDetails: details };
  }, [cell, isRoom, isHall]);
  
  // Renderizar aventureros si hay alguno en esta celda
  const adventurerContent = useMemo(() => {
    if (!cellAdventurers.length) return null;
    
    // Mostrar el primer aventurero y un indicador de cantidad si hay más
    const primaryAdventurer = cellAdventurers[0];
    
    // Emoji según la clase
    let classEmoji = getAdventurerEmoji(primaryAdventurer.class);
    
    // Detalles del aventurero
    let details = null;
    
    if (cellAdventurers.length === 1) {
      const healthPercent = Math.max(0, Math.min(100, (primaryAdventurer.health / primaryAdventurer.maxHealth) * 100));
      const healthBarClass = healthPercent <= 25 ? 'health-critical' : 
                           healthPercent <= 50 ? 'health-warning' : 'health-good';
                           
      details = (
        <div className="cell-details adventurer-details">
          <div className="adventurer-name">{primaryAdventurer.name}</div>
          <div className="adventurer-class">{primaryAdventurer.class}</div>
          
          <div className="health-bar-container" role="progressbar" 
              aria-valuemin="0" aria-valuemax={primaryAdventurer.maxHealth} aria-valuenow={primaryAdventurer.health}
              aria-label={`Salud: ${primaryAdventurer.health} de ${primaryAdventurer.maxHealth}`}>
            <div className={`health-bar ${healthBarClass}`} style={{ width: `${healthPercent}%` }}></div>
            <span className="health-text">{primaryAdventurer.health}/{primaryAdventurer.maxHealth}</span>
          </div>
          
          <div className="adventurer-stats">
            <span title="Salud">❤️ {primaryAdventurer.health}/{primaryAdventurer.maxHealth}</span>
            <span title="Daño">⚔️ {primaryAdventurer.damage}</span>
            {primaryAdventurer.defense > 0 && <span title="Defensa">🛡️ {primaryAdventurer.defense}</span>}
          </div>
          
          {isHall && <div className="debuff-info">-15% velocidad</div>}
          
          {/* Mostrar efectos de estado si hay alguno */}
          {primaryAdventurer.statusEffects && Object.keys(primaryAdventurer.statusEffects).length > 0 && (
            <div className="status-effects">
              {Object.entries(primaryAdventurer.statusEffects).map(([effect, value]) => 
                value > 0 && (
                  <div key={effect} className="status-effect">
                    {formatEffectName(effect)}: {value} {value === 1 ? 'turno' : 'turnos'}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );
    } else if (cellAdventurers.length > 1) {
      details = (
        <div className="cell-details adventurer-group-details">
          <div className="adventurer-count-text">{cellAdventurers.length} aventureros</div>
          <div className="adventurer-classes">
            {[...new Set(cellAdventurers.map(a => a.class))].join(', ')}
          </div>
          
          <div className="group-health">
            {cellAdventurers.map((adv, i) => (
              <div key={i} className="mini-health-bar-container">
                <div className="mini-health-bar" 
                    style={{ width: `${(adv.health / adv.maxHealth) * 100}%` }}></div>
              </div>
            ))}
          </div>
          
          {isHall && <div className="debuff-info">-15% velocidad</div>}
        </div>
      );
    }
    
    return {
      icon: (
        <div className="adventurer-container">
          <div className="adventurer-icon">{classEmoji}</div>
          {cellAdventurers.length > 1 && (
            <div className="adventurer-count">+{cellAdventurers.length - 1}</div>
          )}
        </div>
      ),
      details: details
    };
  }, [cellAdventurers, isHall]);
  
  // Determinar qué detalles mostrar (priorizar aventureros sobre contenido de celda)
  const displayDetails = adventurerContent?.details || cellDetails;
  
  // Manejar eventos de interacción
  const handleClick = () => onCellClick && onCellClick(x, y);
  const handleMouseDown = () => onMouseDown && onMouseDown(x, y);
  const handleMouseEnter = () => onMouseEnter && onMouseEnter(x, y);
  const handleMouseUp = () => onMouseUp && onMouseUp();
  
  return (
    <div 
      className={classNames}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      data-x={x}
      data-y={y}
      role="gridcell"
      aria-label={getCellAriaLabel()}
      tabIndex={onCellClick ? 0 : -1}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {content && <div className="cell-content">{content}</div>}
      {adventurerContent?.icon}
      {displayDetails}
    </div>
  );
  
  // Función para generar descripción accesible de la celda
  function getCellAriaLabel() {
    if (!cell) return `Celda vacía en posición ${x}, ${y}`;
    
    let label = '';
    
    switch (cell.type) {
      case 'player':
        label = `Jefe final en posición ${x}, ${y}`;
        break;
      case 'entrance':
        label = `Entrada en posición ${x}, ${y}`;
        break;
      case 'path':
        label = `Camino en posición ${x}, ${y}`;
        if (isRoom) label = `Habitación en posición ${x}, ${y}`;
        if (isHall) label = `Sala en posición ${x}, ${y}`;
        break;
      case 'monster':
        if (cell.item) {
          label = `${cell.item.name} nivel ${cell.item.level} con ${cell.item.health} de ${cell.item.maxHealth} puntos de vida en posición ${x}, ${y}`;
          if (cell.item.isDead) label = `${cell.item.name} derrotado en posición ${x}, ${y}`;
        } else {
          label = `Monstruo en posición ${x}, ${y}`;
        }
        break;
      case 'trap':
        if (cell.item) {
          label = `${cell.item.name} nivel ${cell.item.level} en posición ${x}, ${y}`;
          if (cell.item.isTriggered) label = `${cell.item.name} desactivada en posición ${x}, ${y}`;
        } else {
          label = `Trampa en posición ${x}, ${y}`;
        }
        break;
      default:
        label = `Celda de tipo ${cell.type} en posición ${x}, ${y}`;
    }
    
    // Añadir información de aventureros si hay
    if (cellAdventurers.length === 1) {
      const adv = cellAdventurers[0];
      label += `. Contiene al aventurero ${adv.name}, ${adv.class} con ${adv.health} de ${adv.maxHealth} puntos de vida`;
    } else if (cellAdventurers.length > 1) {
      label += `. Contiene a ${cellAdventurers.length} aventureros`;
    }
    
    return label;
  }
};

// Funciones auxiliares

/**
 * Obtiene un emoji basado en la clase del aventurero
 */
function getAdventurerEmoji(className) {
  switch (className) {
    case 'Guerrero': return '⚔️';
    case 'Mago': return '🧙';
    case 'Ladrón': return '🥷';
    case 'Clérigo': return '🧝';
    case 'Arquero': return '🏹';
    case 'Caballero': return '🛡️';
    case 'Sacerdote': return '✝️';
    default: return '👤';
  }
}

/**
 * Formatea el nombre de un efecto para mostrar
 */
function formatEffectName(effect) {
  switch (effect) {
    case 'damage': return 'Daño';
    case 'poison': return 'Veneno';
    case 'burn': return 'Quemadura';
    case 'stun': return 'Aturdimiento';
    case 'slow': return 'Ralentizar';
    case 'silence': return 'Silencio';
    case 'trapped': return 'Atrapar';
    case 'teleport': return 'Teletransporte';
    case 'confuse': return 'Confusión';
    case 'freeze': return 'Congelación';
    default: return effect.charAt(0).toUpperCase() + effect.slice(1);
  }
}

/**
 * Obtiene la descripción de un rasgo especial de monstruo
 */
function getTraitDescription(trait) {
  switch (trait) {
    case 'regeneration': return 'Regenera salud cada turno';
    case 'poison': return 'Ataques envenenan';
    case 'burn': return 'Ataques queman';
    case 'stun': return 'Puede aturdir';
    case 'evasion': return 'Alta evasión';
    case 'undead': return 'No muerto';
    case 'berserk': return 'Frenesí al ser herido';
    case 'fireBreath': return 'Aliento de fuego';
    case 'teleport': return 'Puede teletransportarse';
    default: return trait.charAt(0).toUpperCase() + trait.slice(1);
  }
}

// Optimizar rendimiento con memo
export default memo(Cell);