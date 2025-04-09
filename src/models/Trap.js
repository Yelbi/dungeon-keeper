// src/models/Trap.js - REBALANCEADO
class Trap {
  constructor(config) {
    // Propiedades básicas
    this.id = config.id;
    this.name = config.name;
    this.type = "trap";
    this.level = config.level || 1;
    this.maxLevel = config.maxLevel || 10;
    
    // Calcular estadísticas base con escalado por nivel
    const levelBonus = this.calculateLevelBonus();
    this.damage = Math.floor(config.damage * levelBonus.damage);
    
    // Propiedades de disponibilidad y coste
    this.cost = Math.floor(config.cost * (1 + (this.level - 1) * 0.25));
    this.unlocked = config.unlocked || false;
    this.position = config.position || { x: 0, y: 0 };
    
    // Propiedades de uso
    this.isTriggered = false;
    this.uses = config.uses || 1;
    this.remainingUses = this.calculateUses();
    this.rearmTime = config.rearmTime || 3;
    this.currentRearmTime = 0;
    
    // Probabilidades y características
    this.triggerChance = config.triggerChance || 0.8;
    this.reset = config.reset || 0.4 + (this.level * 0.04); // Probabilidad de rearmarse, mejora con nivel
    
    // Personalización visual
    this.emoji = config.emoji || "⚠️";
    this.description = config.description || "Una trampa común que protege la mazmorra.";
    
    // Efectos y daños
    this.effectType = config.effectType || "damage";
    this.effects = config.effects || ["damage"];
    
    // Aplicar propiedades específicas según el tipo de trampa
    this.applyTrapSpecialties(config);
    
    // Estadísticas de uso
    this.statsTrack = {
      timesTriggered: 0,
      damageDealt: 0,
      adventurersKilled: 0,
      timesDisarmed: 0
    };
  }
  
  // Calcula los bonos por nivel
  calculateLevelBonus() {
    const bonusPercentages = {
      damage: 1 + ((this.level - 1) * 0.15),      // +15% daño por nivel
      uses: 1 + ((this.level - 1) * 0.1),         // +10% usos por nivel
      duration: 1 + ((this.level - 1) * 0.1)      // +10% duración de efectos
    };
    
    return bonusPercentages;
  }
  
