// src/managers/GameStateManager.js
import PathFinder from '../models/PathFinder';
import BattleManager from '../utils/battleManager';

/**
 * @class GameStateManager
 * @description Gestiona el estado global del juego y las transiciones entre fases
 */
class GameStateManager {
  /**
   * @constructor
   * @param {Object} params - Parámetros de inicialización
   * @param {Function} params.setDay - Función para actualizar el día actual
   * @param {Function} params.setGamePhase - Función para actualizar la fase de juego
   * @param {Function} params.setMessage - Función para actualizar mensajes
   * @param {Function} params.setBattleLog - Función para actualizar el registro de batalla
   * @param {Function} params.setAdventurers - Función para actualizar aventureros
   * @param {Function} params.setDungeon - Función para actualizar la mazmorra
   * @param {Function} params.setGold - Función para actualizar el oro
   * @param {Function} params.setExperience - Función para actualizar la experiencia
   * @param {Function} params.setGoldReward - Función para establecer recompensa de oro
   * @param {Function} params.setExperienceReward - Función para establecer recompensa de experiencia
   * @param {Function} params.setGameOver - Función para establecer fin de juego
   * @param {Function} params.setBattleManager - Función para establecer gestor de batalla
   * @param {Function} params.setAvailableMonsters - Función para actualizar monstruos disponibles
   * @param {Function} params.setAvailableTraps - Función para actualizar trampas disponibles
   * @param {Function} params.setRooms - Función para actualizar habitaciones
   * @param {Function} params.setHalls - Función para actualizar salas
   * @param {Function} params.countDungeonItems - Función para contar elementos en la mazmorra
   * @param {Function} params.restoreDungeon - Función para restaurar la mazmorra entre días
   * @param {Function} params.checkUnlocks - Función para verificar desbloqueos
   * @param {Function} params.generateAdventurers - Función para generar aventureros
   */
  constructor({
    setDay,
    setGamePhase,
    setMessage,
    setBattleLog,
    setAdventurers,
    setDungeon,
    setGold,
    setExperience,
    setGoldReward,
    setExperienceReward,
    setGameOver,
    setBattleManager,
    setAvailableMonsters,
    setAvailableTraps,
    setRooms,
    setHalls,
    countDungeonItems,
    restoreDungeon,
    checkUnlocks,
    generateAdventurers
  }) {
    this.setDay = setDay;
    this.setGamePhase = setGamePhase;
    this.setMessage = setMessage;
    this.setBattleLog = setBattleLog;
    this.setAdventurers = setAdventurers;
    this.setDungeon = setDungeon;
    this.setGold = setGold;
    this.setExperience = setExperience;
    this.setGoldReward = setGoldReward;
    this.setExperienceReward = setExperienceReward;
    this.setGameOver = setGameOver;
    this.setBattleManager = setBattleManager;
    this.setAvailableMonsters = setAvailableMonsters;
    this.setAvailableTraps = setAvailableTraps;
    this.setRooms = setRooms;
    this.setHalls = setHalls;
    
    // Helpers
    this.countDungeonItems = countDungeonItems;
    this.restoreDungeon = restoreDungeon;
    this.checkUnlocks = checkUnlocks;
    this.generateAdventurers = generateAdventurers;
  }

  /**
   * Inicializa el juego
   * @param {number} boardWidth - Ancho del tablero
   * @param {number} boardHeight - Alto del tablero
   * @param {Object} playerPosition - Posición del jugador/jefe {x, y}
   * @param {Object} entrancePosition - Posición de la entrada {x, y}
   * @param {Object} gameConfig - Configuración del juego
   */
  initializeGame = (boardWidth, boardHeight, playerPosition, entrancePosition, gameConfig) => {
    if (!boardWidth || !boardHeight || !playerPosition || !entrancePosition || !gameConfig) {
      console.error("Parámetros inválidos para inicializar el juego");
      return;
    }
    
    // Crear una nueva mazmorra
    const newDungeon = Array(boardHeight).fill().map(() => Array(boardWidth).fill(null));
    
    // Colocar al jugador y la entrada
    if (playerPosition.y < boardHeight && playerPosition.x < boardWidth &&
        entrancePosition.y < boardHeight && entrancePosition.x < boardWidth) {
      newDungeon[playerPosition.y][playerPosition.x] = { type: 'player' };
      newDungeon[entrancePosition.y][entrancePosition.x] = { type: 'entrance' };
    } else {
      console.error("Posiciones fuera de límites para jugador o entrada");
      return;
    }
    
    // Inicializar monstruos y trampas disponibles del día 1
    let monsters = [];
    let traps = [];
    
    if (gameConfig.utils && typeof gameConfig.utils.createAvailableMonsters === 'function') {
      monsters = gameConfig.utils.createAvailableMonsters(1);
    }
    
    if (gameConfig.utils && typeof gameConfig.utils.createAvailableTraps === 'function') {
      traps = gameConfig.utils.createAvailableTraps(1);
    }
    
    this.setDungeon(newDungeon);
    this.setAvailableMonsters(monsters);
    this.setAvailableTraps(traps);
    this.setGamePhase('build');
    this.setMessage(`Día 1: ¡Construye tu mazmorra!`);
  };

