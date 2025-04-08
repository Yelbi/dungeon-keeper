import PathFinder from './PathFinder';

// src/models/Adventurer.js
class Adventurer {
  constructor(id, level, day) {
    this.id = id;
    this.name = this.generateName();
    this.level = level || 1;
    this.day = day;
    this.pathCache = {};
    this.lastPathUpdate = 0;
    // Propiedades base que escalan con el día
    this.maxHealth = 25 + (day * 5) + (this.level * 10);
    this.health = this.maxHealth;
    this.damage = 5 + Math.floor(day / 2) + (this.level * 2);
    this.position = { x: 0, y: 0 }; // Posición inicial (entrada)
    this.isDead = false;
    this.gold = 10 + (day * 3) + (this.level * 5);
    this.experienceValue = 5 + (day * 2) + (this.level * 3);
    
    // NUEVO: Estado de evolución
    this.isEvolved = false;
    
    // Características especiales
    this.class = this.generateClass();
    this.applyClassBonus();
    
    // Comportamiento en la IA
    this.preferredTargets = this.determinePreferredTargets();
    
    // NUEVO: Verificar si debe evolucionar
    this.checkEvolution();
    this.combatStats = {
      damageDealt: 0,
      damageReceived: 0,
      criticalHits: 0,
      evades: 0,
      kills: 0,
      trapsDisarmed: 0,
      healingDone: 0
    };
  }
  
  // NUEVO: Método para verificar y aplicar evolución
  checkEvolution() {
    // Evolucionar basado en nivel y día
    // Probabilidad de evolución aumenta con el día y nivel
    const evolutionThreshold = this.day >= 5 ? 0.4 : 0.2;
    const evolutionChance = (this.level - 1) * 0.15 + (this.day / 20);
    
    if (this.level >= 3 && Math.random() < evolutionChance && evolutionChance > evolutionThreshold) {
      this.evolve();
    }
  }
  
  // NUEVO: Método para evolucionar al aventurero
  evolve() {
    this.isEvolved = true;
    
    // Bonificación base por evolución
    this.maxHealth = Math.floor(this.maxHealth * 1.4);
    this.health = this.maxHealth;
    this.damage = Math.floor(this.damage * 1.3);
    this.gold = Math.floor(this.gold * 1.5);
    this.experienceValue = Math.floor(this.experienceValue * 1.5);
    
    // Evolucionar la clase
    switch (this.class) {
      case "Guerrero":
        this.class = "Caballero";
        break;
      case "Mago":
        this.class = "Archimago";
        break;
      case "Ladrón":
        this.class = "Asesino";
        break;
      case "Clérigo":
        this.class = "Sacerdote";
        break;
      case "Arquero":
        this.class = "Francotirador";
        break;
    }
    
    // Aplicar bonificaciones adicionales basadas en la nueva clase
    this.applyEvolvedClassBonus();
    
    // Actualizar nombre para reflejar evolución
    this.name = `${this.name} el ${this.class}`;
  }
  
  // NUEVO: Bonificaciones específicas para clases evolucionadas
  applyEvolvedClassBonus() {
    switch (this.class) {
      case "Caballero":
        // Mejora de armadura y resistencia
        this.damageReduction = 0.3; // 30% reducción de daño
        this.counterAttackChance = 0.2; // 20% de contraatacar
        this.maxHealth = Math.floor(this.maxHealth * 1.2);
        this.health = this.maxHealth;
        break;
        
      case "Archimago":
        // Mejora de poderes mágicos y debuffs
        this.hasMagicAttack = true;
        this.magicPower = 1.8; // 80% más poder mágico
        this.spellPenetration = 0.25; // Ignora 25% de resistencias
        this.debuffPotency = 0.4; // Debuffs 40% más potentes
        this.aoeAttackChance = 0.3; // 30% de causar daño en área
        break;
        
      case "Asesino":
        // Mejora de evasión y críticos
        this.evasion = 0.35; // 35% evasión
        this.criticalChance = 0.3; // 30% golpe crítico
        this.criticalMultiplier = 2.5; // x2.5 daño en crítico
        this.damage = Math.floor(this.damage * 1.3); // +30% daño base
        this.trapDisarmChance = 0.7; // 70% desactivar trampa
        break;
        
      case "Sacerdote":
        // Mejora de curación y auras
        this.healing = true;
        this.healAmount = Math.floor(this.maxHealth * 0.3); // 30% curación
        this.healRadius = 1; // Puede curar a compañeros cercanos
        this.divineProtection = 0.2; // 20% de prevenir efectos negativos
        this.resurrectionChance = 0.15; // 15% de resucitar a un compañero
        break;
        
      case "Francotirador":
        // Mejora de precisión y ataques especiales
        this.ranged = true;
        this.accuracy = 0.9; // 90% precisión (casi nunca falla)
        this.criticalChance = 0.4; // 40% de crítico
        this.piercingShot = 0.3; // 30% ignorar armadura
        this.damage = Math.floor(this.damage * 1.4); // +40% daño base
        break;
    }
  }
    
