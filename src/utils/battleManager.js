// src/utils/battleManager.js
import PathFinder from '../models/PathFinder';

/**
 * Clase para gestionar las batallas entre aventureros y monstruos
 */
class BattleManager {
  /**
   * Constructor del gestor de batallas
   * @param {Array} dungeon - El tablero de juego
   * @param {Array} adventurers - Lista de aventureros
   * @param {Function} onBattleUpdate - Callback para notificar actualizaciones
   * @param {Object} options - Opciones adicionales
   */
  constructor(dungeon, adventurers, onBattleUpdate, options = {}) {
    // Validar parámetros esenciales
    if (!dungeon || !Array.isArray(dungeon)) {
      throw new Error('Dungeon debe ser un array válido');
    }
    
    if (!adventurers || !Array.isArray(adventurers)) {
      throw new Error('Adventurers debe ser un array válido');
    }
    
    this.dungeon = dungeon;
    this.adventurers = adventurers;
    this.pathFinder = new PathFinder(dungeon);
    this.battleLog = [];
    this.turnCounter = 0;
    this.battleState = 'preparation'; // preparation, inProgress, victory, defeat
    this.onBattleUpdate = onBattleUpdate || (() => {});
    this.animationsEnabled = true;
    this.playerPosition = this.findPlayerPosition();
    this.statusEffects = new Map(); // Mapa para almacenar efectos de estado
    
    // Configuración de simulación
    this.simulationSpeed = options.speed || 1;
    
    // Rooms y Halls
    this.dungeon.rooms = options.rooms || [];
    this.dungeon.halls = options.halls || [];
    
    // Estadísticas para análisis
    this.battleStats = {
      monstersKilled: 0,
      trapsTriggered: 0,
      damageDealt: 0,
      damageReceived: 0,
      criticalHits: 0,
      healingDone: 0
    };
    
    // Cache para pathing y optimizaciones
    this.pathCache = new Map();
    
    // Ajustar delays según la velocidad
    this.updateDelays();
  }
  
  /**
   * Actualiza los delays de animación según la velocidad
   */
  updateDelays() {
    this.adventurerMoveDelay = 500 / this.simulationSpeed;
    this.turnDelay = 1000 / this.simulationSpeed;
  }
  
  /**
   * Cambia la velocidad de simulación
   * @param {number} speed - Nueva velocidad (1 = normal, 2 = rápido)
   */
  setSimulationSpeed(speed) {
    if (typeof speed !== 'number' || speed <= 0) {
      console.error('Velocidad de simulación inválida:', speed);
      return;
    }
    
    this.simulationSpeed = speed;
    this.updateDelays();
    
    // Notificar cambio de velocidad
    this.onBattleUpdate({
      type: 'speedChange',
      speed: this.simulationSpeed
    });
  }
  
  /**
   * Encuentra la posición del jugador en el dungeon
   * @returns {Object|null} Posición {x, y} o null si no se encuentra
   */
  findPlayerPosition() {
    for (let y = 0; y < this.dungeon.length; y++) {
      for (let x = 0; x < this.dungeon[y].length; x++) {
        if (this.dungeon[y][x]?.type === 'player') {
          return { x, y };
        }
      }
    }
    
    console.warn('No se encontró la posición del jugador en el dungeon');
    return null;
  }
  