  /**
   * Pasar al siguiente día
   * @param {number} day - Día actual
   * @param {Array} dungeon - Estado actual de la mazmorra
   * @param {Object} gameConfig - Configuración del juego
   */
  nextDay = (day, dungeon, gameConfig) => {
    if (!dungeon || !gameConfig) {
      console.error("Parámetros inválidos para avanzar al siguiente día");
      return;
    }
    
    // Verificar si hemos alcanzado el máximo de días
    const maxDays = gameConfig.maxDays || 30;
    if (day >= maxDays) {
      this.setMessage(`¡Has alcanzado el día máximo (${maxDays})! El juego ha terminado.`);
      this.setGameOver(true);
      return;
    }
    
    // Incrementar el día
    const newDay = day + 1;
    this.setDay(newDay);
    
    // Restaurar la mazmorra (reparar trampas, curar monstruos, etc.)
    const restoredDungeon = this.restoreDungeon(dungeon);
    this.setDungeon(restoredDungeon);
    
    // Verificar desbloqueos de monstruos y trampas
    if (typeof this.checkUnlocks === 'function') {
      this.checkUnlocks(newDay);
    }
    
    // Volver a la fase de construcción
    this.setGamePhase('build');
    this.setMessage(`Día ${newDay}: ¡Mejora tu mazmorra!`);
    this.setAdventurers([]);
    this.setBattleLog([]);
  };

  /**
   * Iniciar la batalla
   * @param {Array} dungeon - Estado actual de la mazmorra
   * @param {number} day - Día actual
   * @param {number} battleSpeed - Velocidad de la batalla
   * @param {Array} rooms - Lista de habitaciones
   * @param {Array} halls - Lista de salas
   * @param {number} boardWidth - Ancho del tablero
   * @param {number} boardHeight - Alto del tablero
   * @param {string} difficulty - Dificultad seleccionada
   * @param {Object} entrancePosition - Posición de la entrada
   */
  startBattle = (dungeon, day, battleSpeed, rooms, halls, boardWidth, boardHeight, difficulty = 'normal', entrancePosition) => {
    if (!dungeon) {
      console.error("Mazmorra no definida para iniciar batalla");
      return;
    }
    
    // Verificar si hay un camino válido
    const pathFinder = new PathFinder(dungeon);
    if (!pathFinder.hasValidPath()) {
      this.setMessage('¡Debes construir un camino completo de la entrada al jefe final!');
      return;
    }
    
    // Cambiar a fase de batalla
    this.setGamePhase('battle');
    this.setMessage('¡Los aventureros están atacando tu mazmorra!');
    this.setBattleLog(['¡La batalla ha comenzado!']);
    
    // Generar aventureros
    const newAdventurers = this.generateAdventurers(day, difficulty, entrancePosition);
    this.setAdventurers(newAdventurers);
    
    // Crear gestor de batalla
    const newBattleManager = new BattleManager(
      dungeon, 
      newAdventurers,
      this.handleBattleUpdate,
      { 
        rooms, 
        halls,
        currentDay: day,
        speed: battleSpeed,
        boardWidth,
        boardHeight,
        // Añadir información sobre la mazmorra para estadísticas
        monstersCount: this.countDungeonItems(dungeon, 'monster'),
        trapsCount: this.countDungeonItems(dungeon, 'trap'),
        pathsCount: this.countDungeonItems(dungeon, 'path')
      }
    );
    
    // Establece la velocidad después de crear el manager
    if (newBattleManager) {
      newBattleManager.adventurerMoveDelay = 500 / battleSpeed;
      newBattleManager.turnDelay = 1000 / battleSpeed;
      this.setBattleManager(newBattleManager);
      
      // Iniciar la batalla
      newBattleManager.startBattle();
    }
  };