    // Genera un nombre aleatorio para el aventurero
    generateName() {
      const firstNames = [
        "Alric", "Brienne", "Cedric", "Dara", "Elwyn", "Finn", "Gareth", 
        "Hilda", "Isolde", "Jorah", "Kira", "Leif", "Mira", "Nolan", 
        "Olga", "Percy", "Quinn", "Rowan", "Sigrid", "Tormund"
      ];
      
      const surnames = [
        "Blackshield", "Cloudwalker", "Dragonslayer", "Elfriend", "Frostbeard", 
        "Goldmantle", "Heartseeker", "Ironhand", "Jademoon", "Kinslayer", 
        "Lightstep", "Mossback", "Nightshade", "Oakenheart", "Proudmane", 
        "Quickblade", "Redwater", "Shadowfoot", "Truesword", "Wildbourne"
      ];
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      
      return `${firstName} ${surname}`;
    }
    
    // Genera una clase aleatoria para el aventurero
    generateClass() {
      const classes = [
        "Guerrero", "Mago", "Ladrón", "Clérigo", "Arquero"
      ];
      
      return classes[Math.floor(Math.random() * classes.length)];
    }
    
    // Aplica bonificaciones basadas en la clase
    applyClassBonus() {
      switch (this.class) {
        case "Guerrero":
          this.maxHealth = Math.floor(this.maxHealth * 1.3);
          this.health = this.maxHealth;
          this.damage = Math.floor(this.damage * 1.2);
          this.damageReduction = 0.15; // NUEVO: 15% reducción de daño
          break;
          
        case "Mago":
          this.maxHealth = Math.floor(this.maxHealth * 0.8);
          this.health = this.maxHealth;
          this.damage = Math.floor(this.damage * 1.5);
          this.hasMagicAttack = true;
          this.debuffChance = 0.25; // NUEVO: 25% de aplicar debuff
          this.debuffDuration = 2; // 2 turnos
          break;
          
        case "Ladrón":
          this.maxHealth = Math.floor(this.maxHealth * 0.9);
          this.health = this.maxHealth;
          this.evasion = 0.25; // 25% de probabilidad de evadir ataques
          this.gold = Math.floor(this.gold * 1.5);
          this.trapDisarmChance = 0.4; // NUEVO: 40% de desactivar trampa
          break;
          
        case "Clérigo":
          this.maxHealth = Math.floor(this.maxHealth * 1.1);
          this.health = this.maxHealth;
          this.healing = true; // Puede curarse a sí mismo
          this.healAmount = Math.floor(this.maxHealth * 0.2);
          this.healCooldown = 0; // Turnos hasta poder curarse
          this.healRadius = 0; // Solo a sí mismo
          break;
          
        case "Arquero":
          this.maxHealth = Math.floor(this.maxHealth * 0.85);
          this.health = this.maxHealth;
          this.damage = Math.floor(this.damage * 1.3);
          this.ranged = true; // Puede atacar desde la distancia
          this.criticalChance = 0.2; // NUEVO: 20% golpe crítico
          break;
          
        default:
          break;
      }
    }
    
    // Determina los objetivos preferidos basados en la clase
    determinePreferredTargets() {
      switch (this.class) {
        case "Guerrero":
          return ["path"]; // Prefiere el camino directo
        case "Mago":
          return ["monster"]; // Prefiere atacar monstruos
        case "Ladrón":
          return ["trap"]; // Prefiere evitar trampas
        case "Clérigo":
          return ["path"]; // Prefiere el camino directo
        case "Arquero":
          return ["monster"]; // Prefiere atacar monstruos
        default:
          return ["path"];
      }
    }
    