  // Aplicar propiedades específicas según el tipo de trampa
  applyTrapSpecialties(config) {
    switch (this.name) {
      case "Trampa de pinchos":
        // Trampa básica que daña a quien la pisa
        this.triggerChance = 1.0; // 100% de activarse
        this.effectType = "damage";
        this.reset = 0.8 + (this.level * 0.02); // Alta probabilidad de rearmarse
        break;
        
      case "Foso":
        // Trampa que atrapa al aventurero por turnos
        this.triggerChance = 0.9 - (this.level * 0.01); // Probabilidad de activación disminuye con nivel (más difícil de ver)
        this.effectType = "trap";
        this.trapDuration = 2 + Math.floor(this.level / 3); // Duración aumenta con nivel
        break;
        
      case "Trampa de hielo":
        // Ralentiza a los aventureros
        this.triggerChance = 0.9;
        this.effectType = "slow";
        this.slowDuration = 2 + Math.floor(this.level / 4); // Duración aumenta con nivel
        this.slowAmount = 0.3 + (this.level * 0.03); // Intensidad de ralentización
        break;
        
      case "Gas venenoso":
        // Trampa que envenena al aventurero
        this.triggerChance = 0.8;
        this.effectType = "poison";
        this.poisonDuration = 3 + Math.floor(this.level / 3);
        this.poisonDamage = Math.floor(this.damage * 0.35 * (1 + (this.level * 0.03))); // Daño por turno del veneno
        break;
        
      case "Trampa de fuego":
        // Trampa de área que daña a todos los que están cerca
        this.triggerChance = 0.8;
        this.effectType = "area";
        this.areaRange = 1 + Math.floor(this.level / 5); // Rango aumenta con nivel alto
        this.burnDuration = 2 + Math.floor(this.level / 4);
        this.burnDamage = Math.floor(this.damage * 0.3 * (1 + (this.level * 0.02))); // Daño por turno de quemadura
        break;
        
      case "Muro aplastante":
        // Trampa con alto daño pero baja probabilidad
        this.triggerChance = 0.6; // 60% de activarse
        this.effectType = "crush";
        this.crushDamage = this.damage * (1.8 + (this.level * 0.1)); // Daño aumenta significativamente con nivel
        this.stunDuration = 1 + Math.floor(this.level / 4); // Duración del aturdimiento
        this.reset = 0.2 + (this.level * 0.02); // Baja probabilidad de rearmarse
        break;
        
      case "Trampa arcana":
        // Trampa mágica con efectos aleatorios
        this.triggerChance = 0.7; // 70% de activarse
        this.effectType = "arcane";
        this.magicDamageMultiplier = 1.2 + (this.level * 0.08); // Multiplicador de daño mágico
        this.silenceDuration = 2 + Math.floor(this.level / 4); // Duración del silencio
        this.effects = ["damage", "silence", "mana_burn", "random_teleport"]; // Posibles efectos
        this.reset = 0.5 + (this.level * 0.03); // Probabilidad media de rearmarse
        break;
        
      case "Drenaje de vida":
        // Drena vida de los aventureros y cura monstruos cercanos
        this.triggerChance = 0.75;
        this.effectType = "drain";
        this.drainAmount = 0.5 + (this.level * 0.05); // Porcentaje del daño que cura a monstruos
        this.drainRadius = 1 + Math.floor(this.level / 5); // Radio de curación
        this.weakenAmount = 0.2 + (this.level * 0.03); // Debilitamiento del objetivo
        this.weakenDuration = 2;
        break;
        
      case "Cárcel espiritual":
        // Atrapa al aventurero en una prisión que desactiva habilidades
        this.triggerChance = 0.65;
        this.effectType = "spiritual";
        this.imprisonDuration = 3 + Math.floor(this.level / 3);
        this.imprisonEffect = "disable"; // Desactiva habilidades
        this.spiritual = true; // Ignora resistencias físicas
        break;
        
      case "Explosión de runas":
        // Gran daño en área con efecto retardado
        this.triggerChance = 0.7;
        this.effectType = "rune";
        this.armingTime = 1; // Turnos para activarse completamente
        this.areaRadius = 2 + Math.floor(this.level / 4);
        this.explosionDamageMultiplier = 1.5 + (this.level * 0.1); // Multiplicador de daño
        this.reset = 0.15 + (this.level * 0.01); // Muy baja probabilidad de rearmarse
        break;
        
      default:
        // Valores por defecto para trampas personalizadas
        this.triggerChance = 0.8;
        this.effectType = "damage";
        this.reset = 0.5;
        break;
    }
  }
  
  // Calcula el número de usos basado en el nivel
  calculateUses() {
    // Base + bonus por nivel
    return Math.floor(this.uses + (this.level * 0.5));
  }
  
  // Actualiza propiedades cuando sube de nivel
  levelUp() {
    if (this.level >= this.maxLevel) {
      return false;
    }
    
    this.level += 1;
    
    // Aplicar bonificaciones por nivel
    const levelBonus = this.calculateLevelBonus();
    
    // Actualizar estadísticas principales
    this.damage = Math.floor(this.damage * levelBonus.damage);
    
    // Actualizar usos
    this.remainingUses = this.calculateUses();
    
    // Actualizar coste
    this.cost = Math.floor(this.cost * 1.25);
    
    // Reaplicar propiedades específicas
    this.applyTrapSpecialties({});
    
    return true;
  }
  