  /**
   * Manejar actualizaciones de la batalla
   * @param {Object} update - Información de actualización
   * @param {number} boardWidth - Ancho del tablero
   * @param {number} boardHeight - Alto del tablero
   */
  handleBattleUpdate = (update, boardWidth, boardHeight) => {
    if (!update) {
      console.error("Error: handleBattleUpdate recibió un update indefinido");
      return;
    }
    
    // Actualizar el log de batalla
    if (update.log) {
      this.setBattleLog(update.log);
    }
    
    // Manejar actualización de celda
    if (update.type === 'cellUpdate' && update.x >= 0 && update.y >= 0 && 
        update.x < boardWidth && update.y < boardHeight) {
      this.setDungeon(prevDungeon => {
        const newDungeon = [...prevDungeon];
        newDungeon[update.y][update.x] = update.content;
        return newDungeon;
      });
    }
    
    // Manejar movimiento de aventurero
    if (update.type === 'adventurerMove' && update.adventurer && update.to) {
      this.setAdventurers(prevAdventurers => {
        return prevAdventurers.map(adv => 
          adv.id === update.adventurer.id 
            ? {...adv, position: update.to} 
            : adv
        );
      });
    }
    
    // Manejar cambio de velocidad
    if (update.type === 'speedChange' && update.speed) {
      // Si hay una función para actualizar velocidad de batalla, llamarla
      // (Esta sería una función externa que no está definida en el constructor)
    }
    
    // Manejar cuando un monstruo es derrotado
    if (update.type === 'monsterDefeated' && update.position && update.monster) {
      // Actualizar estadísticas o efectos visuales adicionales
      // Aunque la actualización principal de la celda ya se manejó arriba
    }
    
    // Manejar cuando un aventurero es derrotado
    if (update.type === 'adventurerDefeated' && update.adventurer) {
      this.setAdventurers(prevAdventurers => {
        return prevAdventurers.map(adv => 
          adv.id === update.adventurer.id 
            ? {...adv, isDead: true} 
            : adv
        );
      });
    }
    
    // Manejar error durante la batalla
    if (update.type === 'error') {
      console.error("Error en la batalla:", update.error);
      this.setMessage(`Error: ${update.error || 'Desconocido'}`);
    }
    
    // Manejar fin de turno
    if (update.type === 'turnComplete' && update.turn) {
      // Actualizar contador de turnos o estadísticas si es necesario
    }
    
    // Manejar fin de batalla
    if (update.type === 'victory' || update.type === 'defeat') {
      // Obtén los resultados de la batalla
      const results = update.results || {
        goldReward: 0,
        experienceReward: 0
      };
      
      // Guardar recompensas
      this.setGoldReward(results.goldReward);
      this.setExperienceReward(results.experienceReward);
      
      // Actualizar valores
      this.setGold(prevGold => prevGold + results.goldReward);
      this.setExperience(prevExp => prevExp + results.experienceReward);
      
      if (update.type === 'victory') {
        this.setMessage(`¡Victoria! Ganaste ${results.goldReward} oro y ${results.experienceReward} experiencia.`);
        
        // Pasar a la fase de resumen
        this.setGamePhase('summary');
      } else {
        this.setMessage(`¡Derrota! Los aventureros han alcanzado al jefe final. Ganaste ${results.goldReward} oro y ${results.experienceReward} experiencia.`);
        
        // El juego termina
        this.setGameOver(true);
      }
    }
  };

  /**
   * Reiniciar el juego
   * @param {Object} gameConfig - Configuración del juego
   * @param {number} boardWidth - Ancho del tablero
   * @param {number} boardHeight - Alto del tablero
   * @param {Object} playerPosition - Posición del jefe final
   * @param {Object} entrancePosition - Posición de la entrada
   */
  restartGame = (gameConfig, boardWidth, boardHeight, playerPosition, entrancePosition) => {
    // Pedir confirmación antes de reiniciar
    if (!window.confirm("¿Estás seguro de que quieres reiniciar el juego? Todo tu progreso se perderá.")) {
      return;
    }
    
    // Reiniciar variables de estado básicas
    this.setDay(gameConfig.initialState.day);
    this.setExperience(gameConfig.initialState.experience);
    this.setGold(gameConfig.initialState.gold);
    this.setGameOver(false);
    this.setAdventurers([]);
    this.setGamePhase('build');
    this.setMessage('¡Día 1: Construye tu mazmorra!');
    this.setBattleLog([]);
    
    // Reiniciar salas y habitaciones
    this.setRooms([]);
    this.setHalls([]);
    
    // Limpiar el battleManager
    this.setBattleManager(null);
    
    // Asegurarnos que solo los monstruos/trampas del día 1 estén desbloqueados
    const initialMonsters = gameConfig.utils.createAvailableMonsters(1);
    const initialTraps = gameConfig.utils.createAvailableTraps(1);
    
    this.setAvailableMonsters(initialMonsters);
    this.setAvailableTraps(initialTraps);
    
    // Inicializar tablero de juego
    this.initializeGame(boardWidth, boardHeight, playerPosition, entrancePosition, gameConfig);
  };
}

export default GameStateManager;