    // Recibe daño y verifica si muere
    takeDamage(amount, attackType = "physical") {
      // Aplicar reducción de daño para Guerreros/Caballeros
      if (this.damageReduction && Math.random() < this.damageReduction) {
        amount = Math.floor(amount * (1 - this.damageReduction));
      }
      
      // Si es ladrón/asesino, puede evadir
      if (this.evasion && Math.random() < this.evasion) {
        this.combatStats.evades++;
        return {
          damage: 0,
          evaded: true,
          message: `${this.name} evade el ataque con agilidad.`
        };
      }
      
      this.health -= amount;
      this.combatStats.damageReceived += amount;
      
      // Si tiene habilidad de curación y está por debajo del 30% de salud, se cura
      if (this.healing && this.health < (this.maxHealth * 0.3) && this.healCooldown <= 0) {
        const healResult = this.heal();
        if (healResult && healResult.healed) {
          return {
            damage: amount,
            evaded: false,
            healed: true,
            healAmount: healResult.amount,
            currentHealth: this.health,
            message: `${this.name} se cura por ${healResult.amount} puntos.`
          };
        }
      }
      
      if (this.health <= 0) {
        this.health = 0;
        this.isDead = true;
      }
      
      return {
        damage: amount,
        evaded: false,
        healed: false,
        currentHealth: this.health,
        message: `${this.name} recibe ${amount} puntos de daño.`
      };
    }
    
    // MODIFICADO: Método de curación mejorado
    heal(target = null) {
      if (!this.healing || this.healCooldown > 0) return null;
      
      // Establecer cooldown
      this.healCooldown = 2;
      
      // Si hay objetivo, curar al objetivo
      if (target) {
        const healAmount = this.healAmount;
        target.health = Math.min(target.maxHealth, target.health + healAmount);
        this.combatStats.healingDone += healAmount;
        
        return {
          healed: true,
          target: target.name,
          amount: healAmount,
          currentHealth: target.health,
          message: `${this.name} cura a ${target.name} por ${healAmount} puntos.`
        };
      }
      // Si no, curarse a sí mismo
      else {
        const healAmount = this.healAmount;
        this.health = Math.min(this.maxHealth, this.health + healAmount);
        
        return {
          healed: true,
          amount: healAmount,
          currentHealth: this.health,
          message: `${this.name} se cura por ${healAmount} puntos.`
        };
      }
    }

    // NUEVO: Método para obtener estadísticas de combate
  getCombatStats() {
    return {
      ...this.combatStats,
      survivalRatio: this.health / this.maxHealth,
      effectiveLevel: this.isEvolved ? this.level + 1 : this.level
    };
  }
  
  // NUEVO: Método para determinar prioridad de objetivo
  getTargetPriority(targetType) {
    // Cada clase tiene diferentes prioridades
    const priorities = {
      "Guerrero": { "monster": 1, "trap": 2, "path": 0 },
      "Caballero": { "monster": 1, "trap": 2, "path": 0 },
      "Mago": { "monster": 0, "trap": 2, "path": 1 },
      "Archimago": { "monster": 0, "trap": 2, "path": 1 },
      "Ladrón": { "monster": 2, "trap": 0, "path": 1 },
      "Asesino": { "monster": 1, "trap": 0, "path": 2 },
      "Clérigo": { "monster": 2, "trap": 1, "path": 0 },
      "Sacerdote": { "monster": 2, "trap": 1, "path": 0 },
      "Arquero": { "monster": 0, "trap": 2, "path": 1 },
      "Francotirador": { "monster": 0, "trap": 2, "path": 1 }
    };
    
    return priorities[this.class]?.[targetType] ?? 1;
  }
    
