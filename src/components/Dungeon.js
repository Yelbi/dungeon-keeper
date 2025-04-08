// src/components/Dungeon.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Cell from './Cell';
import PathFinder from '../models/PathFinder';
import '../styles/Dungeon.css';

/**
 * Componente Dungeon - Renderiza el tablero de juego completo
 */
const Dungeon = ({ 
  dungeon, 
  gamePhase, 
  selectedTool, 
  selectedItem, 
  onCellClick,
  onContinuousPathPlace,
  adventurers = [],
  rooms = [],
  halls = []
}) => {
  const [highlightPath, setHighlightPath] = useState(null);
  const [pathFinder, setPathFinder] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastProcessedCell, setLastProcessedCell] = useState(null);
  const [validPath, setValidPath] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  
  // Inicializar el buscador de caminos cuando cambia el dungeon
  useEffect(() => {
    if (dungeon) {
      const newPathFinder = new PathFinder(dungeon);
      setPathFinder(newPathFinder);
      
      // Verificar si el camino es válido
      const { entrance, player } = findPositions();
      if (entrance && player) {
        const path = newPathFinder.findPath(entrance, player);
        setValidPath(!!path);
      }
    }
  }, [dungeon]);
  
  // Encontrar la entrada y el jugador
  const findPositions = useCallback(() => {
    let entrance = null;
    let player = null;
    
    if (!dungeon || !dungeon.length) return { entrance, player };
    
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        const cell = dungeon[y][x];
        if (cell) {
          if (cell.type === 'entrance') {
            entrance = { x, y };
          } else if (cell.type === 'player') {
            player = { x, y };
          }
        }
        
        // Si ya encontramos ambos, podemos salir del bucle
        if (entrance && player) break;
      }
      if (entrance && player) break;
    }
    
    return { entrance, player };
  }, [dungeon]);
  
  // Mostrar el camino actual
  useEffect(() => {
    if (pathFinder && gamePhase === 'build') {
      const { entrance, player } = findPositions();
      
      if (entrance && player) {
        const path = pathFinder.findPath(entrance, player);
        setHighlightPath(path);
        setValidPath(!!path);
      }
    } else {
      setHighlightPath(null);
    }
  }, [dungeon, pathFinder, gamePhase, findPositions]);
  
  // Handlers para construcción continua (memoizados)
  const handleMouseDown = useCallback((x, y) => {
    if (gamePhase !== 'build' || selectedTool !== 'path') return;
    
    setIsDragging(true);
    setLastProcessedCell({x, y});
    onCellClick(x, y); // Procesar la celda inicial
  }, [gamePhase, selectedTool, onCellClick]);
  
  const handleMouseEnter = useCallback((x, y) => {
    // Actualizar celda hover para todos los modos
    setHoveredCell({ x, y });
    
    // Procesar arrastre solo para caminos
    if (!isDragging || selectedTool !== 'path') return;
    
    // Evitar procesar la misma celda múltiples veces
    if (lastProcessedCell && lastProcessedCell.x === x && lastProcessedCell.y === y) return;
    
    setLastProcessedCell({x, y});
    onContinuousPathPlace && onContinuousPathPlace(x, y);
  }, [isDragging, selectedTool, lastProcessedCell, onContinuousPathPlace]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastProcessedCell(null);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);
  
  // Verificar si una celda es parte de una habitación o sala (memoizado)
  const cellStructures = useMemo(() => {
    if (!dungeon) return [];
    
    const structures = [];
    const height = dungeon.length;
    const width = height > 0 ? dungeon[0].length : 0;
    
    for (let y = 0; y < height; y++) {
      structures.push([]);
      for (let x = 0; x < width; x++) {
        structures[y].push({
          isRoom: rooms.some(room => 
            x >= room.x && x < room.x + 2 && 
            y >= room.y && y < room.y + 2
          ),
          isHall: halls.some(hall => 
            x >= hall.x && x < hall.x + 3 && 
            y >= hall.y && y < hall.y + 3
          )
        });
      }
    }
    
    return structures;
  }, [dungeon, rooms, halls]);
  
  // Estadísticas de la mazmorra
  const dungeonStats = useMemo(() => {
    if (!dungeon) return null;
    
    let pathCount = 0;
    let monsterCount = 0;
    let trapCount = 0;
    
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        const cell = dungeon[y][x];
        if (cell) {
          if (cell.type === 'path') pathCount++;
          else if (cell.type === 'monster') monsterCount++;
          else if (cell.type === 'trap') trapCount++;
        }
      }
    }
    
    return {
      pathCount,
      monsterCount,
      trapCount,
      roomCount: rooms.length,
      hallCount: halls.length,
      totalCells: pathCount + monsterCount + trapCount + 2 // +2 por entrada y jefe
    };
  }, [dungeon, rooms.length, halls.length]);
  
  // Si no hay dungeon, mostrar pantalla de carga
  if (!dungeon || dungeon.length === 0) {
    return (
      <div className="dungeon-container">
        <div className="dungeon-loading">
          <div className="loading-spinner"></div>
          <p>Cargando mazmorra...</p>
        </div>
      </div>
    );
  }
  
  // Determinar clases CSS para el contenedor principal
  const dungeonClasses = ['dungeon', gamePhase];
  if (!validPath && gamePhase === 'build') {
    dungeonClasses.push('invalid-path');
  }
  if (isDragging) {
    dungeonClasses.push('dragging');
  }
  
  return (
    <div className="dungeon-container">
      <div 
        className={dungeonClasses.join(' ')} 
        role="grid"
        aria-label="Tablero de mazmorra"
        onMouseLeave={handleMouseLeave}
      >
        {dungeon.map((row, y) => (
          <div key={`row-${y}`} className="dungeon-row" role="row">
            {row.map((cell, x) => (
              <Cell
                key={`cell-${x}-${y}`}
                cell={cell}
                x={x}
                y={y}
                onCellClick={() => onCellClick(x, y)}
                onMouseDown={() => handleMouseDown(x, y)}
                onMouseEnter={() => handleMouseEnter(x, y)}
                onMouseUp={handleMouseUp}
                highlightPath={highlightPath}
                adventurers={adventurers}
                isRoom={cellStructures[y][x].isRoom}
                isHall={cellStructures[y][x].isHall}
              />
            ))}
          </div>
        ))}
        
        {/* Overlay informativo durante la fase de construcción */}
        {gamePhase === 'build' && selectedTool && (
          <div className="construction-overlay">
            <div className="selected-tool-info">
              <span className="tool-icon">{getToolIcon(selectedTool)}</span>
              <span className="tool-name">{getToolName(selectedTool)}</span>
              {selectedItem && (
                <span className="selected-item-name">{selectedItem.name}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Alerta cuando no hay un camino válido */}
        {!validPath && gamePhase === 'build' && (
          <div className="invalid-path-alert">
            ⚠️ No hay un camino válido de la entrada al jefe final
          </div>
        )}
      </div>
      
      {/* Panel lateral con información */}
      <div className="dungeon-info-panel">
        {/* Leyenda del mapa */}
        {gamePhase === 'build' && (
          <div className="dungeon-legend">
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
        )}
        
        {/* Estadísticas de la mazmorra */}
        {gamePhase === 'build' && dungeonStats && (
          <div className="dungeon-stats">
            <h3 className="stats-title">Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Caminos:</span>
                <span className="stat-value">{dungeonStats.pathCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Monstruos:</span>
                <span className="stat-value">{dungeonStats.monsterCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trampas:</span>
                <span className="stat-value">{dungeonStats.trapCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Habitaciones:</span>
                <span className="stat-value">{dungeonStats.roomCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Salas:</span>
                <span className="stat-value">{dungeonStats.hallCount}</span>
              </div>
              <div className="stat-item total">
                <span className="stat-label">Total celdas:</span>
                <span className="stat-value">{dungeonStats.totalCells}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Información de la batalla */}
        {gamePhase === 'battle' && (
          <div className="battle-info">
            <h3 className="battle-info-title">Batalla en curso</h3>
            
            <div className="adventurers-info">
              <h4>Aventureros</h4>
              <div className="adventurers-count">
                <span className="alive">
                  Vivos: {adventurers.filter(a => !a.isDead).length}
                </span>
                <span className="separator">/</span>
                <span className="total">
                  {adventurers.length}
                </span>
              </div>
              
              {/* Lista de aventureros */}
              <div className="adventurers-list">
                {adventurers.map(adv => (
                  <div 
                    key={adv.id} 
                    className={`adventurer-item ${adv.isDead ? 'dead' : ''}`}
                    title={`${adv.name} (${adv.class}) - ${adv.health}/${adv.maxHealth} HP`}
                  >
                    <span className="adv-icon">{getAdventurerEmoji(adv.class)}</span>
                    <div className="adv-health-bar" 
                      style={{width: `${adv.isDead ? 0 : (adv.health / adv.maxHealth) * 100}%`}}></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="battle-controls">
              <div className="battle-tip">
                <p>💡 Los aventureros seguirán siempre el camino más corto hacia el jefe final.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Ayuda contextual basada en la herramienta seleccionada */}
        {gamePhase === 'build' && selectedTool && (
          <div className="tool-help">
            <h3>Controles</h3>
            <p>{getToolHelp(selectedTool)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Obtiene un icono para la herramienta seleccionada
 */
function getToolIcon(tool) {
  switch (tool) {
    case 'path': return '🛣️';
    case 'room': return '🏠';
    case 'hall': return '🏛️'; 
    case 'monster': return '👾';
    case 'trap': return '⚠️';
    case 'delete': return '🗑️';
    default: return '🛠️';
  }
}

/**
 * Obtiene un nombre legible para la herramienta
 */
function getToolName(tool) {
  switch (tool) {
    case 'path': return 'Camino';
    case 'room': return 'Habitación';
    case 'hall': return 'Sala';
    case 'monster': return 'Monstruo';
    case 'trap': return 'Trampa';
    case 'delete': return 'Borrar';
    default: return 'Herramienta';
  }
}

/**
 * Obtiene texto de ayuda para la herramienta
 */
function getToolHelp(tool) {
  switch (tool) {
    case 'path':
      return 'Haz clic y arrastra para dibujar caminos. Los caminos deben conectar la entrada con el jefe final.';
    case 'room':
      return 'Haz clic para crear una habitación (2x2) que aumenta el daño de los monstruos en un 15%.';
    case 'hall':
      return 'Haz clic para crear una sala (3x3) que mejora a los monstruos y ralentiza a los aventureros.';
    case 'monster':
      return 'Selecciona un monstruo y haz clic en un camino para colocarlo. Los monstruos atacan a los aventureros.';
    case 'trap':
      return 'Selecciona una trampa y haz clic en un camino para colocarla. Las trampas dañan o debilitan a los aventureros.';
    case 'delete':
      return 'Haz clic en un elemento para eliminarlo y recuperar parte de su coste.';
    default:
      return 'Selecciona una herramienta para comenzar a construir tu mazmorra.';
  }
}

/**
 * Obtiene un emoji para la clase de aventurero
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

export default Dungeon;