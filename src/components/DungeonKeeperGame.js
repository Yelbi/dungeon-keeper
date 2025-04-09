// src/components/DungeonKeeperGame.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Dungeon from './Dungeon';
import BuildTools from './BuildTools';
import GameHeader from './GameHeader';
import GameSummary from './GameSummary';
import GameOver from './GameOver';
import BattleLog from './BattleLog';
import PathFinder from '../models/PathFinder';
import gameConfig from '../utils/gameConfig';
import '../styles/DungeonKeeperGame.css';

// Importar los managers
import GameStateManager from '../Managers/GameStateManager';
import BuildManager from '../Managers/BuildManager';
import EconomyManager from '../Managers/EconomyManager';
import EffectsManager from '../Managers/EffectsManager';
import TurnManager from '../Managers/TurnManager';

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
  
  // Referencias a los managers
  const buildManagerRef = useRef(null);
  const economyManagerRef = useRef(null);
  const gameStateManagerRef = useRef(null);
  const effectsManagerRef = useRef(null);
  const turnManagerRef = useRef(null);

  // Inicialización del juego
  useEffect(() => {
    initializeManagers();
    initializeGame();
  }, []);

  // Inicializar los managers
  const initializeManagers = () => {
    // Crear instancia de BuildManager
    buildManagerRef.current = new BuildManager({
      setDungeon, 
      setMessage, 
      setGold, 
      setRooms, 
      setHalls
    });
    
    // Crear instancia de EconomyManager
    economyManagerRef.current = new EconomyManager({
      setGold,
      setExperience,
      setAvailableMonsters,
      setAvailableTraps,
      setMessage,
      setDungeon
    });
    
    // Crear instancia de EffectsManager
    effectsManagerRef.current = new EffectsManager();
    
    // Crear instancia de GameStateManager
    gameStateManagerRef.current = new GameStateManager({
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
    });
    
    // TurnManager se inicializará cuando sea necesario durante las batallas
  };

  // Inicializa el juego
  const initializeGame = () => {
    if (!gameStateManagerRef.current) return;
    
    gameStateManagerRef.current.initializeGame(
      boardWidth, 
      boardHeight, 
      playerPosition, 
      entrancePosition, 
      gameConfig
    );
  };

  // Colocar un elemento en la mazmorra
  const placeItem = (x, y) => {
    if (!buildManagerRef.current) return;
    
    buildManagerRef.current.placeItem(
      x, y, 
      selectedTool, 
      selectedItem, 
      dungeon,
      boardWidth, 
      boardHeight, 
      entrancePosition, 
      playerPosition, 
      gold, 
      rooms, 
      halls,
      roomCost,
      hallCost
    );
  };

  // Método para colocación continua de caminos
  const handleContinuousPathPlace = (x, y) => {
    if (!buildManagerRef.current) return;
    
    buildManagerRef.current.handleContinuousPathPlace(
      x, y, 
      dungeon, 
      boardWidth, 
      boardHeight, 
      entrancePosition, 
      playerPosition
    );
  };
  
  // Mejorar un monstruo
  const upgradeMonster = (monsterId) => {
    if (!economyManagerRef.current) return;
    
    economyManagerRef.current.upgradeMonster(
      monsterId, 
      availableMonsters, 
      experience, 
      dungeon
    );
  };
  
  // Mejorar una trampa
  const upgradeTrap = (trapId) => {
    if (!economyManagerRef.current) return;
    
    economyManagerRef.current.upgradeTrap(
      trapId, 
      availableTraps, 
      experience, 
      dungeon
    );
  };
  
  // Generar aventureros para el día actual
  const generateAdventurers = () => {
    if (!economyManagerRef.current) return [];
    
    return economyManagerRef.current.generateAdventurers(
      day, 
      difficulty
    );
  };

  // Contador de elementos en la mazmorra
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
  
  // Restaurar la mazmorra para el siguiente día
  const restoreDungeon = (dungeon) => {
    if (!economyManagerRef.current) return dungeon;
    
    return economyManagerRef.current.restoreDungeon(dungeon);
  };
  
  // Verificar desbloqueos basados en el día
  const checkUnlocks = (currentDay) => {
    if (!economyManagerRef.current) return;
    
    economyManagerRef.current.checkUnlocks(
      currentDay, 
      availableMonsters, 
      availableTraps
    );
  };
  
  // Pasar al siguiente día
  const nextDay = () => {
    if (!gameStateManagerRef.current) return;
    
    gameStateManagerRef.current.nextDay(
      day, 
      dungeon, 
      gameConfig
    );
  };
  
  // Iniciar la batalla
  const startBattle = () => {
    if (!gameStateManagerRef.current) return;
    
    gameStateManagerRef.current.startBattle(
      dungeon, 
      day, 
      battleSpeed, 
      rooms, 
      halls, 
      boardWidth, 
      boardHeight
    );
  };
  
  // Cambiar velocidad de batalla
  const toggleBattleSpeed = () => {
    const newSpeed = battleSpeed === 1 ? 2 : 1;
    setBattleSpeed(newSpeed);
    
    if (battleManager) {
      if (typeof battleManager.setSimulationSpeed === 'function') {
        battleManager.setSimulationSpeed(newSpeed);
      } else {
        battleManager.adventurerMoveDelay = 500 / newSpeed;
        battleManager.turnDelay = 1000 / newSpeed;
      }
    }
  };
  
  // Reiniciar el juego
  const restartGame = () => {
    if (!gameStateManagerRef.current) return;
    
    gameStateManagerRef.current.restartGame(gameConfig);
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
              <BattleLog 
                log={battleLog} 
                adventurers={adventurers}
                day={day}
                bossHealth={dungeon[playerPosition.y]?.[playerPosition.x]?.item?.health || 100}
                bossMaxHealth={dungeon[playerPosition.y]?.[playerPosition.x]?.item?.maxHealth || 100}
                toggleBattleSpeed={toggleBattleSpeed}
                battleSpeed={battleSpeed}
              />
            )}
  
            {gamePhase === 'summary' && (
              <GameSummary 
                day={day}
                gold={gold - goldReward}
                experience={experience - experienceReward}
                nextDay={nextDay}
                adventurers={adventurers}
                battleLog={battleLog}
                goldReward={goldReward}
                experienceReward={experienceReward}
                roomsCount={rooms.length}
                hallsCount={halls.length}
                monstersCount={countDungeonItems(dungeon, 'monster')}
                trapsCount={countDungeonItems(dungeon, 'trap')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DungeonKeeperGame;