    // MODIFICADO: Ataque mejorado con habilidades de clase
    attack(target) {
      if (this.isDead) return { success: false, reason: "Aventurero muerto" };
      
      let damageDealt = this.damage;
      let effects = [];
      let message = "";
      
      // Aplicar bonificaciones o habilidades especiales
      
      // Críticos (Arquero/Francotirador/Asesino)
      let isCritical = false;
      if (this.criticalChance && Math.random() < this.criticalChance) {
        const critMult = this.criticalMultiplier || 2.0;
        damageDealt = Math.floor(damageDealt * critMult);
        isCritical = true;
        message = "consigue un golpe crítico";
        effects.push("critical");
      }
      
      // Daño mágico (Mago/Archimago)
      if (this.hasMagicAttack && target.type === "monster") {
        const magicPower = this.magicPower || 1.5;
        damageDealt = Math.floor(damageDealt * magicPower);
        message = "canaliza energía arcana";
        effects.push("magic");
        
        // Debuff (Mago/Archimago)
        if (this.debuffChance && Math.random() < this.debuffChance) {
          const debuffPotency = this.debuffPotency || 0.2;
          const debuffDuration = this.debuffDuration || 2;
          
          effects.push("debuff");
          message += " y aplica un debilitamiento";
          
          // Tipo de debuff aleatorio
          const debuffTypes = ["weakness", "vulnerability", "slow"];
          const debuffType = debuffTypes[Math.floor(Math.random() * debuffTypes.length)];
          effects.push(debuffType);
        }
      }
      
      // Ataques penetrantes (Francotirador)
      if (this.piercingShot && Math.random() < this.piercingShot) {
        effects.push("piercing");
        message = "dispara una flecha penetrante";
      }
      
      // Daño en área (Archimago)
      if (this.aoeAttackChance && Math.random() < this.aoeAttackChance) {
        effects.push("aoe");
        message = "lanza un hechizo de área";
      }
      
      // NUEVO: Actualizar estadísticas de combate
    if (isCritical) {
      this.combatStats.criticalHits++;
    }
    
    this.combatStats.damageDealt += damageDealt;
    
    return {
      success: true,
      damage: damageDealt,
      isCritical: isCritical,
      ranged: this.ranged || false,
      effects: effects,
      message: message
    };
  }

    attemptDisarmTrap(trap) {
      if (!this.trapDisarmChance) return { success: false };
      
      const disarmChance = this.trapDisarmChance;
      const isSuccessful = Math.random() < disarmChance;
      
      return {
        success: isSuccessful,
        message: isSuccessful ? 
          `${this.name} desactiva ${trap.name} con precisión.` : 
          `${this.name} falla al intentar desactivar ${trap.name}.`
      };
    }

    // NUEVO: Método para actualizar cooldowns
    updateCooldowns() {
      if (this.healCooldown > 0) {
        this.healCooldown--;
      }
    }
    