  // Activa la trampa cuando un aventurero pasa por encima
  trigger(adventurer) {
    // Verificar si la trampa puede ser activada
    if (this.isTriggered || this.remainingUses <= 0) {
      return { 
        success: false, 
        reason: "Trampa ya activada o sin usos",
        triggered: false
      };
    }
    
    // Estadísticas del aventurero relevantes para la trampa
    const adventurerInfo = {
      trapDisarmChance: adventurer.trapDisarmChance || 0,
      evasion: adventurer.evasion || 0,
      level: adventurer.level || 1,
      class: adventurer.class || "Aventurero"
    };
    
    // Ladrones y Asesinos pueden intentar desactivar la trampa
    if (["Ladrón", "Asesino", "Sombra"].includes(adventurerInfo.class) && 
        adventurerInfo.trapDisarmChance) {
      // Modificadores según nivel de trampa vs nivel de aventurero
      const levelDifference = this.level - adventurerInfo.level;
      const difficultyModifier = Math.max(0.5, Math.min(1.5, 1 + (levelDifference * 0.1)));
      const finalDisarmChance = adventurerInfo.trapDisarmChance / difficultyModifier;
      
      // Intentar desactivar
      if (Math.random() < finalDisarmChance) {
        this.statsTrack.timesDisarmed++;
        
        return { 
          success: false, 
          reason: "Trampa desactivada por habilidad",
          triggered: false,
          disarmed: true,
          message: `${adventurer.name} ha desactivado ${this.name} con éxito.`
        };
      }
    }
    
    // Verificar si la trampa se activa según su probabilidad
    if (Math.random() > this.triggerChance) {
      return { 
        success: false, 
        reason: "La trampa falló", 
        triggered: false,
        message: `${this.name} falla al activarse.`
      };
    }
    
    // La trampa se activa
    this.isTriggered = true;
    this.remainingUses--;
    this.statsTrack.timesTriggered++;
    
    // Preparar resultado base
    let result = {
      success: true,
      triggered: true,
      damage: 0,
      effects: []
    };
    
    // Aplicar efectos según el tipo de trampa
    switch (this.effectType) {
      case "damage":
        result.damage = this.damage;
        result.effects.push("damage");
        break;
        
      case "trap":
        result.damage = Math.floor(this.damage * 0.5);
        result.effects.push("trapped");
        result.trapDuration = this.trapDuration;
        break;
        
      case "area":
        result.damage = this.damage;
        result.effects.push("area");
        result.areaRange = this.areaRange;
        
        // Efecto de quemadura
        result.effects.push("burn");
        result.burnDuration = this.burnDuration;
        result.burnDamage = this.burnDamage;
        break;
        
      case "poison":
        result.damage = Math.floor(this.damage * 0.3); // Daño inicial
        result.effects.push("poison");
        result.poisonDuration = this.poisonDuration;
        result.poisonDamage = this.poisonDamage;
        break;
        
      case "crush":
        result.damage = this.crushDamage;
        result.effects.push("crush");
        result.effects.push("stun");
        result.stunDuration = this.stunDuration;
        break;
        
      case "slow":
        result.damage = Math.floor(this.damage * 0.2); // Poco daño
        result.effects.push("slow");
        result.slowDuration = this.slowDuration;
        result.slowAmount = this.slowAmount;
        break;
        
      case "arcane":
        // Elige un efecto aleatorio
        const effect = this.getRandomEffect();
        result.effects.push(effect);
        result.effects.push("arcane");
        
        // Aplicar efectos basados en el tipo elegido
        if (effect === "damage") {
          result.damage = Math.floor(this.damage * this.magicDamageMultiplier);
        } else if (effect === "silence") {
          result.damage = Math.floor(this.damage * 0.3);
          result.silenceDuration = this.silenceDuration;
        } else if (effect === "mana_burn") {
          result.damage = Math.floor(this.damage * 0.5);
          result.manaBurnAmount = 0.5; // 50% del maná perdido
        } else if (effect === "random_teleport") {
          result.damage = Math.floor(this.damage * 0.2);
          result.teleport = true;
        }
        break;
        
      case "drain":
        result.damage = this.damage;
        result.effects.push("drain");
        result.drainAmount = this.drainAmount;
        result.drainRadius = this.drainRadius;
        result.effects.push("weaken");
        result.weakenAmount = this.weakenAmount;
        result.weakenDuration = this.weakenDuration;
        break;
        
      case "spiritual":
        result.damage = Math.floor(this.damage * 0.4);
        result.effects.push("imprison");
        result.imprisonDuration = this.imprisonDuration;
        result.imprisonEffect = this.imprisonEffect;
        result.spiritual = true;
        break;
        
      case "rune":
        result.damage = Math.floor(this.damage * this.explosionDamageMultiplier);
        result.effects.push("explosion");
        result.areaRadius = this.areaRadius;
        break;
        
      default:
        result.damage = this.damage;
        break;
    }
    
    // Registrar el daño causado
    this.statsTrack.damageDealt += result.damage;
    
    return result;
  }
  
