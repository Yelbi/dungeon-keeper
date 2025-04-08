// src/components/DungeonKeeperGame.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dungeon from './Dungeon';
import BuildTools from './BuildTools';
import GameHeader from './GameHeader';
import GameSummary from './GameSummary';
import GameOver from './GameOver';
import BattleLog from './BattleLog';
import Adventurer from '../models/Adventurer';
import Monster from '../models/Monster';
import Trap from '../models/Trap';
import PathFinder from '../models/PathFinder';
import BattleManager from '../utils/battleManager';
import gameConfig from '../utils/gameConfig';
import '../styles/DungeonKeeperGame.css';

const DungeonKeeperGame = () => {
  // Estados del juego
  const [day, setDay] = useState(gameConfig.initialState.day);
  const [experience, setExperience] = useState(gameConfig.initialState.experience);
  const [gold, setGold] = useState(gameConfig.initialState.gold);
  const [goldReward, setGoldReward] = useState(0);
  const [experienceReward, setExperienceReward] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [adventurers, setAdventurers] = useState([]);
  const [gamePhase, setGamePhase] = useState('build'); // build, battle, summary
  const [message, setMessage] = useState('¡Día 1: Construye tu mazmorra!');
  const [battleLog, setBattleLog] = useState([]);
  const [difficulty, setDifficulty] = useState('normal');
  const [rooms, setRooms] = useState([]);
  const [halls, setHalls] = useState([]);
  const [battleSpeed, setBattleSpeed] = useState(1);
  
  // Constantes que podrían moverse a gameConfig para mayor flexibilidad
  const roomCost = 50;
  const hallCost = 150;
  
  // Tablero de juego
  const boardWidth = gameConfig.board.width;
  const boardHeight = gameConfig.board.height;
  const [dungeon, setDungeon] = useState(
    Array(boardHeight).fill().map(() => Array(boardWidth).fill(null))
  );
  
  // Posiciones clave
  const [playerPosition] = useState(gameConfig.board.playerPosition);
  const [entrancePosition] = useState(gameConfig.board.entrancePosition);
  
  // Elementos disponibles
  const [availableMonsters, setAvailableMonsters] = useState([]);
  const [availableTraps, setAvailableTraps] = useState([]);
  
  // Herramientas de construcción
  const [selectedTool, setSelectedTool] = useState('path');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Gestor de batallas
  const [battleManager, setBattleManager] = useState(null);
  
  // Inicialización del juego
  useEffect(() => {
    initializeGame();
  }, []);
  
  // Inicializar el juego
  const initializeGame = () => {
    // Crear una nueva mazmorra
    const newDungeon = Array(boardHeight).fill().map(() => Array(boardWidth).fill(null));
    
    // Colocar al jugador y la entrada
    newDungeon[playerPosition.y][playerPosition.x] = { type: 'player' };
    newDungeon[entrancePosition.y][entrancePosition.x] = { type: 'entrance' };
    
    // Inicializar monstruos y trampas disponibles del día 1
    const monsters = gameConfig.utils.createAvailableMonsters(1);
    const traps = gameConfig.utils.createAvailableTraps(1);
    
    setDungeon(newDungeon);
    setAvailableMonsters(monsters);
    setAvailableTraps(traps);
    setGamePhase('build');
    setMessage(`Día 1: ¡Construye tu mazmorra!`);
  };
  
  // Colocar un elemento en la mazmorra
  const placeItem = (x, y) => {
    // Validación de coordenadas
    if (x < 0 || y < 0 || x >= boardWidth || y >= boardHeight) {
      console.error("Coordenadas fuera de rango:", x, y);
      return;
    }
    
    // No permitir colocar en la entrada o en la posición del jugador
    if ((x === entrancePosition.x && y === entrancePosition.y) || 
        (x === playerPosition.x && y === playerPosition.y)) {
      setMessage('¡No puedes construir aquí!');
      return;
    }
    
    const newDungeon = [...dungeon];
    
    // Acción según la herramienta seleccionada
    switch (selectedTool) {
      case 'path':
        handlePathPlacement(x, y, newDungeon);
        break;
        
      case 'room':
        handleRoomPlacement(x, y);
        break;
        
      case 'hall':
        handleHallPlacement(x, y);
        break;
        
      case 'monster':
        handleMonsterPlacement(x, y, newDungeon);
        break;
        
      case 'trap':
        handleTrapPlacement(x, y, newDungeon);
        break;
        
      case 'delete':
        handleItemDeletion(x, y);
        break;
        
      default:
        break;
    }
  };

  // Función nueva para manejar la colocación de caminos
  const handlePathPlacement = (x, y, newDungeon) => {
    // Verificar si la celda ya tiene contenido
    if (newDungeon[y][x] !== null) {
      setMessage('Esta celda ya está ocupada');
      return;
    }
    
    // Verificar si es adyacente a un camino existente
    const hasAdjacentPath = checkAdjacentPath(x, y, newDungeon);
    
    if (!hasAdjacentPath) {
      setMessage('¡Debes construir caminos conectados!');
      return;
    }
    
    // Colocar el camino
    newDungeon[y][x] = { type: 'path' };
    setDungeon(newDungeon);
    
    // Verificar si se forma un patrón de habitación o sala
    checkForRoomPattern(x, y, newDungeon);
  };

  // Función nueva para manejar la colocación de monstruos
  const handleMonsterPlacement = (x, y, newDungeon) => {
    // Verificar si hay un monstruo seleccionado
    if (!selectedItem) {
      setMessage('Selecciona un monstruo primero');
      return;
    }
    
    // Solo colocar en caminos
    if (newDungeon[y][x]?.type !== 'path') {
      setMessage('¡Solo puedes colocar monstruos en los caminos!');
      return;
    }
    
    // Verificar si hay suficiente oro
    if (gold < selectedItem.cost) {
      setMessage('¡No tienes suficiente oro!');
      return;
    }
    
    // Crear una copia del monstruo seleccionado
    const monsterCopy = new Monster({
      ...selectedItem,
      position: { x, y }
    });
    
    // Colocar el monstruo
    newDungeon[y][x] = {
      type: 'monster',
      item: monsterCopy
    };
    
    // Restar el oro
    setGold(gold - selectedItem.cost);
    setDungeon(newDungeon);
  };
  
  // Método para colocación continua de caminos
  const handleContinuousPathPlace = (x, y) => {
    // Validación de coordenadas
    if (x < 0 || y < 0 || x >= boardWidth || y >= boardHeight) {
      return; // Silenciosamente ignorar coordenadas fuera de rango
    }
    
    // Verificar posiciones inválidas
    if ((x === entrancePosition.x && y === entrancePosition.y) || 
        (x === playerPosition.x && y === playerPosition.y)) {
      return;
    }
    
    const newDungeon = [...dungeon];
    
    // Verificar si la celda ya tiene contenido
    if (newDungeon[y][x] !== null) {
      return;
    }
    
    // Verificar si es adyacente a un camino existente
    const hasAdjacentPath = checkAdjacentPath(x, y, newDungeon);
    
    if (!hasAdjacentPath) {
      return;
    }
    
    // Colocar el camino
    newDungeon[y][x] = { type: 'path' };
    setDungeon(newDungeon);
    
    // Verificar si se forma un patrón de habitación o sala
    checkForRoomPattern(x, y, newDungeon);
  };

  // Método para verificar patrones de habitación y sala
  const checkForRoomPattern = (x, y, newDungeon) => {
    // Verificar patrón de habitación 2x2
    for (let startY = Math.max(0, y - 1); startY <= y; startY++) {
      for (let startX = Math.max(0, x - 1); startX <= x; startX++) {
        // Prevenir verificación fuera de límites
        if (startX + 2 > boardWidth || startY + 2 > boardHeight) continue;
        
        if (checkRoomPattern(startX, startY, 2, newDungeon)) {
          setMessage('¡Se ha formado un patrón de habitación 2x2! Usa la herramienta de Habitación para mejorarla.');
          return;
        }
      }
    }
    
    // Verificar patrón de sala 3x3
    for (let startY = Math.max(0, y - 2); startY <= y; startY++) {
      for (let startX = Math.max(0, x - 2); startX <= x; startX++) {
        // Prevenir verificación fuera de límites
        if (startX + 3 > boardWidth || startY + 3 > boardHeight) continue;
        
        if (checkRoomPattern(startX, startY, 3, newDungeon)) {
          setMessage('¡Se ha formado un patrón de sala 3x3! Usa la herramienta de Sala para mejorarla.');
          return;
        }
      }
    }
  };

  // Verificar si existe un patrón cuadrado de n×n
  const checkRoomPattern = (startX, startY, size, dungeon) => {
    // Verificar límites
    if (startX + size > boardWidth || startY + size > boardHeight) {
      return false;
    }
    
    // Verificar que todas las celdas sean caminos
    for (let y = startY; y < startY + size; y++) {
      for (let x = startX; x < startX + size; x++) {
        // Verificar que la celda no sea la entrada o el jefe
        if ((x === entrancePosition.x && y === entrancePosition.y) || 
            (x === playerPosition.x && y === playerPosition.y)) {
          return false;
        }
        
        // Verificar que sea un camino
        if (!dungeon[y][x] || dungeon[y][x].type !== 'path') {
          return false;
        }
        
        // Verificar que no sea parte de una habitación o sala existente
        const isInRoom = rooms.some(room => 
          x >= room.x && x < room.x + 2 && 
          y >= room.y && y < room.y + 2
        );
        
        const isInHall = halls.some(hall => 
          x >= hall.x && x < hall.x + 3 && 
          y >= hall.y && y < hall.y + 3
        );
        
        if (isInRoom || isInHall) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Método para colocar una habitación
  const handleRoomPlacement = (x, y) => {
    // Verificar si hay suficiente oro
    if (gold < roomCost) {
      setMessage('¡No tienes suficiente oro para construir una habitación!');
      return;
    }
    
    // Verificar que haya espacio para una habitación 2x2
    if (x + 1 >= boardWidth || y + 1 >= boardHeight) {
      setMessage('No hay suficiente espacio para una habitación aquí.');
      return;
    }
    
    // Verificar que las celdas sean válidas
    const newDungeon = [...dungeon];
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const cell = newDungeon[y + dy][x + dx];
        
        // Debe ser un camino o estar vacío
        if (cell && cell.type !== 'path') {
          setMessage('Solo puedes construir habitaciones en caminos o espacios vacíos.');
          return;
        }
        
        // No puede ser posición del jugador o entrada
        if ((x + dx === playerPosition.x && y + dy === playerPosition.y) || 
            (x + dx === entrancePosition.x && y + dy === entrancePosition.y)) {
          setMessage('No puedes construir aquí.');
          return;
        }
      }
    }
    
    // Comprobar superposición con salas existentes
    const overlapsSalas = halls.some(hall => {
      const hallEndX = hall.x + 2;
      const hallEndY = hall.y + 2;
      const roomEndX = x + 1;
      const roomEndY = y + 1;
      
      return !(
        x > hallEndX || roomEndX < hall.x || 
        y > hallEndY || roomEndY < hall.y
      );
    });
    
    if (overlapsSalas) {
      setMessage('Esta habitación se solaparía con una sala existente.');
      return;
    }
    
    // Colocar la habitación
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        // Si no hay celda, crear un camino
        if (!newDungeon[y + dy][x + dx]) {
          newDungeon[y + dy][x + dx] = { type: 'path' };
        }
      }
    }
    
    // Registrar la habitación
    setRooms([...rooms, {x, y}]);
    
    // Descontar oro
    setGold(gold - roomCost);
    setMessage(`Has construido una habitación por ${roomCost} de oro.`);
    setDungeon(newDungeon);
  };

  // Método para colocar una sala
  const handleHallPlacement = (x, y) => {
    // Verificar si hay suficiente oro
    if (gold < hallCost) {
      setMessage('¡No tienes suficiente oro para construir una sala!');
      return;
    }
    
    // Verificar que haya espacio para una sala 3x3
    if (x + 2 >= boardWidth || y + 2 >= boardHeight) {
      setMessage('No hay suficiente espacio para una sala aquí.');
      return;
    }
    
    // Verificar que las celdas sean válidas
    const newDungeon = [...dungeon];
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const cell = newDungeon[y + dy][x + dx];
        
        // Debe ser un camino o estar vacío
        if (cell && cell.type !== 'path') {
          setMessage('Solo puedes construir salas en caminos o espacios vacíos.');
          return;
        }
        
        // No puede ser posición del jugador o entrada
        if ((x + dx === playerPosition.x && y + dy === playerPosition.y) || 
            (x + dx === entrancePosition.x && y + dy === entrancePosition.y)) {
          setMessage('No puedes construir aquí.');
          return;
        }
      }
    }
    
    // Colocar la sala
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        // Si no hay celda, crear un camino
        if (!newDungeon[y + dy][x + dx]) {
          newDungeon[y + dy][x + dx] = { type: 'path' };
        }
      }
    }
    
    // Registrar la sala
    setHalls([...halls, {x, y}]);
    
    // Descontar oro
    setGold(gold - hallCost);
    setMessage(`Has construido una sala por ${hallCost} de oro.`);
    setDungeon(newDungeon);
  };
  
  // Eliminar un elemento
  const handleItemDeletion = (x, y) => {
    // No permitir eliminar la entrada o el jugador
    if ((x === entrancePosition.x && y === entrancePosition.y) || 
        (x === playerPosition.x && y === playerPosition.y)) {
      setMessage('¡No puedes eliminar este elemento!');
      return;
    }
    
    const newDungeon = [...dungeon];
    const cell = newDungeon[y][x];
    
    // Si no hay nada que eliminar
    if (!cell) return;
    
    // Si es un monstruo o trampa dentro de una habitación/sala, solo elimina el elemento
    if (cell.type === 'monster' || cell.type === 'trap') {
      // Comprobar si está en una habitación o sala
      const isInRoom = rooms.some(room => 
        x >= room.x && x < room.x + 2 && 
        y >= room.y && y < room.y + 2
      );
      
      const isInHall = halls.some(hall => 
        x >= hall.x && x < hall.x + 3 && 
        y >= hall.y && y < hall.y + 3
      );
      
      // Devolver el 50% del coste
      const refund = Math.floor(cell.item.cost * 0.5);
      setGold(gold + refund);
      setMessage(`Has eliminado ${cell.type === 'monster' ? 'un monstruo' : 'una trampa'} y recuperado ${refund} de oro.`);
      
      // Mantener el camino con atributos de sala/habitación
      newDungeon[y][x] = { 
        type: 'path',
        // Mantener los atributos de habitación/sala si los tiene
        ...(isInRoom && { isRoom: true }),
        ...(isInHall && { isHall: true })
      };
      
      setDungeon(newDungeon);
      return;
    }
    
    // Para borrar una habitación o sala, exigir que se haga clic en una celda vacía
    // Verificar si pertenece a una habitación y es un camino (sin objetos)
    if (cell.type === 'path') {
      // Verificar habitaciones
      const roomIndex = rooms.findIndex(room => 
        x >= room.x && x < room.x + 2 && 
        y >= room.y && y < room.y + 2
      );
      
      if (roomIndex !== -1) {
        const room = rooms[roomIndex];
        
        // Verificar si hay monstruos o trampas en la habitación
        let hasObjects = false;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const cellContent = newDungeon[room.y + dy][room.x + dx];
            if (cellContent && (cellContent.type === 'monster' || cellContent.type === 'trap')) {
              hasObjects = true;
              break;
            }
          }
          if (hasObjects) break;
        }
        
        if (hasObjects) {
          setMessage('Elimina primero todos los monstruos y trampas de la habitación.');
          return;
        }
        
        // Pedir confirmación para borrar la habitación
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta habitación?")) {
          return;
        }
        
        // Si no hay objetos, eliminar la habitación
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if ((room.x + dx !== playerPosition.x || room.y + dy !== playerPosition.y) && 
                (room.x + dx !== entrancePosition.x || room.y + dy !== entrancePosition.y)) {
              newDungeon[room.y + dy][room.x + dx] = { type: 'path' };
            }
          }
        }
        
        // Devolver parte del coste
        const refund = Math.floor(roomCost * 0.5);
        setGold(gold + refund);
        setMessage(`Has eliminado una habitación y recuperado ${refund} de oro.`);
        
        // Actualizar lista de habitaciones
        const newRooms = [...rooms];
        newRooms.splice(roomIndex, 1);
        setRooms(newRooms);
        
        setDungeon(newDungeon);
        return;
      }
      
      // Verificar salas
      const hallIndex = halls.findIndex(hall => 
        x >= hall.x && x < hall.x + 3 && 
        y >= hall.y && y < hall.y + 3
      );
      
      if (hallIndex !== -1) {
        const hall = halls[hallIndex];
        
        // Verificar si hay monstruos o trampas en la sala
        let hasObjects = false;
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            const cellContent = newDungeon[hall.y + dy][hall.x + dx];
            if (cellContent && (cellContent.type === 'monster' || cellContent.type === 'trap')) {
              hasObjects = true;
              break;
            }
          }
          if (hasObjects) break;
        }
        
        if (hasObjects) {
          setMessage('Elimina primero todos los monstruos y trampas de la sala.');
          return;
        }
        
        // Pedir confirmación para borrar la sala
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta sala?")) {
          return;
        }
        
        // Si no hay objetos, eliminar la sala
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            if ((hall.x + dx !== playerPosition.x || hall.y + dy !== playerPosition.y) && 
                (hall.x + dx !== entrancePosition.x || hall.y + dy !== entrancePosition.y)) {
              newDungeon[hall.y + dy][hall.x + dx] = { type: 'path' };
            }
          }
        }
        
        // Devolver parte del coste
        const refund = Math.floor(hallCost * 0.5);
        setGold(gold + refund);
        setMessage(`Has eliminado una sala y recuperado ${refund} de oro.`);
        
        // Actualizar lista de salas
        const newHalls = [...halls];
        newHalls.splice(hallIndex, 1);
        setHalls(newHalls);
        
        setDungeon(newDungeon);
        return;
      }
    }
    
    // Si llega aquí, es una celda normal que no es parte de habitación o sala
    // Eliminar el elemento (reemplazar con un camino si no es vacío)
    if (cell.type !== 'path') {
      newDungeon[y][x] = { type: 'path' };
    } else {
      newDungeon[y][x] = null;
    }
    
    setDungeon(newDungeon);
  };
  
  // Colocar una trampa
  const handleTrapPlacement = (x, y, newDungeon) => {
    // Verificar si hay una trampa seleccionada
    if (!selectedItem) {
      setMessage('Selecciona una trampa primero');
      return;
    }
    
    // Solo colocar en caminos
    if (newDungeon[y][x]?.type !== 'path') {
      setMessage('¡Solo puedes colocar trampas en los caminos!');
      return;
    }
    
    // Verificar si hay suficiente oro
    if (gold < selectedItem.cost) {
      setMessage('¡No tienes suficiente oro!');
      return;
    }
    
    // Crear una copia de la trampa seleccionada
    const trapCopy = new Trap({
      ...selectedItem,
      position: { x, y }
    });
    
    // Colocar la trampa
    newDungeon[y][x] = {
      type: 'trap',
      item: trapCopy
    };
    
    // Restar el oro
    setGold(gold - selectedItem.cost);
    setDungeon(newDungeon);
  };
  
  // Verificar si hay un camino adyacente
  const checkAdjacentPath = (x, y, dungeon) => {
    // Comprobar las cuatro direcciones
    const directions = [
      { x: 0, y: -1 }, // arriba
      { x: 0, y: 1 },  // abajo
      { x: -1, y: 0 }, // izquierda
      { x: 1, y: 0 }   // derecha
    ];
    
    for (const dir of directions) {
      const newX = x + dir.x;
      const newY = y + dir.y;
      
      // Verificar límites
      if (newX < 0 || newY < 0 || newX >= boardWidth || newY >= boardHeight) continue;
      
      // Comprobar si hay un camino, entrada, jugador O MONSTRUO/TRAMPA
      const cell = dungeon[newY][newX];
      if (cell) {
        // Considerar monstruos y trampas como caminos válidos para la construcción
        if (cell.type === 'path' || cell.type === 'entrance' || cell.type === 'player' || 
            cell.type === 'monster' || cell.type === 'trap') {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Mejorar un monstruo
  const upgradeMonster = (monsterId) => {
    const monsterIndex = availableMonsters.findIndex(m => m.id === monsterId);
    
    if (monsterIndex === -1 || !availableMonsters[monsterIndex].unlocked) {
      setMessage('Monstruo no disponible');
      return;
    }
    
    const monster = availableMonsters[monsterIndex];
    
    // Verificar nivel máximo
    if (monster.level >= monster.maxLevel) {
      setMessage('¡Este monstruo ya está al nivel máximo!');
      return;
    }
    
    // Calcular coste de mejora
    const upgradeCost = monster.getUpgradeCost();
    
    // Verificar experiencia suficiente
    if (experience < upgradeCost) {
      setMessage('¡No tienes suficiente experiencia para esta mejora!');
      return;
    }
    
    // Crear una copia y mejorarla
    const updatedMonster = new Monster({...monster});
    updatedMonster.levelUp();
    
    // Actualizar la lista de monstruos
    const updatedMonsters = [...availableMonsters];
    updatedMonsters[monsterIndex] = updatedMonster;
    
    // Actualizar también en la mazmorra si hay monstruos de este tipo
    const newDungeon = [...dungeon];
    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const cell = newDungeon[y][x];
        if (cell && cell.type === 'monster' && cell.item.id === monsterId) {
          // Actualizar el monstruo manteniendo su salud actual como porcentaje
          const healthPercent = cell.item.health / cell.item.maxHealth;
          const updatedMonsterCopy = new Monster({...updatedMonster, position: cell.item.position});
          
          // Ajustar la salud al mismo porcentaje
          updatedMonsterCopy.health = Math.floor(updatedMonsterCopy.maxHealth * healthPercent);
          
          newDungeon[y][x] = {
            type: 'monster',
            item: updatedMonsterCopy
          };
        }
      }
    }
    
    // Actualizar estados
    setAvailableMonsters(updatedMonsters);
    setDungeon(newDungeon);
    setExperience(experience - upgradeCost);
    setMessage(`¡${monster.name} mejorado al nivel ${updatedMonster.level}!`);
  };
  
  // Mejorar una trampa
  const upgradeTrap = (trapId) => {
    const trapIndex = availableTraps.findIndex(t => t.id === trapId);
    
    if (trapIndex === -1 || !availableTraps[trapIndex].unlocked) {
      setMessage('Trampa no disponible');
      return;
    }
    
    const trap = availableTraps[trapIndex];
    
    // Verificar nivel máximo
    if (trap.level >= trap.maxLevel) {
      setMessage('¡Esta trampa ya está al nivel máximo!');
      return;
    }
    
    // Calcular coste de mejora
    const upgradeCost = trap.getUpgradeCost();
    
    // Verificar experiencia suficiente
    if (experience < upgradeCost) {
      setMessage('¡No tienes suficiente experiencia para esta mejora!');
      return;
    }
    
    // Crear una copia y mejorarla
    const updatedTrap = new Trap({...trap});
    updatedTrap.levelUp();
    
    // Actualizar la lista de trampas
    const updatedTraps = [...availableTraps];
    updatedTraps[trapIndex] = updatedTrap;
    
    // Actualizar también en la mazmorra si hay trampas de este tipo
    const newDungeon = [...dungeon];
    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const cell = newDungeon[y][x];
        if (cell && cell.type === 'trap' && cell.item.id === trapId) {
          const updatedTrapCopy = new Trap({...updatedTrap, position: cell.item.position});
          
          newDungeon[y][x] = {
            type: 'trap',
            item: updatedTrapCopy
          };
        }
      }
    }
    
    // Actualizar estados
    setAvailableTraps(updatedTraps);
    setDungeon(newDungeon);
    setExperience(experience - upgradeCost);
    setMessage(`¡${trap.name} mejorada al nivel ${updatedTrap.level}!`);
  };
  
  // Generar aventureros para el día actual
  const generateAdventurers = () => {
    const difficultySettings = gameConfig.difficulty[difficulty];
    // Determinar cuántos aventureros
    const baseCount = gameConfig.adventurers.baseCount(day);
    const adjustedCount = Math.max(1, Math.round(baseCount * difficultySettings.adventurerScaling));
    
    // Determinar niveles según distribución
    const levelDistribution = gameConfig.adventurers.levelDistribution(day);
    
    // Crear aventureros
    const newAdventurers = [];
    
    for (let i = 0; i < adjustedCount; i++) {
      // Seleccionar nivel basado en probabilidad
      let level = 1;
      const roll = Math.random();
      let cumulativeProbability = 0;
      
      for (const levelInfo of levelDistribution) {
        cumulativeProbability += levelInfo.chance;
        if (roll < cumulativeProbability) {
          level = levelInfo.level;
          break;
        }
      }
      
      // Crear un nuevo aventurero
      const adventurer = new Adventurer(i, level, day);
      
      // Colocar en la entrada
      adventurer.position = {...entrancePosition};
      
      newAdventurers.push(adventurer);
    }
    
    return newAdventurers;
  };
  
  // Iniciar la batalla
  const startBattle = () => {
    // Verificar si hay un camino válido
    const pathFinder = new PathFinder(dungeon);
    if (!pathFinder.hasValidPath()) {
      setMessage('¡Debes construir un camino completo de la entrada al jefe final!');
      return;
    }
    
    // Cambiar a fase de batalla
    setGamePhase('battle');
    setMessage('¡Los aventureros están atacando tu mazmorra!');
    setBattleLog(['¡La batalla ha comenzado!']);
    
    // Generar aventureros
    const newAdventurers = generateAdventurers();
    setAdventurers(newAdventurers);
    
    // Crear gestor de batalla
    const newBattleManager = new BattleManager(
      dungeon, 
      newAdventurers,
      handleBattleUpdate,
      { 
        rooms, 
        halls,
        currentDay: day,
        speed: battleSpeed,
        // Añadir información sobre la mazmorra para estadísticas
        monstersCount: countDungeonItems(dungeon, 'monster'),
        trapsCount: countDungeonItems(dungeon, 'trap'),
        pathsCount: countDungeonItems(dungeon, 'path')
      }
    );
    
    // Establece la velocidad después de crear el manager
    newBattleManager.adventurerMoveDelay = 500 / battleSpeed;
    newBattleManager.turnDelay = 1000 / battleSpeed;
    setBattleManager(newBattleManager);
    
    // Iniciar la batalla
    newBattleManager.startBattle();
  };

  // Cambiar velocidad de batalla
  const toggleBattleSpeed = () => {
    const newSpeed = battleSpeed === 1 ? 2 : 1;
    setBattleSpeed(newSpeed);
    
    if (battleManager) {
      // Si el battleManager ya tiene un método setSimulationSpeed
      if (typeof battleManager.setSimulationSpeed === 'function') {
        battleManager.setSimulationSpeed(newSpeed);
      } 
      // En caso contrario, actualiza directamente los delays
      else {
        battleManager.adventurerMoveDelay = 500 / newSpeed;
        battleManager.turnDelay = 1000 / newSpeed;
      }
    }
  };
  
  // Manejar actualizaciones de la batalla
  const handleBattleUpdate = useCallback((update) => {
    if (!update) {
      console.error("Error: handleBattleUpdate recibió un update indefinido");
      return;
    }
    
    // Actualizar el log de batalla
    if (update.log) {
      setBattleLog(update.log);
    }
    
    // Manejar actualización de celda
    if (update.type === 'cellUpdate' && update.x >= 0 && update.y >= 0 && 
        update.x < boardWidth && update.y < boardHeight) {
      setDungeon(prevDungeon => {
        const newDungeon = [...prevDungeon];
        newDungeon[update.y][update.x] = update.content;
        return newDungeon;
      });
    }
    
    // Manejar movimiento de aventurero
    if (update.type === 'adventurerMove' && update.adventurer && update.to) {
      setAdventurers(prevAdventurers => {
        return prevAdventurers.map(adv => 
          adv.id === update.adventurer.id 
            ? {...adv, position: update.to} 
            : adv
        );
      });
    }
    
    // Manejar fin de batalla
    if (update.type === 'victory' || update.type === 'defeat') {
      // Obtén los resultados de la batalla
      const results = update.results || {
        goldReward: 0,
        experienceReward: 0
      };
      
      // Guardar recompensas
      setGoldReward(results.goldReward);
      setExperienceReward(results.experienceReward);
      
      // Actualizar valores
      setGold(prevGold => prevGold + results.goldReward);
      setExperience(prevExp => prevExp + results.experienceReward);
      
      if (update.type === 'victory') {
        setMessage(`¡Victoria! Ganaste ${results.goldReward} oro y ${results.experienceReward} experiencia.`);
        
        // Pasar a la fase de resumen
        setGamePhase('summary');
      } else {
        setMessage(`¡Derrota! Los aventureros han alcanzado al jefe final. Ganaste ${results.goldReward} oro y ${results.experienceReward} experiencia.`);
        
        // El juego termina
        setGameOver(true);
      }
    }
  }, [boardWidth, boardHeight]);
  
  // Pasar al siguiente día
  const nextDay = () => {
    // Verificar si hemos alcanzado el máximo de días (por ejemplo, 30)
    const maxDays = gameConfig.maxDays || 30;
    if (day >= maxDays) {
      setMessage(`¡Has alcanzado el día máximo (${maxDays})! El juego ha terminado.`);
      setGameOver(true);
      return;
    }
    
    // Incrementar el día
    const newDay = day + 1;
    setDay(newDay);
    
    // Restaurar la mazmorra (reparar trampas, curar monstruos, etc.)
    const restoredDungeon = restoreDungeon();
    setDungeon(restoredDungeon);
    
    // Verificar desbloqueos de monstruos y trampas
    checkUnlocks(newDay);
    
    // Volver a la fase de construcción
    setGamePhase('build');
    setMessage(`Día ${newDay}: ¡Mejora tu mazmorra!`);
    setAdventurers([]);
    setBattleLog([]);
  };
  
  // Restaurar la mazmorra para el siguiente día
  const restoreDungeon = () => {
    const newDungeon = [...dungeon];
    
    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        const cell = newDungeon[y][x];
        
        if (cell) {
          // Restaurar monstruos
          if (cell.type === 'monster') {
            // Curar completamente al monstruo y restaurar sus cooldowns
            cell.item.health = cell.item.maxHealth;
            cell.item.isDead = false;
            cell.item.cooldown = 0;
          }
          
          // Restaurar trampas
          if (cell.type === 'trap') {
            // Rearmar trampa y restaurar usos
            cell.item.isTriggered = false;
            cell.item.remainingUses = cell.item.calculateUses();
          }
        }
      }
    }
    
    return newDungeon;
  };
  
  // Verificar desbloqueos basados en el día
  const checkUnlocks = (currentDay) => {
    // Verificar monstruos desbloqueados
    const updatedMonsters = availableMonsters.map(monster => {
      const monsterConfig = gameConfig.monsters.find(m => m.id === monster.id);
      if (!monster.unlocked && monsterConfig && currentDay >= monsterConfig.unlockDay) {
        setMessage(prevMessage => `${prevMessage} ¡Has desbloqueado ${monster.name}!`);
        return new Monster({...monster, unlocked: true});
      }
      return monster;
    });
    
    // Verificar trampas desbloqueadas
    const updatedTraps = availableTraps.map(trap => {
      const trapConfig = gameConfig.traps.find(t => t.id === trap.id);
      if (!trap.unlocked && trapConfig && currentDay >= trapConfig.unlockDay) {
        setMessage(prevMessage => `${prevMessage} ¡Has desbloqueado ${trap.name}!`);
        return new Trap({...trap, unlocked: true});
      }
      return trap;
    });
    
    setAvailableMonsters(updatedMonsters);
    setAvailableTraps(updatedTraps);
  };
  
  // Reiniciar el juego
  const restartGame = () => {
    // Pedir confirmación antes de reiniciar
    if (!window.confirm("¿Estás seguro de que quieres reiniciar el juego? Todo tu progreso se perderá.")) {
      return;
    }
    
    // Reiniciar variables de estado básicas
    setDay(gameConfig.initialState.day);
    setExperience(gameConfig.initialState.experience);
    setGold(gameConfig.initialState.gold);
    setGameOver(false);
    setAdventurers([]);
    setGamePhase('build');
    setMessage('¡Día 1: Construye tu mazmorra!');
    setBattleLog([]);
    
    // Reiniciar salas y habitaciones
    setRooms([]);
    setHalls([]);
    
    // Limpiar el battleManager
    setBattleManager(null);
    
    // Asegurarnos que solo los monstruos/trampas del día 1 estén desbloqueados
    const initialMonsters = gameConfig.utils.createAvailableMonsters(1);
    const initialTraps = gameConfig.utils.createAvailableTraps(1);
    
    setAvailableMonsters(initialMonsters);
    setAvailableTraps(initialTraps);
    
    // Inicializar tablero de juego
    initializeGame();
  };

  const countDungeonItems = (dungeon, type) => {
    let count = 0;
    
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        const cell = dungeon[y][x];
        if (cell && cell.type === type) {
          count++;
        }
      }
    }
    
    return count;
  };
  
  // Memoizar estadísticas para evitar recálculos innecesarios
  const dungeonStats = useMemo(() => {
    return {
      roomsCount: rooms.length,
      hallsCount: halls.length,
      monstersCount: countDungeonItems(dungeon, 'monster'),
      trapsCount: countDungeonItems(dungeon, 'trap'),
      pathsCount: countDungeonItems(dungeon, 'path')
    };
  }, [dungeon, rooms.length, halls.length]);
  
  // Renderizar el juego según la fase actual
  return (
    <div className="dungeon-keeper-game">
      <GameHeader 
        day={day}
        gold={gold}
        experience={experience}
        message={message}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        gamePhase={gamePhase}
      />
      
      <div className="game-content">
        {gameOver ? (
          <GameOver 
            day={day}
            restartGame={restartGame}
          />
        ) : (
          <>
            <Dungeon 
              dungeon={dungeon}
              gamePhase={gamePhase}
              selectedTool={selectedTool}
              selectedItem={selectedItem}
              onCellClick={placeItem}
              onContinuousPathPlace={handleContinuousPathPlace}
              adventurers={adventurers}
              rooms={rooms}
              halls={halls}
            />
            
            {gamePhase === 'build' && (
              <BuildTools 
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                availableMonsters={availableMonsters}
                availableTraps={availableTraps}
                gold={gold}
                experience={experience}
                upgradeMonster={upgradeMonster}
                upgradeTrap={upgradeTrap}
                startBattle={startBattle}
                day={day}
                roomCost={roomCost}
                hallCost={hallCost}
              />
            )}
            
            {gamePhase === 'battle' && (
              <>
                <BattleLog 
                  log={battleLog} 
                  adventurers={adventurers}
                  day={day}
                  // Props para mejorar la UX
                  bossHealth={dungeon[playerPosition.y]?.[playerPosition.x]?.item?.health || 100}
                  bossMaxHealth={dungeon[playerPosition.y]?.[playerPosition.x]?.item?.maxHealth || 100}
                />
                <div className="battle-speed-control">
                  <button 
                    className={`speed-toggle-btn ${battleSpeed === 2 ? 'active' : ''}`}
                    onClick={toggleBattleSpeed}
                  >
                    {battleSpeed === 1 ? '🐢 1x' : '🐇 2x'} Velocidad
                  </button>
                </div>
              </>
            )}

            {gamePhase === 'summary' && (
              <GameSummary 
                day={day}
                gold={gold - goldReward} // Pasar el oro ANTES de la recompensa
                experience={experience - experienceReward} // Pasar experiencia ANTES de la recompensa
                nextDay={nextDay}
                adventurers={adventurers}
                battleLog={battleLog}
                goldReward={goldReward}
                experienceReward={experienceReward}
                // Usar las estadísticas memoizadas
                {...dungeonStats}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DungeonKeeperGame;