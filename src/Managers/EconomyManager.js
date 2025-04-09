// src/managers/EconomyManager.js
import Monster from '../models/Monster';
import Trap from '../models/Trap';
import Adventurer from '../models/Adventurer';
import gameConfig from '../utils/gameConfig';

class EconomyManager {
  constructor({
    setGold,
    setExperience,
    setAvailableMonsters,
    setAvailableTraps,
    setMessage,
    setDungeon
  }) {
    this.setGold = setGold;
    this.setExperience = setExperience;
    this.setAvailableMonsters = setAvailableMonsters;
    this.setAvailableTraps = setAvailableTraps;
    this.setMessage = setMessage;
    this.setDungeon = setDungeon;
  }

  // Generar aventureros para el día actual
  generateAdventurers = (day, difficulty) => {
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
  
  // Mejorar un monstruo
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
    const upgradeCost = monster.getUpgradeCost();
    
    // Verificar experiencia suficiente
    if (experience < upgradeCost) {
      this.setMessage('¡No tienes suficiente experiencia para esta mejora!');
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
    for (let y = 0; y < newDungeon.length; y++) {
      for (let x = 0; x < newDungeon[y].length; x++) {
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
    this.setAvailableMonsters(updatedMonsters);
    this.setDungeon(newDungeon);
    this.setExperience(experience - upgradeCost);
    this.setMessage(`¡${monster.name} mejorado al nivel ${updatedMonster.level}!`);
  };
  
  // Mejorar una trampa
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
    const upgradeCost = trap.getUpgradeCost();
    
    // Verificar experiencia suficiente
    if (experience < upgradeCost) {
      this.setMessage('¡No tienes suficiente experiencia para esta mejora!');
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
    for (let y = 0; y < newDungeon.length; y++) {
      for (let x = 0; x < newDungeon[y].length; x++) {
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
    this.setAvailableTraps(updatedTraps);
    this.setDungeon(newDungeon);
    this.setExperience(experience - upgradeCost);
    this.setMessage(`¡${trap.name} mejorada al nivel ${updatedTrap.level}!`);
  };

  // Restaurar la mazmorra para el siguiente día
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
            cell.item.remainingUses = cell.item.calculateUses();
          }
        }
      }
    }
    
    return newDungeon;
  };
  
  // Verificar desbloqueos basados en el día
  checkUnlocks = (currentDay, availableMonsters, availableTraps) => {
    // Verificar monstruos desbloqueados
    const updatedMonsters = availableMonsters.map(monster => {
      const monsterConfig = gameConfig.monsters.find(m => m.id === monster.id);
      if (!monster.unlocked && monsterConfig && currentDay >= monsterConfig.unlockDay) {
        this.setMessage(prevMessage => `${prevMessage} ¡Has desbloqueado ${monster.name}!`);
        return new Monster({...monster, unlocked: true});
      }
      return monster;
    });
    
    // Verificar trampas desbloqueadas
    const updatedTraps = availableTraps.map(trap => {
      const trapConfig = gameConfig.traps.find(t => t.id === trap.id);
      if (!trap.unlocked && trapConfig && currentDay >= trapConfig.unlockDay) {
        this.setMessage(prevMessage => `${prevMessage} ¡Has desbloqueado ${trap.name}!`);
        return new Trap({...trap, unlocked: true});
      }
      return trap;
    });
    
    this.setAvailableMonsters(updatedMonsters);
    this.setAvailableTraps(updatedTraps);
  };

  // Contador de elementos en la mazmorra
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