  /**
   * Inicia la batalla
   * @returns {Promise<boolean>} Éxito o fracaso al iniciar
   */
  async startBattle() {
    try {
      // Verificar si hay un camino válido
      if (!this.pathFinder.hasValidPath()) {
        this.battleLog.push('¡No hay camino válido de la entrada al jefe final!');
        this.onBattleUpdate({
          type: 'error',
          log: this.battleLog,
          message: 'No hay un camino válido'
        });
        return false;
      }
      
      this.battleState = 'inProgress';
      this.battleLog.push('¡La batalla ha comenzado!');
      this.onBattleUpdate({
        type: 'battleStart',
        log: this.battleLog
      });
      
      // Pre-calcular algunos paths para optimizar
      this.preCalculatePaths();
      
      // Comienza el loop de la batalla
      await this.battleLoop();
      
      return true;
    } catch (error) {
      console.error('Error al iniciar la batalla:', error);
      this.battleLog.push(`Error: ${error.message || 'Desconocido'}`);
      this.onBattleUpdate({
        type: 'error',
        log: this.battleLog,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Pre-calcula rutas comunes para mejorar rendimiento
   */
  preCalculatePaths() {
    if (!this.playerPosition) return;
    
    // Calcular rutas desde cada aventurero hacia el jefe
    for (const adventurer of this.adventurers) {
      if (adventurer.isDead) continue;
      
      const pathKey = `${adventurer.position.x},${adventurer.position.y}-to-${this.playerPosition.x},${this.playerPosition.y}`;
      const path = this.pathFinder.findPath(adventurer.position, this.playerPosition);
      
      if (path) {
        this.pathCache.set(pathKey, path);
      }
    }
  }
  
  /**
   * Loop principal de la batalla
   * @returns {Promise<Object>} Resultados de la batalla
   */
  async battleLoop() {
    while (this.battleState === 'inProgress') {
      try {
        this.turnCounter++;
        this.battleLog.push(`--- Turno ${this.turnCounter} ---`);
        
        // Procesar efectos de estado al inicio del turno
        this.processStatusEffects();
        
        // Mover aventureros y procesar combates
        await this.processAdventurerTurns();
        
        // Si la batalla terminó durante los turnos de aventureros, salir
        if (this.battleState !== 'inProgress') {
          break;
        }
        
        // Procesar acciones de monstruos
        await this.processMonsterTurns();
        
        // Actualizar trampas
        this.updateTraps();
        
        // Verificar fin de batalla
        if (this.checkVictory()) {
          this.battleState = 'victory';
          this.battleLog.push('¡Victoria! Has defendido tu mazmorra con éxito.');
          
          // Obtener resultados de batalla
          const results = this.getBattleResults();
          
          this.onBattleUpdate({
            type: 'victory',
            log: this.battleLog,
            results: results
          });
          break;
        }
        
        if (this.checkDefeat()) {
          this.battleState = 'defeat';
          this.battleLog.push('¡Derrota! Los aventureros han llegado al jefe final.');
          
          // Obtener resultados de batalla
          const results = this.getBattleResults();
          
          this.onBattleUpdate({
            type: 'defeat',
            log: this.battleLog,
            results: results
          });
          break;
        }
        
        // Notificar actualización
        this.onBattleUpdate({
          type: 'turnComplete',
          turn: this.turnCounter,
          log: this.battleLog
        });
        
        // Esperar entre turnos
        if (this.animationsEnabled) {
          await this.delay(this.turnDelay);
        }
      } catch (error) {
        console.error(`Error en turno ${this.turnCounter}:`, error);
        this.battleLog.push(`Error en turno ${this.turnCounter}: ${error.message || 'Desconocido'}`);
        
        // Notificar error pero continuar la batalla
        this.onBattleUpdate({
          type: 'error',
          turn: this.turnCounter,
          log: this.battleLog,
          error: error.message
        });
      }
    }
    
    // Devolver resultados de la batalla
    return {
      state: this.battleState,
      turns: this.turnCounter,
      log: this.battleLog,
      stats: this.battleStats
    };
  }
  
  /**
   * Procesa los turnos de los aventureros
   * @returns {Promise<void>}
   */
  async processAdventurerTurns() {
    for (const adventurer of this.adventurers) {
      // Si el estado de la batalla ya no es "inProgress", salir inmediatamente
      if (this.battleState !== 'inProgress') return;
      
      if (adventurer.isDead) continue;
      
      try {
        // Verificar si el aventurero está atrapado o aturdido
        const status = this.statusEffects.get(`adventurer-${adventurer.id}`);
        if (status) {
          // Si está atrapado o aturdido, salta su turno
          if (status.trapped > 0) {
            this.battleLog.push(`${adventurer.name} está atrapado y no puede moverse.`);
            continue;
          }
          
          if (status.stunned > 0) {
            this.battleLog.push(`${adventurer.name} está aturdido y no puede moverse.`);
            continue;
          }
        }

        // Aplicar efectos de sala (ralentización)
        const roomEffect = this.isInSpecialRoom(adventurer.position);
        if (roomEffect && roomEffect.type === 'hall') {
          // 15% de probabilidad de saltar turno en salas
          if (Math.random() < 0.15) {
            this.battleLog.push(`${adventurer.name} se mueve más lento en la gran sala.`);
            continue;
          }
        }
        
        // Decide el siguiente movimiento
        const nextAction = this.getNextAdventurerAction(adventurer);
        
        if (!nextAction) {
          this.battleLog.push(`${adventurer.name} no puede encontrar un camino y se queda quieto.`);
          continue;
        }
        
        // Procesar según el tipo de objetivo
        if (nextAction.targetType === 'player') {
          // Ataque al jefe
          this.battleLog.push(`${adventurer.name} ha alcanzado al jefe final y lo ataca.`);
          
          // Primero, obtener los resultados de la batalla antes de cambiar el estado
          const battleResults = this.getBattleResults();
          
          // Luego, cambiar el estado
          this.battleState = 'defeat';
          this.battleLog.push('¡Derrota! Los aventureros han alcanzado al jefe final.');
          
          // Notificar la derrota incluyendo los resultados ya obtenidos
          this.onBattleUpdate({
            type: 'defeat',
            log: this.battleLog,
            results: battleResults
          });
          
          // Terminar todo el procesamiento
          return;
        } else if (nextAction.targetType === 'monster') {
          // Combate con monstruo
          await this.handleAdventurerMonsterCombat(adventurer, nextAction);
        } else if (nextAction.targetType === 'trap') {
          // Interacción con trampa
          await this.handleAdventurerTrapInteraction(adventurer, nextAction);
        } else {
          // Movimiento normal
          await this.moveAdventurer(adventurer, nextAction);
        }
        
        // Verificar si el juego ha terminado después de la acción del aventurero
        if (this.battleState !== 'inProgress') {
          return;
        }
        
        // Esperar entre movimientos de aventureros
        if (this.animationsEnabled) {
          await this.delay(this.adventurerMoveDelay);
        }
      } catch (error) {
        console.error(`Error en turno de aventurero ${adventurer.name}:`, error);
        this.battleLog.push(`Error en turno de ${adventurer.name}: ${error.message || 'Desconocido'}`);
        // Continuar con el siguiente aventurero
        continue;
      }
    }
  }
  
  /**
   * Obtiene la próxima acción de un aventurero con caché
   * @param {Object} adventurer - El aventurero
   * @returns {Object|null} La próxima acción o null
   */
  getNextAdventurerAction(adventurer) {
    try {
      // Verificar si está en la caché
      const pathKey = `${adventurer.position.x},${adventurer.position.y}-to-${this.playerPosition.x},${this.playerPosition.y}`;
      const cachedPath = this.pathCache.get(pathKey);
      
      // Si tenemos una ruta en caché, usarla
      if (cachedPath && cachedPath.length > 1) {
        // Verificar si el siguiente paso sigue siendo válido
        const nextStep = cachedPath[1]; // El [0] es la posición actual
        const cell = this.getCellContent(nextStep.x, nextStep.y);
        
        // Determinar el tipo de celda
        let targetType = 'move';
        if (cell) {
          if (cell.type === 'monster' && !cell.item.isDead) {
            targetType = 'monster';
          } else if (cell.type === 'trap' && !cell.item.isTriggered) {
            targetType = 'trap';
          } else if (cell.type === 'player') {
            targetType = 'player';
          }
        }
        
        return {
          x: nextStep.x,
          y: nextStep.y,
          targetType: targetType
        };
      }
      
      // Si no hay caché o no es válida, calcular normalmente
      const nextAction = adventurer.decideNextAction(this.dungeon, adventurer.position);
      
      // Guardar en caché para futuros turnos si es un movimiento normal
      if (nextAction && nextAction.targetType === 'move') {
        const newPathKey = `${adventurer.position.x},${adventurer.position.y}-to-${this.playerPosition.x},${this.playerPosition.y}`;
        const path = this.pathFinder.findPath(adventurer.position, this.playerPosition);
        
        if (path && path.length > 1) {
          this.pathCache.set(newPathKey, path);
        }
      }
      
      return nextAction;
    } catch (error) {
      console.error('Error al calcular próxima acción:', error);
      return null;
    }
  }
  
  /**
   * Maneja el combate entre aventurero y monstruo
   * @param {Object} adventurer - El aventurero
   * @param {Object} action - La acción a realizar
   * @returns {Promise<void>}
   */
  async handleAdventurerMonsterCombat(adventurer, action) {
    // Obtener el monstruo en la posición
    const monster = this.getCellContent(action.x, action.y);
    
    if (!monster || monster.type !== 'monster' || monster.item.isDead) {
      // Si no hay monstruo válido, simplemente mueve al aventurero
      await this.moveAdventurer(adventurer, action);
      return;
    }
    
    // Crear un registro detallado del combate
    this.battleLog.push(`⚔️ ¡Combate iniciado! ${adventurer.name} (${adventurer.class}) vs ${monster.item.name} Nivel ${monster.item.level}`);
    
    // El aventurero ataca al monstruo
    const attackResult = adventurer.attack(monster.item);
    
    // Mensajes especiales según el tipo de ataque
    let attackMessage = `${adventurer.name} ataca a ${monster.item.name}`;
    
    if (attackResult.message) {
      attackMessage += ` y ${attackResult.message}`;
    } else if (attackResult.isCritical) {
      attackMessage += " con un ¡GOLPE CRÍTICO!"; // Palabra clave detectada por el formatter
      this.battleStats.criticalHits++;
    } else if (adventurer.hasMagicAttack) {
      attackMessage += " usando magia";
    } else if (adventurer.ranged) {
      attackMessage += " a distancia";
    }
    
    // Aplicar bonificación de sala/habitación al monstruo
    const roomEffect = this.applyRoomEffectToMonster(monster.item, action);
    
    // Aplicar daño con posibles modificadores
    const damageResult = monster.item.takeDamage(attackResult.damage, 
      attackResult.effects && attackResult.effects.includes("magic") ? 'magic' : 'physical');
    
    // Actualizar estadísticas
    this.battleStats.damageDealt += damageResult.damage;
    
    // Mostrar el resultado del ataque
    this.battleLog.push(
      `${attackMessage} causando ${damageResult.damage} puntos de daño.` + 
      (damageResult.blocked > 0 ? ` (${damageResult.blocked} bloqueado)` : '')
    );
    
    // Aplicar efectos especiales del ataque
    if (attackResult.effects && attackResult.effects.length > 0) {
      this.applyAdventurerAttackEffects(adventurer, monster.item, attackResult.effects);
    }
    
    // Mostrar salud restante
    this.battleLog.push(`${monster.item.name} tiene ${monster.item.health}/${monster.item.maxHealth} puntos de vida.`);
    
    // Actualizar estado del monstruo
    if (damageResult.isDead) {
      this.battleLog.push(`💀 ${monster.item.name} ha sido derrotado por ${adventurer.name} (${adventurer.class}).`);
      this.battleStats.monstersKilled++;
      
      // Añadir efectos visuales o sonoros
      this.onBattleUpdate({
        type: 'monsterDefeated',
        position: action,
        monster: monster.item
      });
      
      // Mover al aventurero a la posición del monstruo
      await this.moveAdventurer(adventurer, action);
    } else {
      // El monstruo contraataca si sigue vivo y puede atacar
      await this.handleMonsterCounterAttack(monster.item, adventurer, action);
    }
    
    // Actualizar el estado en el dungeon
    this.updateDungeonCell(action.x, action.y, monster);
  }
  
  /**
   * Aplica efectos de sala/habitación al monstruo
   * @param {Object} monster - El monstruo
   * @param {Object} position - La posición {x, y}
   * @returns {Object|null} El efecto aplicado o null
   */
  applyRoomEffectToMonster(monster, position) {
    const roomEffect = this.isInSpecialRoom(position);
    
    if (!roomEffect) return null;
    
    // Aplicar bonificaciones según el tipo
    if (roomEffect.type === 'room') {
      // Habitación: +15% daño
      monster.tempDamageBonus = 0.15;
      return roomEffect;
    } else if (roomEffect.type === 'hall') {
      // Sala: +20% daño, +10% salud si no está ya aplicado
      monster.tempDamageBonus = 0.20;
      
      // Aplicar bonus de salud solo una vez
      if (!monster.hallHealthApplied) {
        monster.maxHealth = Math.floor(monster.maxHealth * 1.10);
        monster.health = Math.floor(monster.health * 1.10);
        monster.hallHealthApplied = true;
      }
      
      return roomEffect;
    }
    
    return null;
  }
  
  /**
   * Aplica efectos del ataque de un aventurero a un monstruo
   * @param {Object} adventurer - El aventurero
   * @param {Object} monster - El monstruo
   * @param {Array} effects - Lista de efectos
   */
  applyAdventurerAttackEffects(adventurer, monster, effects) {
    // Aplicar debuffs (habilidad de magos)
    if (effects.includes("debuff")) {
      // Crear efecto para el monstruo
      let monsterEffects = this.statusEffects.get(`monster-${monster.id}`);
      if (!monsterEffects) {
        monsterEffects = {};
        this.statusEffects.set(`monster-${monster.id}`, monsterEffects);
      }
      
      // Potencia del debuff basada en nivel y evolución
      const debuffPotency = adventurer.debuffPotency || 
                          (adventurer.isEvolved ? 0.3 : 0.2);
      
      const debuffDuration = adventurer.debuffDuration || 
                           (adventurer.isEvolved ? 3 : 2);
      
      // Tipo de debuff aleatorio o predeterminado
      let debuffType = "";
      if (adventurer.class === "Archimago") {
        // Los archimagos pueden aplicar múltiples debuffs
        if (Math.random() < 0.3) {
          debuffType = "multiple";
        } else {
          debuffType = ["weakness", "vulnerability", "slow"][Math.floor(Math.random() * 3)];
        }
      } else {
        debuffType = ["weakness", "vulnerability", "slow"][Math.floor(Math.random() * 3)];
      }
      
      // Aplicar debuff según el tipo
      if (debuffType === "weakness" || debuffType === "multiple") {
        monsterEffects.weakness = debuffDuration;
        monsterEffects.weaknessAmount = debuffPotency;
        this.battleLog.push(`🔮 ${monster.name} ha sido debilitado (${Math.floor(debuffPotency*100)}% menos de daño).`);
      }
      
      if (debuffType === "vulnerability" || debuffType === "multiple") {
        monsterEffects.vulnerability = debuffDuration;
        monsterEffects.vulnerabilityAmount = debuffPotency;
        this.battleLog.push(`🔮 ${monster.name} es más vulnerable (${Math.floor(debuffPotency*100)}% más daño recibido).`);
      }
      
      if (debuffType === "slow" || debuffType === "multiple") {
        monsterEffects.slowed = debuffDuration;
        this.battleLog.push(`🔮 ${monster.name} ha sido ralentizado.`);
      }
    }
    
    // Otros efectos especiales
    if (effects.includes("piercing")) {
      this.battleLog.push(`🏹 La flecha penetrante de ${adventurer.name} ignora parte de la armadura.`);
    }
    
    if (effects.includes("aoe")) {
      this.battleLog.push(`💫 El hechizo de área de ${adventurer.name} afecta a los enemigos cercanos.`);
      // Aquí podría ir lógica para dañar monstruos cercanos
      this.applyAreaDamage(adventurer, monster.position, Math.floor(adventurer.damage * 0.4));
    }
  }
  
  /**
   * Aplica daño de área a monstruos cercanos
   * @param {Object} source - La fuente del daño
   * @param {Object} centerPosition - Posición central {x, y}
   * @param {number} damage - Cantidad de daño
   */
  applyAreaDamage(source, centerPosition, damage) {
    // Buscar monstruos en las 8 celdas adyacentes
    const directions = [
      {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
      {x: -1, y: 0},                  {x: 1, y: 0},
      {x: -1, y: 1},  {x: 0, y: 1},   {x: 1, y: 1}
    ];
    
    let targetsHit = 0;
    
    for (const dir of directions) {
      const x = centerPosition.x + dir.x;
      const y = centerPosition.y + dir.y;
      
      // Verificar límites del mapa
      if (x < 0 || y < 0 || y >= this.dungeon.length || x >= this.dungeon[y].length) {
        continue;
      }
      
      const cell = this.dungeon[y][x];
      
      // Si hay un monstruo, aplicar daño
      if (cell && cell.type === 'monster' && !cell.item.isDead) {
        const damageResult = cell.item.takeDamage(damage);
        this.battleLog.push(`El ataque de área causa ${damageResult.damage} puntos de daño a ${cell.item.name}.`);
        
        // Actualizar estadísticas
        this.battleStats.damageDealt += damageResult.damage;
        targetsHit++;
        
        // Verificar si el monstruo muere
        if (damageResult.isDead) {
          this.battleLog.push(`💀 ${cell.item.name} ha sido derrotado por el ataque de área.`);
          this.battleStats.monstersKilled++;
          
          // Actualizar celda
          this.updateDungeonCell(x, y, cell);
        }
      }
    }
    
    if (targetsHit > 0) {
      this.battleLog.push(`El ataque de área afectó a ${targetsHit} objetivos adicionales.`);
    }
  }
  
  /**
   * Maneja el contraataque de un monstruo
   * @param {Object} monster - El monstruo
   * @param {Object} adventurer - El aventurero
   * @param {Object} position - Posición del monstruo
   * @returns {Promise<void>}
   */
  async handleMonsterCounterAttack(monster, adventurer, position) {
    if (monster.cooldown <= 0) {
      this.battleLog.push(`🔄 ${monster.name} contraataca a ${adventurer.name}.`);
      
      const counterAttack = monster.attack(adventurer);
      
      if (counterAttack.success) {
        let counterAttackMessage = `${monster.name} ataca a ${adventurer.name}`;
        
        // Mensajes específicos para efectos especiales
        if (counterAttack.tacticMessage) {
          counterAttackMessage += counterAttack.tacticMessage;
        }
        
        if (counterAttack.effects.includes('critical')) {
          counterAttackMessage += " con un ¡GOLPE CRÍTICO!";
          this.battleStats.criticalHits++;
        } else if (counterAttack.effects.includes('fireBreath')) {
          counterAttackMessage += " con su aliento de fuego";
        } else if (counterAttack.effects.includes('poison')) {
          counterAttackMessage += " con veneno";
        }
        
        // Aplicar daño al aventurero
        const adventurerDamageResult = adventurer.takeDamage(counterAttack.damage);
        
        // Actualizar estadísticas
        this.battleStats.damageReceived += adventurerDamageResult.damage || 0;
        
        if (adventurerDamageResult.evaded) {
          this.battleLog.push(`🛡️ ${adventurer.name} evade el ataque de ${monster.name}.`);
          
          // Contraataque del Caballero
          if (adventurer.class === "Caballero" && adventurer.counterAttackChance && 
              Math.random() < adventurer.counterAttackChance) {
            const bonusDamage = Math.floor(adventurer.damage * 0.6);
            const counterResult = monster.takeDamage(bonusDamage);
            this.battleLog.push(`⚔️ ${adventurer.name} contraataca causando ${bonusDamage} puntos de daño.`);
            
            // Actualizar estadísticas
            this.battleStats.damageDealt += bonusDamage;
            
            if (counterResult.isDead) {
              this.battleLog.push(`💀 ${monster.name} ha sido derrotado por el contraataque de ${adventurer.name}.`);
              this.battleStats.monstersKilled++;
              await this.moveAdventurer(adventurer, position);
              return;
            }
          }
        } else {
          this.battleLog.push(
            `${counterAttackMessage} causando ${adventurerDamageResult.damage} puntos de daño.`
          );
          
          // Mostrar salud restante
          this.battleLog.push(`${adventurer.name} tiene ${adventurer.health}/${adventurer.maxHealth} puntos de vida.`);
          
          // Aplicar efectos adicionales
          this.applyMonsterEffects(monster, adventurer, counterAttack.effects);
          
          // Verificar si el aventurero muere
          if (adventurer.isDead) {
            this.battleLog.push(`💀 ${adventurer.name} ha sido derrotado por ${monster.name}.`);
            
            // Verificar posibilidad de resurrección (Sacerdote)
            if (this.checkForResurrection(adventurer)) {
              this.battleLog.push(`✨ ¡${adventurer.name} ha sido resucitado por un Sacerdote!`);
              adventurer.isDead = false;
              adventurer.health = Math.floor(adventurer.maxHealth * 0.3);
            } else {
              // Añadir efectos visuales o sonoros de derrota
              this.onBattleUpdate({
                type: 'adventurerDefeated',
                adventurer: adventurer
              });
            }
          }
          
          // Curación después del combate (Clérigos/Sacerdotes)
          if (!adventurer.isDead && 
              (adventurer.class === "Clérigo" || adventurer.class === "Sacerdote") && 
              adventurer.health < adventurer.maxHealth * 0.5 && 
              adventurer.healCooldown <= 0) {
            
            const healResult = adventurer.heal();
            if (healResult && healResult.healed) {
              this.battleLog.push(healResult.message || 
                `🌟 ${adventurer.name} se cura por ${healResult.amount} puntos.`);
              
              // Actualizar estadísticas
              this.battleStats.healingDone += healResult.amount;
            }
            
            // Sanar a compañeros cercanos (solo Sacerdotes)
            if (adventurer.class === "Sacerdote" && adventurer.healRadius > 0) {
              await this.healNearbyAllies(adventurer);
            }
          }
        }
      }
    } else {
      this.battleLog.push(`⏱️ ${monster.name} está recargando y no puede atacar (${monster.cooldown} turnos restantes).`);
    }
  }
  
  /**
   * Método auxiliar para curar aliados cercanos (usado por Sacerdotes)
   * @param {Object} healer - El aventurero sanador
   * @returns {Promise<void>}
   */
  async healNearbyAllies(healer) {
    // Buscar aventureros cercanos
    const allies = this.adventurers.filter(ally => 
      !ally.isDead && 
      ally.id !== healer.id &&
      Math.abs(ally.position.x - healer.position.x) <= healer.healRadius &&
      Math.abs(ally.position.y - healer.position.y) <= healer.healRadius
    );
    
    for (const ally of allies) {
      if (ally.health < ally.maxHealth) {
        const healResult = healer.heal(ally);
        if (healResult && healResult.healed) {
          this.battleLog.push(healResult.message || 
            `🌟 ${healer.name} cura a ${ally.name} por ${healResult.amount} puntos.`);
          
          // Actualizar estadísticas
          this.battleStats.healingDone += healResult.amount;
        }
      }
    }
  }
  
  /**
   * Método para verificar si un aventurero caído puede ser resucitado
   * @param {Object} fallenAdventurer - El aventurero caído
   * @returns {boolean} True si fue resucitado
   */
  checkForResurrection(fallenAdventurer) {
    // Buscar sacerdotes cercanos
    for (const ally of this.adventurers) {
      if (ally.isDead || ally.id === fallenAdventurer.id) continue;
      
      if (ally.class === "Sacerdote" && ally.resurrectionChance && 
          Math.abs(ally.position.x - fallenAdventurer.position.x) <= 1 &&
          Math.abs(ally.position.y - fallenAdventurer.position.y) <= 1) {
        
        // Verificar si la resurrección tiene éxito
        if (Math.random() < ally.resurrectionChance) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Maneja la interacción entre aventurero y trampa
   * @param {Object} adventurer - El aventurero
   * @param {Object} action - La acción a realizar
   * @returns {Promise<void>}
   */
  async handleAdventurerTrapInteraction(adventurer, action) {
    // Obtener la trampa en la posición
    const trap = this.getCellContent(action.x, action.y);
    
    if (!trap || trap.type !== 'trap') {
      // Si no hay trampa válida, simplemente mueve al aventurero
      await this.moveAdventurer(adventurer, action);
      return;
    }
    
    // Verificar si el aventurero puede desactivar la trampa (Ladrón/Asesino)
    if (adventurer.trapDisarmChance) {
      const disarmChance = adventurer.trapDisarmChance;
      // Mayor probabilidad de éxito en trampas de nivel bajo
      const levelFactor = Math.max(0, 1 - (trap.item.level * 0.15));
      const finalChance = disarmChance * levelFactor;
      
      // Intentar desactivar
      if (Math.random() < finalChance) {
        this.battleLog.push(`🔧 ${adventurer.name} desactiva ${trap.item.name} con precisión.`);
        
        // Desactivar la trampa permanentemente
        trap.item.isTriggered = true;
        trap.item.remainingUses = 0;
        
        // Actualizar el estado en el dungeon
        this.updateDungeonCell(action.x, action.y, trap);
        
        // Mover al aventurero sin daño
        await this.moveAdventurer(adventurer, action);
        return;
      } else {
        this.battleLog.push(`❌ ${adventurer.name} falla al intentar desactivar ${trap.item.name}.`);
        // Continuar normalmente si falla la desactivación
      }
    }
    
    // Activar la trampa
    const trapResult = trap.item.trigger(adventurer);
    
    if (!trapResult.triggered) {
      this.battleLog.push(`${adventurer.name} pasa sobre ${trap.item.name} pero no se activa.`);
      await this.moveAdventurer(adventurer, action);
      return;
    }
    
    if (trapResult.triggered) {
      this.battleLog.push(`⚠️ ${adventurer.name} activa ${trap.item.name} (${trap.item.type}).`);
      this.battleStats.trapsTriggered++;
    }
    
    // Aplicar efectos según el tipo de trampa
    if (trapResult.effects.includes('damage')) {
      const damageResult = adventurer.takeDamage(trapResult.damage);
      
      // Actualizar estadísticas
      this.battleStats.damageReceived += damageResult.damage || 0;
      
      if (damageResult.evaded) {
        this.battleLog.push(`🛡️ ${adventurer.name} evade el daño de la trampa.`);
      } else {
        this.battleLog.push(`💥 ${trap.item.name} causa ${trapResult.damage} puntos de daño a ${adventurer.name}.`);
        
        if (adventurer.isDead) {
          this.battleLog.push(`💀 ${adventurer.name} ha sido derrotado por ${trap.item.name}.`);
          return;
        }
      }
    }
    
    // Aplicar efectos específicos de la trampa
    this.applyTrapEffects(trap.item, adventurer, trapResult);
    
    // Mover al aventurero si no está atrapado
    const status = this.statusEffects.get(`adventurer-${adventurer.id}`);
    if (!status || !status.trapped) {
      await this.moveAdventurer(adventurer, action);
    }
    
    // Actualizar el estado de la trampa en el dungeon
    this.updateDungeonCell(action.x, action.y, trap);
  }
  
  /**
   * Aplica los efectos de la trampa al aventurero
   * @param {Object} trap - La trampa
   * @param {Object} adventurer - El aventurero
   * @param {Object} trapResult - Resultado de la activación
   */
  applyTrapEffects(trap, adventurer, trapResult) {
    // Obtener o crear objeto de efectos para este aventurero
    let effects = this.statusEffects.get(`adventurer-${adventurer.id}`);
    if (!effects) {
      effects = {};
      this.statusEffects.set(`adventurer-${adventurer.id}`, effects);
    }
    
    // Aplicar efectos según el tipo
    if (trapResult.effects.includes('trapped')) {
      effects.trapped = (effects.trapped || 0) + trapResult.trapDuration;
      this.battleLog.push(`${adventurer.name} queda atrapado durante ${trapResult.trapDuration} turnos.`);
    }
    
    if (trapResult.effects.includes('poison')) {
      effects.poisoned = (effects.poisoned || 0) + trapResult.poisonDuration;
      effects.poisonDamage = trapResult.poisonDamage;
      effects.poisonSource = trap.name;
      this.battleLog.push(`${adventurer.name} queda envenenado durante ${trapResult.poisonDuration} turnos.`);
    }
    
    if (trapResult.effects.includes('slow')) {
      effects.slowed = (effects.slowed || 0) + trapResult.slowDuration;
      this.battleLog.push(`${adventurer.name} queda ralentizado durante ${trapResult.slowDuration} turnos.`);
    }
    
    if (trapResult.effects.includes('stun')) {
      effects.stunned = (effects.stunned || 0) + trapResult.stunDuration;
      this.battleLog.push(`${adventurer.name} queda aturdido durante ${trapResult.stunDuration} turnos.`);
    }
  }
  
  /**
   * Aplica los efectos del monstruo al aventurero
   * @param {Object} monster - El monstruo
   * @param {Object} adventurer - El aventurero
   * @param {Array} effects - Los efectos a aplicar
   */
  applyMonsterEffects(monster, adventurer, effects) {
    if (!effects || effects.length === 0) return;
    
    // Obtener o crear objeto de efectos para este aventurero
    let statusEffects = this.statusEffects.get(`adventurer-${adventurer.id}`);
    if (!statusEffects) {
      statusEffects = {};
      this.statusEffects.set(`adventurer-${adventurer.id}`, statusEffects);
    }
    
    // Aplicar cada efecto con lógica mejorada
    for (const effect of effects) {
      switch (effect) {
        case "stun":
          // Probabilidad basada en el nivel del monstruo
          const stunChance = monster.stunChance || (monster.level * 0.05 + 0.1);
          if (Math.random() < stunChance) {
            const stunDuration = monster.level > 3 ? 2 : 1;
            statusEffects.stunned = (statusEffects.stunned || 0) + stunDuration;
            this.battleLog.push(`¡${adventurer.name} ha sido aturdido por ${monster.name} durante ${stunDuration} turnos!`);
          }
          break;
          
        case "poison":
          // Veneno mejorado - duración y daño basados en nivel
          const poisonDuration = Math.min(4, monster.level + 1);
          statusEffects.poisoned = (statusEffects.poisoned || 0) + poisonDuration;
          statusEffects.poisonDamage = monster.poisonDamage || Math.floor(monster.damage * 0.3);
          statusEffects.poisonSource = monster.name;
          this.battleLog.push(`¡${adventurer.name} ha sido envenenado por ${monster.name} durante ${poisonDuration} turnos!`);
          break;
          
        case "burn":
          // Quemadura mejorada - daño acumulativo
          const burnDuration = 2;
          statusEffects.burned = (statusEffects.burned || 0) + burnDuration;
          statusEffects.burnDamage = (statusEffects.burnDamage || 0) + 
                                    (monster.burnDamage || Math.floor(monster.damage * 0.25));
          statusEffects.burnSource = monster.name;
          this.battleLog.push(`¡${adventurer.name} ha sido quemado por ${monster.name}!`);
          break;
          
        case "ignore_evasion":
          // Efecto temporal que anula evasión
          statusEffects.cannotEvade = 2; // 2 turnos sin poder evadir
          this.battleLog.push(`¡${monster.name} impide que ${adventurer.name} pueda esquivar!`);
          break;
          
        case "adaptation":
          // El monstruo aprende y recibe bonificación contra este aventurero
          if (!monster.adaptationBonus) monster.adaptationBonus = {};
          monster.adaptationBonus[adventurer.id] = (monster.adaptationBonus[adventurer.id] || 0) + 0.1;
          this.battleLog.push(`${monster.name} está aprendiendo los patrones de ataque de ${adventurer.name}.`);
          break;
          
        case "berserk":
          // Frenesí que aumenta el daño pero reduce defensa
          statusEffects.monsterBerserk = { 
            monsterId: monster.id,
            duration: 3,
            damageMult: 1.5,
            defenseReduction: 0.3
          };
          this.battleLog.push(`¡${monster.name} entra en frenesí!`);
          break;
          
        case "focus":
          // Concentración para no fallar el próximo ataque
          monster.focusedAttack = true;
          this.battleLog.push(`${monster.name} se concentra intensamente en su objetivo.`);
          break;
          
        case "reveal":
          // Revelar ladrones
          if (adventurer.class === "Ladrón") {
            statusEffects.revealed = 2;
            statusEffects.evasionReduction = adventurer.evasion;
            this.battleLog.push(`¡${monster.name} ha revelado la posición de ${adventurer.name}!`);
          }
          break;
          
        case "magic_disruption":
          // Reducir efectividad mágica
          if (adventurer.class === "Mago") {
            statusEffects.magicDisrupted = 2;
            statusEffects.damageReduction = 0.3;
            this.battleLog.push(`¡${monster.name} interrumpe la concentración mágica de ${adventurer.name}!`);
          }
          break;
          
        case "armor_pierce":
          // Ignorar parte de la armadura
          statusEffects.armorReduction = 0.5; // Reduce efectividad de armadura 50%
          statusEffects.armorReductionDuration = 2;
          this.battleLog.push(`¡${monster.name} encuentra un punto débil en la armadura de ${adventurer.name}!`);
          break;
          
        case "combo":
          // Combo de varios golpes
          this.battleLog.push(`¡${monster.name} realiza una combinación devastadora de ataques!`);
          break;
      }
    }
  }
  
  /**
   * Mueve un aventurero a una nueva posición
   * @param {Object} adventurer - El aventurero
   * @param {Object} action - La acción de movimiento
   * @returns {Promise<void>}
   */
  async moveAdventurer(adventurer, action) {
    if (adventurer.isDead) return;
    
    // Guardar posición anterior
    const oldPosition = { ...adventurer.position };
    
    // Actualizar posición del aventurero
    adventurer.position = { x: action.x, y: action.y };
    
    // Actualizar visualización
    this.onBattleUpdate({
      type: 'adventurerMove',
      adventurer: adventurer,
      from: oldPosition,
      to: adventurer.position
    });
    
    this.battleLog.push(`${adventurer.name} se mueve a la posición (${action.x}, ${action.y}).`);
    
    // Actualizar caché de ruta al mover
    const pathKey = `${oldPosition.x},${oldPosition.y}-to-${this.playerPosition.x},${this.playerPosition.y}`;
    if (this.pathCache.has(pathKey)) {
      this.pathCache.delete(pathKey);
    }
  }
  
  /**
   * Procesa los turnos de los monstruos
   * @returns {Promise<void>}
   */
  async processMonsterTurns() {
    try {
      // Crear un mapa de posiciones ocupadas por aventureros para referencia rápida
      const adventurerPositions = new Map();
      this.adventurers.forEach(adv => {
        if (!adv.isDead) {
          adventurerPositions.set(`${adv.position.x},${adv.position.y}`, adv);
        }
      });
      
      // Analizar cada monstruo y sus alrededores
      const monsterActions = [];
      
      // Recorrer toda la mazmorra buscando monstruos
      for (let y = 0; y < this.dungeon.length; y++) {
        for (let x = 0; x < this.dungeon[y].length; x++) {
          const cell = this.dungeon[y][x];
          
          if (cell && cell.type === 'monster' && !cell.item.isDead) {
            // Actualizar posición para referencia
            cell.item.position = { x, y };
            
            // Actualizar cooldowns
            cell.item.updateCooldowns();
            
            // Regenerar vida si tiene esa habilidad
            if (cell.item.regeneration) {
              const regResult = cell.item.regenerate();
              if (regResult && regResult.regenerated) {
                this.battleLog.push(`${cell.item.name} regenera ${regResult.amount} puntos de vida.`);
                this.battleStats.healingDone += regResult.amount;
              }
            }
            
            // Buscar aventureros cercanos para analizar
            const targets = this.findNearbyAdventurers(x, y, 2); // Aumentado a 2 para mejor visión táctica
            
            // Tomar decisión táctica
            const tacticDecision = cell.item.decideTactic(targets, this.dungeon);
            
            // Almacenar acción para ejecución coordinada
            monsterActions.push({
              monster: cell.item,
              position: { x, y },
              decision: tacticDecision
            });
          }
        }
      }
      
      // Ordenar acciones: primero los ataques de área, luego por nivel de amenaza
      monsterActions.sort((a, b) => {
        // Primero ataques de área
        if (a.decision.action === "area_attack" && b.decision.action !== "area_attack") {
          return -1;
        }
        if (b.decision.action === "area_attack" && a.decision.action !== "area_attack") {
          return 1;
        }
        
        // Después por nivel del monstruo (los más poderosos primero)
        return b.monster.level - a.monster.level;
      });
      
      // Ejecutar acciones de monstruos en orden estratégico
      for (const action of monsterActions) {
        const { monster, position, decision } = action;
        
        // Mensajes tácticos según la decisión
        if (decision.reason) {
          this.battleLog.push(`${monster.name} ${this.getTacticDescription(decision.reason)}`);
        }
        
        // Procesar según tipo de acción
        await this.executeMonsterAction(monster, position, decision);
      }
    } catch (error) {
      console.error('Error en turnos de monstruos:', error);
      this.battleLog.push(`Error en turnos de monstruos: ${error.message}`);
    }
  }
  
  /**
   * Ejecuta la acción decidida por un monstruo
   * @param {Object} monster - El monstruo
   * @param {Object} position - La posición del monstruo
   * @param {Object} decision - La decisión táctica
   * @returns {Promise<void>}
   */
  async executeMonsterAction(monster, position, decision) {
    try {
      switch (decision.action) {
        case "attack":
          if (decision.target && !decision.target.isDead && monster.cooldown <= 0) {
            const attackResult = monster.attack(decision.target);
            
            if (attackResult.success) {
              // Mensaje táctico personalizado
              let attackMessage = `${monster.name} ataca a ${decision.target.name}`;
              if (attackResult.tacticMessage) {
                attackMessage += ` y${attackResult.tacticMessage}`;
              }
              
              const damageResult = decision.target.takeDamage(attackResult.damage);
              
              if (damageResult.evaded) {
                this.battleLog.push(`${decision.target.name} evade el ataque de ${monster.name}.`);
                // Registrar el fallo para mejorar precisión futura
                monster.missedAttacks = (monster.missedAttacks || 0) + 1;
              } else {
                this.battleLog.push(
                  `${attackMessage} causando ${attackResult.damage} puntos de daño.`
                );
                
                // Actualizar estadísticas
                this.battleStats.damageReceived += attackResult.damage;
                
                // Registrar daño causado para memoria de combate
                if (!monster.damageDealt) monster.damageDealt = {};
                monster.damageDealt[decision.target.id] = 
                  (monster.damageDealt[decision.target.id] || 0) + attackResult.damage;
                
                // Aplicar efectos adicionales
                this.applyMonsterEffects(monster, decision.target, attackResult.effects);
                
                // Verificar si el aventurero muere
                if (decision.target.isDead) {
                  this.battleLog.push(`${decision.target.name} ha sido derrotado.`);
                }
              }
            }
          }
          break;
          
        case "area_attack":
          if (monster.cooldown <= 0) {
            this.battleLog.push(`${monster.name} realiza un ataque de área.`);
            
            // Aplicar daño a todos los objetivos
            for (const target of decision.targets) {
              if (!target.isDead) {
                const attackResult = monster.attack(target);
                
                if (attackResult.success) {
                  const damageResult = target.takeDamage(attackResult.damage);
                  
                  // Actualizar estadísticas
                  this.battleStats.damageReceived += damageResult.damage || 0;
                  
                  if (damageResult.evaded) {
                    this.battleLog.push(`${target.name} evade el ataque de área.`);
                  } else {
                    this.battleLog.push(
                      `El ataque de ${monster.name} causa ${attackResult.damage} puntos de daño a ${target.name}.`
                    );
                    
                    // Aplicar efectos
                    this.applyMonsterEffects(monster, target, attackResult.effects);
                    
                    if (target.isDead) {
                      this.battleLog.push(`${target.name} ha sido derrotado.`);
                    }
                  }
                }
              }
            }
          }
          break;
          
        case "defensive":
          // Acciones defensivas
          this.battleLog.push(`${monster.name} adopta una postura defensiva.`);
          // Aumentar temporalmente defensa
          monster.tempDefenseBonus = 0.25; // +25% defensa por un turno
          break;
          
        case "wait":
          // El monstruo espera (no hay objetivos válidos)
          break;
      }
      
      // Actualizar el monstruo en el dungeon
      this.updateDungeonCell(position.x, position.y, {
        type: 'monster',
        item: monster
      });
    } catch (error) {
      console.error(`Error ejecutando acción de monstruo ${monster.name}:`, error);
      // Continuar con el siguiente monstruo
    }
  }

  /**
   * Método auxiliar para describir tácticas
   * @param {string} reason - Razón de la táctica
   * @returns {string} Descripción de la táctica
   */
  getTacticDescription(reason) {
    switch(reason) {
      case "regenerate": return "se concentra en regenerar sus heridas";
      case "opportunity": return "busca una presa fácil";
      case "vulnerability": return "detecta una debilidad";
      case "maximize_damage": return "prepara un ataque devastador";
      case "eliminate_threat": return "se centra en eliminar la mayor amenaza";
      default: return "planea su siguiente movimiento";
    }
  }
  
  /**
   * Encuentra aventureros cercanos a una posición
   * @param {number} x - Coordenada X
   * @param {number} y - Coordenada Y
   * @param {number} range - Rango de búsqueda
   * @returns {Array} Lista de aventureros ordenados por cercanía
   */
  findNearbyAdventurers(x, y, range = 1) {
    const targets = [];
    
    for (const adventurer of this.adventurers) {
      if (adventurer.isDead) continue;
      
      // Calcular distancia Manhattan
      const distance = Math.abs(adventurer.position.x - x) + Math.abs(adventurer.position.y - y);
      
      if (distance <= range) {
        targets.push({
          adventurer: adventurer,
          distance: distance
        });
      }
    }
    
    // Ordenar por cercanía
    targets.sort((a, b) => a.distance - b.distance);
    
    return targets;
  }
  
  /**
   * Actualiza las trampas
   */
  updateTraps() {
    for (let y = 0; y < this.dungeon.length; y++) {
      for (let x = 0; x < this.dungeon[y].length; x++) {
        const cell = this.dungeon[y][x];
        
        if (cell && cell.type === 'trap' && cell.item) {
          // Verificar que el objeto trampa tenga el método reset
          if (cell.item.isTriggered && typeof cell.item.reset === 'function') {
            const resetSuccessful = cell.item.reset();
            
            if (resetSuccessful) {
              this.battleLog.push(`${cell.item.name} en (${x}, ${y}) se ha rearmado.`);
            }
          }
          
          // Actualizar la trampa en el dungeon
          this.updateDungeonCell(x, y, cell);
        }
      }
    }
  }
  
  /**
   * Verifica si una posición está en una sala o habitación especial
   * @param {Object} position - Posición {x, y}
   * @returns {Object|null} Información de la sala o null
   */
  isInSpecialRoom(position) {
    // Verificar habitaciones
    for (const room of this.dungeon.rooms || []) {
      if (position.x >= room.x && position.x < room.x + 2 &&
          position.y >= room.y && position.y < room.y + 2) {
        return { type: 'room' };
      }
    }
    
    // Verificar salas
    for (const hall of this.dungeon.halls || []) {
      if (position.x >= hall.x && position.x < hall.x + 3 &&
          position.y >= hall.y && position.y < hall.y + 3) {
        return { type: 'hall' };
      }
    }
    
    return null;
  }

  /**
   * Procesa los efectos de estado al inicio del turno
   */
  processStatusEffects() {
    // Procesar efectos en aventureros
    for (const [key, effects] of this.statusEffects.entries()) {
      // Extraer el ID del aventurero
      const match = key.match(/adventurer-(\d+)/);
      if (!match) continue;
      
      const adventurerId = parseInt(match[1]);
      const adventurer = this.adventurers.find(a => a.id === adventurerId);
      
      if (!adventurer || adventurer.isDead) continue;
      
      // Aplicar cada efecto con mensajes mejorados
      this.processAdventurerStatusEffects(adventurer, effects);
    }
    
    // Procesar efectos en monstruos
    this.processMonsterStatusEffects();
  }
  
  /**
   * Procesa efectos de estado para un aventurero
   * @param {Object} adventurer - El aventurero
   * @param {Object} effects - Los efectos activos
   */
  processAdventurerStatusEffects(adventurer, effects) {
    // Veneno con mensajes informativos
    if (effects.poisoned > 0) {
      const poisonDamage = effects.poisonDamage || 3;
      const source = effects.poisonSource || "veneno";
      
      // Intentar resistir el veneno (Clérigos tienen posibilidad)
      let resistedPoison = false;
      if (adventurer.class === "Clérigo" && Math.random() < 0.3) {
        resistedPoison = true;
        this.battleLog.push(`${adventurer.name} resiste parcialmente el veneno con sus poderes curativos.`);
      }
      
      const actualDamage = resistedPoison ? Math.floor(poisonDamage / 2) : poisonDamage;
      const damageResult = adventurer.takeDamage(actualDamage);
      
      // Actualizar estadísticas
      this.battleStats.damageReceived += actualDamage;
      
      this.battleLog.push(`${adventurer.name} sufre ${actualDamage} puntos de daño por el veneno de ${source}.`);
      
      if (adventurer.isDead) {
        this.battleLog.push(`${adventurer.name} ha muerto envenenado.`);
      }
      
      effects.poisoned--;
      if (effects.poisoned <= 0) {
        this.battleLog.push(`El veneno en ${adventurer.name} se ha disipado.`);
        delete effects.poisoned;
        delete effects.poisonDamage;
        delete effects.poisonSource;
      }
    }
    
    // Quemaduras con sistema de intensidad
    if (effects.burned > 0) {
      const burnDamage = effects.burnDamage || 3;
      const source = effects.burnSource || "fuego";
      const damageResult = adventurer.takeDamage(burnDamage);
      
      // Actualizar estadísticas
      this.battleStats.damageReceived += burnDamage;
      
      // Mensajes según intensidad
      if (burnDamage > 10) {
        this.battleLog.push(`${adventurer.name} sufre quemaduras severas (${burnDamage} daño).`);
      } else {
        this.battleLog.push(`${adventurer.name} sufre ${burnDamage} puntos de daño por quemaduras.`);
      }
      
      if (adventurer.isDead) {
        this.battleLog.push(`${adventurer.name} ha muerto calcinado.`);
      }
      
      effects.burned--;
      if (effects.burned <= 0) {
        this.battleLog.push(`Las llamas que quemaban a ${adventurer.name} se han extinguido.`);
        delete effects.burned;
        delete effects.burnDamage;
        delete effects.burnSource;
      }
    }
    
    // Trampa con intentos de escape
    if (effects.trapped > 0) {
      // Intentar escapar (Ladrones tienen ventaja)
      let escapeChance = 0.1; // 10% base
      if (adventurer.class === "Ladrón") escapeChance = 0.35;
      if (adventurer.class === "Asesino") escapeChance = 0.5;
      
      if (Math.random() < escapeChance) {
        this.battleLog.push(`¡${adventurer.name} logra liberarse de la trampa!`);
        delete effects.trapped;
      } else {
        effects.trapped--;
        if (effects.trapped <= 0) {
          this.battleLog.push(`${adventurer.name} ha escapado de la trampa.`);
          delete effects.trapped;
        } else {
          this.battleLog.push(`${adventurer.name} sigue atrapado (${effects.trapped} turnos restantes).`);
        }
      }
    }
    
    // Aturdimiento con efectos visuales
    if (effects.stunned > 0) {
      effects.stunned--;
      if (effects.stunned <= 0) {
        this.battleLog.push(`${adventurer.name} recupera la compostura.`);
        delete effects.stunned;
      } else {
        this.battleLog.push(`${adventurer.name} está aturdido (${effects.stunned} turnos).`);
      }
    }
    
    // Ralentización
    if (effects.slowed > 0) {
      effects.slowed--;
      if (effects.slowed <= 0) {
        this.battleLog.push(`${adventurer.name} recupera su velocidad normal.`);
        delete effects.slowed;
      }
    }
    
    // Efectos especiales adicionales
    if (effects.cannotEvade > 0) {
      effects.cannotEvade--;
      if (effects.cannotEvade <= 0) {
        this.battleLog.push(`${adventurer.name} recupera su capacidad de evasión.`);
        delete effects.cannotEvade;
      }
    }
    
    if (effects.revealed > 0) {
      effects.revealed--;
      if (effects.revealed <= 0) {
        this.battleLog.push(`${adventurer.name} vuelve a ocultarse en las sombras.`);
        delete effects.revealed;
        delete effects.evasionReduction;
      }
    }
    
    if (effects.magicDisrupted > 0) {
      effects.magicDisrupted--;
      if (effects.magicDisrupted <= 0) {
        this.battleLog.push(`${adventurer.name} recupera su concentración mágica.`);
        delete effects.magicDisrupted;
        delete effects.damageReduction;
      }
    }
    
    if (effects.armorReductionDuration > 0) {
      effects.armorReductionDuration--;
      if (effects.armorReductionDuration <= 0) {
        this.battleLog.push(`La armadura de ${adventurer.name} ha sido reparada.`);
        delete effects.armorReduction;
        delete effects.armorReductionDuration;
      }
    }
  }
  
  /**
   * Procesa efectos de estado para monstruos
   */
  processMonsterStatusEffects() {
    for (let y = 0; y < this.dungeon.length; y++) {
      for (let x = 0; x < this.dungeon[y].length; x++) {
        const cell = this.dungeon[y][x];
        
        if (cell && cell.type === 'monster' && !cell.item.isDead) {
          const monster = cell.item;
          
          // Procesar efectos específicos de monstruos
          if (monster.focusedAttack) {
            this.battleLog.push(`${monster.name} mantiene su concentración para el próximo ataque.`);
            // Se limpiará después de un ataque
          }
          
          // Limpiar bonificaciones temporales de defensa después de un turno
          if (monster.tempDefenseBonus) {
            delete monster.tempDefenseBonus;
          }
          
          // Limpiar bonificaciones temporales de daño después de un turno
          if (monster.tempDamageBonus) {
            delete monster.tempDamageBonus;
          }
          
          // Procesar debuffs específicos de monstruos
          const monsterEffects = this.statusEffects.get(`monster-${monster.id}`);
          if (monsterEffects) {
            // Debilidad
            if (monsterEffects.weakness > 0) {
              monsterEffects.weakness--;
              if (monsterEffects.weakness <= 0) {
                this.battleLog.push(`${monster.name} recupera su fuerza normal.`);
                delete monsterEffects.weakness;
                delete monsterEffects.weaknessAmount;
              }
            }
            
            // Vulnerabilidad
            if (monsterEffects.vulnerability > 0) {
              monsterEffects.vulnerability--;
              if (monsterEffects.vulnerability <= 0) {
                this.battleLog.push(`${monster.name} ya no está vulnerable.`);
                delete monsterEffects.vulnerability;
                delete monsterEffects.vulnerabilityAmount;
              }
            }
            
            // Ralentización
            if (monsterEffects.slowed > 0) {
              monsterEffects.slowed--;
              if (monsterEffects.slowed <= 0) {
                this.battleLog.push(`${monster.name} recupera su velocidad normal.`);
                delete monsterEffects.slowed;
              }
            }
          }
          
          // Guardar posición para referencia en el próximo turno
          monster.lastPosition = { x, y };
        }
      }
    }
  }
  
  /**
   * Obtiene el contenido de una celda
   * @param {number} x - Coordenada X
   * @param {number} y - Coordenada Y
   * @returns {Object|null} Contenido de la celda o null
   */
  getCellContent(x, y) {
    if (x < 0 || y < 0 || y >= this.dungeon.length || x >= this.dungeon[y].length) {
      return null;
    }
    
    return this.dungeon[y][x];
  }
  
  /**
   * Actualiza una celda en el dungeon
   * @param {number} x - Coordenada X
   * @param {number} y - Coordenada Y
   * @param {Object} content - Nuevo contenido
   */
  updateDungeonCell(x, y, content) {
    if (x < 0 || y < 0 || y >= this.dungeon.length || x >= this.dungeon[y].length) {
      console.warn('Intento de actualizar celda fuera de límites:', x, y);
      return;
    }
    
    this.dungeon[y][x] = content;
    
    // Notificar de la actualización
    this.onBattleUpdate({
      type: 'cellUpdate',
      x: x,
      y: y,
      content: content
    });
  }
  
  /**
   * Verifica si todos los aventureros están muertos (victoria)
   * @returns {boolean} True si todos están muertos
   */
  checkVictory() {
    return this.adventurers.every(adventurer => adventurer.isDead);
  }
  
  /**
   * Verifica si algún aventurero ha llegado al jefe (derrota)
   * @returns {boolean} True si hay derrota
   */
  checkDefeat() {
    if (!this.playerPosition) return false;
    
    // Buscar si algún aventurero ha alcanzado la posición del jefe
    const defeatDetected = this.adventurers.some(adventurer => 
      !adventurer.isDead && 
      adventurer.position.x === this.playerPosition.x && 
      adventurer.position.y === this.playerPosition.y
    );
    
    return defeatDetected;
  }
  
  /**
   * Obtiene los resultados y recompensas de la batalla
   * @returns {Object} Resultados detallados
   */
  getBattleResults() {
    // Si no hay aventureros para analizar, devolver resultados básicos
    if (!this.adventurers || this.adventurers.length === 0) {
      return {
        state: this.battleState || 'unknown',
        turns: this.turnCounter || 0,
        adventurersSurvived: 0,
        totalAdventurers: 0,
        goldReward: 0,
        experienceReward: 0,
        stats: this.battleStats,
        log: this.battleLog || []
      };
    }
  
    const adventurersSurvived = this.adventurers.filter(a => !a.isDead).length;
    const totalAdventurers = this.adventurers.length;
    const efficiency = Math.max(0, 1 - (this.turnCounter / 20)); // Eficiencia basada en turnos
    
    // Factores de escalado basados en el día y nivel promedio
    const currentDay = this.dungeon.currentDay || 1;
    const averageLevel = this.adventurers.reduce((sum, adv) => sum + adv.level, 0) / totalAdventurers;
    const difficultyFactor = Math.pow(1.1, averageLevel) * (1 + (currentDay * 0.05));
    
    let goldReward = 0;
    let experienceReward = 0;
    
    // Recompensas basadas en el desempeño y estado de aventureros
    for (const adventurer of this.adventurers) {
      // Factor de valor basado en nivel y evolución
      const valueFactor = adventurer.level * (adventurer.isEvolved ? 1.5 : 1.0);
      
      if (adventurer.isDead) {
        // Recompensa completa por victoria
        goldReward += Math.floor(adventurer.gold * valueFactor);
        experienceReward += Math.floor(adventurer.experienceValue * valueFactor);
      } else {
        // Recompensa parcial por daño causado
        const healthLost = adventurer.maxHealth - adventurer.health;
        const damagePercentage = healthLost / adventurer.maxHealth;
        
        // Curva de recompensa mejorada - recompensa significativa incluso por daño parcial
        let rewardMultiplier = 0;
        if (damagePercentage >= 0.7) {
          rewardMultiplier = 0.8; // 80% de recompensa si le quitaste 70% o más de vida
        } else if (damagePercentage >= 0.4) {
          rewardMultiplier = 0.5; // 50% de recompensa si le quitaste 40-70% de vida
        } else if (damagePercentage >= 0.2) {
          rewardMultiplier = 0.3; // 30% de recompensa si le quitaste 20-40% de vida
        } else {
          rewardMultiplier = damagePercentage; // Recompensa proporcional al daño
        }
        
        goldReward += Math.floor(adventurer.gold * rewardMultiplier * valueFactor);
        experienceReward += Math.floor(adventurer.experienceValue * rewardMultiplier * valueFactor);
      }
    }
    
    // Calcular recompensas base garantizadas (proporcionales al día y nivel)
    const baseGoldReward = 15 * currentDay * (1 + (averageLevel * 0.2));
    const baseExpReward = 10 * currentDay * (1 + (averageLevel * 0.3));
    
    // Aplicar bonificación por eficiencia
    goldReward = Math.floor(goldReward * (1 + (efficiency * 0.3)));
    experienceReward = Math.floor(experienceReward * (1 + (efficiency * 0.4)));
    
    // En caso de derrota, reducir las recompensas pero mantener una cantidad mínima
    if (this.battleState === 'defeat') {
      goldReward = Math.floor(goldReward * 0.5);
      experienceReward = Math.floor(experienceReward * 0.6);
    }
    // Bono por victoria total
    else if (adventurersSurvived === 0) {
      goldReward = Math.floor(goldReward * 1.5);
      experienceReward = Math.floor(experienceReward * 1.3);
    }
    
    // Asegurar recompensas mínimas siempre
    goldReward = Math.max(goldReward, Math.floor(baseGoldReward));
    experienceReward = Math.max(experienceReward, Math.floor(baseExpReward));
    
    // Analizar log para estadísticas adicionales
    const monstersKilled = this.battleStats.monstersKilled;
    const trapsTriggered = this.battleStats.trapsTriggered;
    const criticalHits = this.battleStats.criticalHits;
    
    // Calcular bonificaciones por uso de salas y habitaciones
    const roomsUsed = this.dungeon.rooms && this.dungeon.rooms.length > 0;
    const hallsUsed = this.dungeon.halls && this.dungeon.halls.length > 0;
    
    // Aplicar bonificaciones por uso de estructuras
    if (roomsUsed) {
      goldReward = Math.floor(goldReward * 1.1);
      experienceReward = Math.floor(experienceReward * 1.05);
    }
    
    if (hallsUsed) {
      goldReward = Math.floor(goldReward * 1.15);
      experienceReward = Math.floor(experienceReward * 1.1);
    }
    
    // Retornar resultados enriquecidos
    return {
      state: this.battleState,
      turns: this.turnCounter,
      adventurersSurvived: adventurersSurvived,
      totalAdventurers: totalAdventurers,
      goldReward: goldReward,
      experienceReward: experienceReward,
      efficiency: Math.floor(efficiency * 100),
      // Estadísticas detalladas
      stats: {
        ...this.battleStats,
        monstersKilled,
        trapsTriggered,
        criticalHits
      },
      structuresUsed: {
        roomsUsed,
        hallsUsed,
        roomCount: this.dungeon.rooms?.length || 0,
        hallCount: this.dungeon.halls?.length || 0
      },
      log: this.battleLog
    };
  }
  
  /**
   * Utilidad para crear retrasos (para animaciones)
   * @param {number} ms - Milisegundos de espera
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BattleManager;