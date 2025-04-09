// src/managers/EconomyManager.js
/**
 * @class EconomyManager
 * @description Gestiona la economía del juego, mejoras y generación de aventureros
 */
class EconomyManager {
  /**
   * @constructor
   * @param {Object} params - Parámetros de inicialización
   * @param {Function} params.setGold - Función para actualizar el oro
   * @param {Function} params.setExperience - Función para actualizar la experiencia
   * @param {Function} params.setAvailableMonsters - Función para actualizar monstruos disponibles
   * @param {Function} params.setAvailableTraps - Función para actualizar trampas disponibles
   * @param {Function} params.setMessage - Función para actualizar mensajes
   * @param {Function} params.setDungeon - Función para actualizar el estado de la mazmorra
   * @param {Object} gameConfig - Configuración del juego
   */
  constructor({
    setGold,
    setExperience,
    setAvailableMonsters,
    setAvailableTraps,
    setMessage,
    setDungeon
  }, gameConfig) {
    this.setGold = setGold;
    this.setExperience = setExperience;
    this.setAvailableMonsters = setAvailableMonsters;
    this.setAvailableTraps = setAvailableTraps;
    this.setMessage = setMessage;
    this.setDungeon = setDungeon;
    this.gameConfig = gameConfig || {};
  }

  /**
   * Genera aventureros para el día actual
   * @param {number} day - Día actual del juego
   * @param {string} difficulty - Dificultad seleccionada
   * @param {Object} entrancePosition - Posición de la entrada {x, y}
   * @returns {Array} Lista de aventureros generados
   */
  generateAdventurers = (day, difficulty, entrancePosition) => {
    if (!this.gameConfig.difficulty || !this.gameConfig.adventurers) {
      console.error("Configuración de juego inválida o incompleta");
      return [];
    }
    
    const difficultySettings = this.gameConfig.difficulty[difficulty] || this.gameConfig.difficulty.normal;
    
    // Determinar cuántos aventureros
    const baseCount = typeof this.gameConfig.adventurers.baseCount === 'function' 
      ? this.gameConfig.adventurers.baseCount(day)
      : 1 + Math.floor(day / 3); // Fallback
    
    const adjustedCount = Math.max(1, Math.round(baseCount * difficultySettings.adventurerScaling));
    
    // Determinar niveles según distribución
    const levelDistribution = typeof this.gameConfig.adventurers.levelDistribution === 'function'
      ? this.gameConfig.adventurers.levelDistribution(day)
      : [{ level: 1, chance: 1.0 }]; // Fallback
    
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
      
      // Crear un nuevo aventurero usando la clase Adventurer si está disponible
      if (typeof this.gameConfig.utils?.createAdventurer === 'function') {
        const adventurer = this.gameConfig.utils.createAdventurer(i, level, day);
        
        // Colocar en la entrada si está definida
        if (entrancePosition) {
          adventurer.position = {...entrancePosition};
        }
        
        newAdventurers.push(adventurer);
      } else {
        // Creación básica si no hay método definido
        const adventurer = {
          id: i,
          name: this.getRandomName(),
          level: level,
          health: 30 * level,
          maxHealth: 30 * level,
          damage: 8 * level,
          position: entrancePosition ? {...entrancePosition} : {x: 0, y: 0},
          isDead: false
        };
        
        newAdventurers.push(adventurer);
      }
    }
    