  // Intenta rearmar la trampa
  reset() {
    if (!this.isTriggered || this.remainingUses <= 0) {
      return false;
    }
    
    // Mejorar probabilidad de rearmado según nivel
    const resetChance = Math.min(0.9, this.reset + (this.level * 0.02));
    
    // Verificar si la trampa se rearma según su probabilidad
    if (Math.random() < resetChance) {
      this.isTriggered = false;
      
      // Resetear tiempo de rearme
      this.currentRearmTime = 0;
      
      return true;
    }
    
    return false;
  }
  
  // Actualiza el estado de la trampa (rearme retardado)
  update() {
    if (this.isTriggered && this.remainingUses > 0) {
      this.currentRearmTime++;
      
      // Intentar rearmar si el tiempo ha pasado
      if (this.currentRearmTime >= this.rearmTime) {
        return this.reset();
      }
    }
    
    return false;
  }
  
  // Obtiene un efecto aleatorio para trampas arcanas
  getRandomEffect() {
    if (!this.effects || this.effects.length === 0) {
      return "damage";
    }
    
    return this.effects[Math.floor(Math.random() * this.effects.length)];
  }
  
  // Calcula el coste de mejora
  getUpgradeCost() {
    return this.cost * this.level;
  }
  
  // Calcular valor de la trampa para recompensas
  getValue() {
    // Valor base según nivel y tipo
    let value = this.cost + (this.level * 8);
    
    // Bonus por efectos especiales
    if (this.effectType !== "damage") {
      value += 12;
    }
    
    if (this.areaRange && this.areaRange > 1) {
      value += 15;
    }
    
    // Multiplicador por nivel
    value = Math.floor(value * (1 + (this.level - 1) * 0.15));
    
    return value;
  }
  
  // Obtiene la información para mostrar
  getDisplayInfo() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      damage: this.damage,
      cost: this.cost,
      unlocked: this.unlocked,
      maxLevel: this.maxLevel,
      emoji: this.emoji,
      description: this.description,
      remainingUses: this.remainingUses,
      isTriggered: this.isTriggered,
      upgradeCost: this.getUpgradeCost(),
      effectType: this.effectType,
      effectDescription: this.getEffectDescription()
    };
  }
  
  // Descripción del efecto para UI
  getEffectDescription() {
    switch (this.effectType) {
      case "damage":
        return `Causa ${this.damage} puntos de daño físico.`;
      case "trap":
        return `Atrapa al aventurero por ${this.trapDuration} turnos y causa ${Math.floor(this.damage * 0.5)} de daño.`;
      case "area":
        return `Causa ${this.damage} de daño en un área de ${this.areaRange} casillas y quema por ${this.burnDuration} turnos.`;
      case "poison":
        return `Envenena por ${this.poisonDuration} turnos, causando ${this.poisonDamage} de daño por turno.`;
      case "crush":
        return `Aplastamiento que causa ${this.crushDamage} de daño y aturde por ${this.stunDuration} turnos.`;
      case "slow":
        return `Ralentiza un ${Math.round(this.slowAmount * 100)}% por ${this.slowDuration} turnos.`;
      case "arcane":
        return `Efecto mágico aleatorio: daño, silencio, quemadura de maná o teletransporte.`;
      case "drain":
        return `Drena ${this.damage} de vida y cura a monstruos cercanos un ${Math.round(this.drainAmount * 100)}%.`;
      case "spiritual":
        return `Atrapa al aventurero en una prisión espiritual por ${this.imprisonDuration} turnos y desactiva sus habilidades.`;
      case "rune":
        return `Explosión que causa ${Math.floor(this.damage * this.explosionDamageMultiplier)} de daño en un radio de ${this.areaRadius} casillas.`;
      default:
        return "Efecto estándar de daño.";
    }
  }
}
  
export default Trap;