    // Decide la siguiente acción en base a la situación del tablero
    // Modificación para src/models/Adventurer.js
    decideNextAction(dungeon, currentPosition) {
      // Inicializar conjunto de posiciones visitadas si no existe
      this.visitedPositions = this.visitedPositions || new Set();
      this.visitedPositions.add(`${currentPosition.x},${currentPosition.y}`);
      
      // Actualizar cooldowns
      this.updateCooldowns();
      
      // Calcular probabilidad de error basada en nivel y día
      const errorChance = Math.max(0.05, 0.3 - (0.05 * this.level) - (this.day * 0.02));
      const makesMistake = Math.random() < errorChance;
      
      // A veces se queda quieto por indecisión
      if (makesMistake && Math.random() < 0.3) {
        return null;
      }
      
      // Encontrar al jugador (solo una vez)
      let playerPos = null;
      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[y].length; x++) {
          if (dungeon[y][x]?.type === 'player') {
            playerPos = { x, y };
            break;
          }
        }
        if (playerPos) break;
      }
      
      // Si encontramos al jugador y no comete errores, calcular camino
      if (playerPos && !makesMistake) {
        const pathFinder = new PathFinder(dungeon);
        const path = pathFinder.findPath(currentPosition, playerPos, this);
        
        if (path && path.length > 1) {
          const nextStep = path[1]; // El primer paso es la posición actual
          return {
            x: nextStep.x,
            y: nextStep.y,
            targetType: dungeon[nextStep.y][nextStep.x]?.type || 'path'
          };
        }
      }
      
      // Si no encontró camino o comete error, buscar movimientos válidos manualmente
      const possibleMoves = [
        { x: 0, y: -1 }, // arriba
        { x: 0, y: 1 },  // abajo
        { x: -1, y: 0 }, // izquierda
        { x: 1, y: 0 }   // derecha
      ];
      
      // Añadir aleatoriedad si comete error
      if (makesMistake) {
        possibleMoves.sort(() => Math.random() - 0.5);
      }
      
      // Filtrar y evaluar movimientos válidos
      const validMoves = possibleMoves
        .map(move => {
          const newX = currentPosition.x + move.x;
          const newY = currentPosition.y + move.y;
          
          if (
            newX >= 0 && newX < dungeon[0].length &&
            newY >= 0 && newY < dungeon.length &&
            dungeon[newY][newX] !== null
          ) {
            const distanceToPlayer = playerPos ? 
              Math.abs(newX - playerPos.x) + Math.abs(newY - playerPos.y) : 
              9999;
              
            const isVisited = this.visitedPositions.has(`${newX},${newY}`);
            
            return {
              x: newX,
              y: newY,
              cell: dungeon[newY][newX],
              distanceToPlayer,
              isVisited
            };
          }
          return null;
        })
        .filter(move => move !== null);
      
      // Ordenar movimientos (a menos que cometa error)
      if (!makesMistake) {
        validMoves.sort((a, b) => {
          // Prioridad 1: No visitados
          if (a.isVisited !== b.isVisited) {
            return a.isVisited ? 1 : -1;
          }
          // Prioridad 2: Distancia al objetivo
          return a.distanceToPlayer - b.distanceToPlayer;
        });
      }
      
      // Seleccionar y retornar movimiento
      if (validMoves.length > 0) {
        const moveIndex = makesMistake ? Math.floor(Math.random() * validMoves.length) : 0;
        const selectedMove = validMoves[moveIndex];
        return {
          x: selectedMove.x,
          y: selectedMove.y,
          targetType: selectedMove.cell.type
        };
      }
      
      // Si no hay movimientos válidos
      return null;
    }
    
    // Añadir este método auxiliar si no lo tienes
    findPlayerPosition(dungeon) {
      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[y].length; x++) {
          if (dungeon[y][x]?.type === 'player') {
            return { x, y };
          }
        }
      }
      return null;
    }

    // NUEVO: Método auxiliar para encontrar al jugador
  findPlayerPosition(dungeon) {
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        if (dungeon[y][x]?.type === 'player') {
          return { x, y };
        }
      }
    }
    return null;
  }

  
  
  // NUEVO: Método auxiliar para movimiento manual
  findManualMove(dungeon, currentPosition, makesMistake) {
    const possibleMoves = [
      { x: 0, y: -1 }, // arriba
      { x: 0, y: 1 },  // abajo
      { x: -1, y: 0 }, // izquierda
      { x: 1, y: 0 }   // derecha
    ];
    
    // Añadir aleatoriedad si comete errores
    if (makesMistake) {
      possibleMoves.sort(() => Math.random() - 0.5);
    }
    
    // Filtrar y ordenar movimientos
    const validMoves = this.getValidMoves(dungeon, currentPosition, possibleMoves);
    
    if (validMoves.length > 0) {
      const moveIndex = makesMistake ? Math.floor(Math.random() * validMoves.length) : 0;
      const selectedMove = validMoves[moveIndex];
      return {
        x: selectedMove.x,
        y: selectedMove.y,
        targetType: selectedMove.cell.type
      };
    }
    
    return null;
  }
  
  // NUEVO: Método auxiliar para filtrar y ordenar movimientos válidos
  getValidMoves(dungeon, currentPosition, possibleMoves) {
    return possibleMoves
      .map(move => {
        const newX = currentPosition.x + move.x;
        const newY = currentPosition.y + move.y;
        
        if (
          newX >= 0 && newX < dungeon[0].length &&
          newY >= 0 && newY < dungeon.length &&
          dungeon[newY][newX] !== null
        ) {
          const distanceToPlayer = this.playerPos ? 
            Math.abs(newX - this.playerPos.x) + Math.abs(newY - this.playerPos.y) : 
            9999;
            
          const isVisited = this.visitedPositions.has(`${newX},${newY}`);
          
          return {
            x: newX,
            y: newY,
            cell: dungeon[newY][newX],
            distanceToPlayer,
            isVisited
          };
        }
        return null;
      })
      .filter(move => move !== null)
      .sort((a, b) => {
        // Priorizar no visitados
        if (a.isVisited !== b.isVisited) {
          return a.isVisited ? 1 : -1;
        }
        // Luego priorizar por distancia
        return a.distanceToPlayer - b.distanceToPlayer;
      });
  }
}
  
  export default Adventurer;