    return newAdventurers;
  };
  
  /**
   * Genera un nombre aleatorio para aventureros (método de apoyo)
   * @returns {string} Nombre aleatorio
   */
  getRandomName = () => {
    const defaultNames = ["Aldric", "Elara", "Thorne", "Lyra", "Gareth", "Sora", "Varis", "Mira"];
    const names = this.gameConfig.adventurers?.possibleNames || defaultNames;
    return names[Math.floor(Math.random() * names.length)];
  };
  
  /**
   * Mejora un monstruo
   * @param {string|number} monsterId - ID del monstruo a mejorar
   * @param {Array} availableMonsters - Lista de monstruos disponibles
   * @param {number} experience - Experiencia actual del jugador
   * @param {Array} dungeon - Estado actual de la mazmorra
   */
  upgradeMonster = (monsterId, availableMonsters, experience, dungeon) => {
    const monsterIndex = availableMonsters.findIndex(m => m.id === monsterId);
    
    if (monsterIndex === -1 || !availableMonsters[monsterIndex].unlocked) {
      this.setMessage('Monstruo no disponible');
      return;
    }
    
    const monster = availableMonsters[monsterIndex];
    
    // Verificar nivel máximo
    if (monster.level >= monster.maxLevel) {
      this.setMessage('¡Este monstruo ya está al nivel máximo!');
      return;
    }
    
    // Calcular coste de mejora
    const upgradeCost = typeof monster.getUpgradeCost === 'function' 
      ? monster.getUpgradeCost() 
      : monster.cost * monster.level;
    
    // Verificar experiencia suficiente
    if (experience < upgradeCost) {
      this.setMessage('¡No tienes suficiente experiencia para esta mejora!');
      return;
    }
    
    // Crear una copia y mejorarla
    const updatedMonster = {...monster};
    
    if (typeof updatedMonster.levelUp === 'function') {
      updatedMonster.levelUp();
    } else {
      // Mejora manual si no existe el método
      updatedMonster.level += 1;
      updatedMonster.health = Math.floor(updatedMonster.health * 1.2);
      updatedMonster.maxHealth = updatedMonster.health;
      updatedMonster.damage = Math.floor(updatedMonster.damage * 1.15);
    }
    
    // Actualizar la lista de monstruos
    const updatedMonsters = [...availableMonsters];
    updatedMonsters[monsterIndex] = updatedMonster;
    
    // Actualizar también en la mazmorra si hay monstruos de este tipo
    const newDungeon = [...dungeon];
    for (let y = 0; y < newDungeon.length; y++) {
      for (let x = 0; x < newDungeon[y].length; x++) {
        const cell = newDungeon[y][x];
        if (cell && cell.type === 'monster' && cell.item.id === monsterId) {
          // Actualizar el monstruo manteniendo su salud actual como porcentaje
          const healthPercent = cell.item.health / cell.item.maxHealth;
          const updatedMonsterCopy = {...updatedMonster, position: cell.item.position};
          
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
    this.setAvailableMonsters(updatedMonsters);
    this.setDungeon(newDungeon);
    this.setExperience(experience - upgradeCost);
    this.setMessage(`¡${monster.name} mejorado al nivel ${updatedMonster.level}!`);
  };
  
  /**
   * Mejora una trampa
   * @param {string|number} trapId - ID de la trampa a mejorar
   * @param {Array} availableTraps - Lista de trampas disponibles
   * @param {number} experience - Experiencia actual del jugador
   * @param {Array} dungeon - Estado actual de la mazmorra
   */
  upgradeTrap = (trapId, availableTraps, experience, dungeon) => {
    const trapIndex = availableTraps.findIndex(t => t.id === trapId);
    
    if (trapIndex === -1 || !availableTraps[trapIndex].unlocked) {
      this.setMessage('Trampa no disponible');
      return;
    }
    
    const trap = availableTraps[trapIndex];
    
    // Verificar nivel máximo
    if (trap.level >= trap.maxLevel) {
      this.setMessage('¡Esta trampa ya está al nivel máximo!');
      return;
    }
    
    // Calcular coste de mejora
    const upgradeCost = typeof trap.getUpgradeCost === 'function' 
      ? trap.getUpgradeCost() 
      : trap.cost * trap.level;
    
    // Verificar experiencia suficiente
    if (experience < upgradeCost) {
      this.setMessage('¡No tienes suficiente experiencia para esta mejora!');
      return;
    }
    
    // Crear una copia y mejorarla
    const updatedTrap = {...trap};
    
    if (typeof updatedTrap.levelUp === 'function') {
      updatedTrap.levelUp();
    } else {
      // Mejora manual si no existe el método
      updatedTrap.level += 1;
      updatedTrap.damage = Math.floor(updatedTrap.damage * 1.15);
      
      // Actualizar usos si existe el método
      if (typeof updatedTrap.calculateUses === 'function') {
        updatedTrap.remainingUses = updatedTrap.calculateUses();
      } else {
        // Mejora básica de usos
        updatedTrap.remainingUses = (updatedTrap.uses || 1) + Math.floor(updatedTrap.level * 0.5);
      }
    }
    
    // Actualizar la lista de trampas
    const updatedTraps = [...availableTraps];
    updatedTraps[trapIndex] = updatedTrap;
    
    // Actualizar también en la mazmorra si hay trampas de este tipo
    const newDungeon = [...dungeon];
    for (let y = 0; y < newDungeon.length; y++) {
      for (let x = 0; x < newDungeon[y].length; x++) {
        const cell = newDungeon[y][x];
        if (cell && cell.type === 'trap' && cell.item.id === trapId) {
          const updatedTrapCopy = {...updatedTrap, position: cell.item.position};
          
          newDungeon[y][x] = {
            type: 'trap',
            item: updatedTrapCopy
          };
        }
      }
    }
    
    // Actualizar estados
    this.setAvailableTraps(updatedTraps);
    this.setDungeon(newDungeon);
    this.setExperience(experience - upgradeCost);
    this.setMessage(`¡${trap.name} mejorada al nivel ${updatedTrap.level}!`);
  };

  /**
   * Restaura la mazmorra para el siguiente día
   * @param {Array} dungeon - Estado actual de la mazmorra
   * @returns {Array} Mazmorra restaurada
   */
  restoreDungeon = (dungeon) => {
    const newDungeon = [...dungeon];
    
    for (let y = 0; y < newDungeon.length; y++) {
      for (let x = 0; x < newDungeon[y].length; x++) {
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
            
            // Usar el método si existe, o valor por defecto
            if (typeof cell.item.calculateUses === 'function') {
              cell.item.remainingUses = cell.item.calculateUses();
            } else {
              // Restaurar usos básicos
              cell.item.remainingUses = cell.item.uses || 1;
            }
          }
        }
      }
    }
    
    return newDungeon;
  };
  
  /**
   * Verificar desbloqueos basados en el día
   * @param {number} currentDay - Día actual del juego
   * @param {Array} availableMonsters - Lista de monstruos disponibles
   * @param {Array} availableTraps - Lista de trampas disponibles
   */
  checkUnlocks = (currentDay, availableMonsters, availableTraps) => {
    if (!this.gameConfig.monsters || !this.gameConfig.traps) {
      console.warn("Configuración de monstruos o trampas no encontrada");
      return;
    }
    
    // Verificar monstruos desbloqueados
    const updatedMonsters = availableMonsters.map(monster => {
      const monsterConfig = this.gameConfig.monsters.find(m => m.id === monster.id);
      if (!monster.unlocked && monsterConfig && currentDay >= monsterConfig.unlockDay) {
        this.setMessage(prevMessage => `${prevMessage} ¡Has desbloqueado ${monster.name}!`);
        return {...monster, unlocked: true};
      }
      return monster;
    });
    
    // Verificar trampas desbloqueadas
    const updatedTraps = availableTraps.map(trap => {
      const trapConfig = this.gameConfig.traps.find(t => t.id === trap.id);
      if (!trap.unlocked && trapConfig && currentDay >= trapConfig.unlockDay) {
        this.setMessage(prevMessage => `${prevMessage} ¡Has desbloqueado ${trap.name}!`);
        return {...trap, unlocked: true};
      }
      return trap;
    });
    
    this.setAvailableMonsters(updatedMonsters);
    this.setAvailableTraps(updatedTraps);
  };

  /**
   * Contador de elementos en la mazmorra
   * @param {Array} dungeon - Estado actual de la mazmorra
   * @param {string} type - Tipo de elemento a contar
   * @returns {number} Cantidad de elementos encontrados
   */
  countDungeonItems = (dungeon, type) => {
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
}

export default EconomyManager;