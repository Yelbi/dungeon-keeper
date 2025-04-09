// src/managers/GameStateManager.js
import PathFinder from '../models/PathFinder';
import BattleManager from '../utils/battleManager';

class GameStateManager {
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

  // Inicializar el juego
  initializeGame = (boardWidth, boardHeight, playerPosition, entrancePosition, gameConfig) => {
    // Crear una nueva mazmorra
    const newDungeon = Array(boardHeight).fill().map(() => Array(boardWidth).fill(null));
    
    // Colocar al jugador y la entrada
    newDungeon[playerPosition.y][playerPosition.x] = { type: 'player' };
    newDungeon[entrancePosition.y][entrancePosition.x] = { type: 'entrance' };
    
    // Inicializar monstruos y trampas disponibles del día 1
    const monsters = gameConfig.utils.createAvailableMonsters(1);
    const traps = gameConfig.utils.createAvailableTraps(1);
    
    this.setDungeon(newDungeon);
    this.setAvailableMonsters(monsters);
    this.setAvailableTraps(traps);
    this.setGamePhase('build');
    this.setMessage(`Día 1: ¡Construye tu mazmorra!`);
  };

  // Pasar al siguiente día
  nextDay = (day, dungeon, gameConfig) => {
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
    this.checkUnlocks(newDay);
    
    // Volver a la fase de construcción
    this.setGamePhase('build');
    this.setMessage(`Día ${newDay}: ¡Mejora tu mazmorra!`);
    this.setAdventurers([]);
    this.setBattleLog([]);
  };

  // Iniciar la batalla
  startBattle = (dungeon, day, battleSpeed, rooms, halls, boardWidth, boardHeight) => {
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
    const newAdventurers = this.generateAdventurers(day);
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
        // Añadir información sobre la mazmorra para estadísticas
        monstersCount: this.countDungeonItems(dungeon, 'monster'),
        trapsCount: this.countDungeonItems(dungeon, 'trap'),
        pathsCount: this.countDungeonItems(dungeon, 'path')
      }
    );
    
    // Establece la velocidad después de crear el manager
    newBattleManager.adventurerMoveDelay = 500 / battleSpeed;
    newBattleManager.turnDelay = 1000 / battleSpeed;
    this.setBattleManager(newBattleManager);
    
    // Iniciar la batalla
    newBattleManager.startBattle();
  };

  // Manejar actualizaciones de la batalla
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

  // Reiniciar el juego
  restartGame = (gameConfig) => {
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