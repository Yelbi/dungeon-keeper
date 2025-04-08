// src/models/Trap.js
class Trap {
    constructor(config) {
      this.id = config.id;
      this.name = config.name;
      this.type = "trap";
      this.level = config.level || 1;
      this.maxLevel = config.maxLevel || 5;
      this.damage = config.damage || 10;
      this.cost = config.cost || 15;
      this.unlocked = config.unlocked || false;
      this.position = config.position || { x: 0, y: 0 };
      this.isTriggered = false;
      this.remainingUses = this.calculateUses();
      
      // Propiedades especiales basadas en el tipo de trampa
      this.applyTrapSpecialties();
    }
    
    applyTrapSpecialties() {
      switch (this.name) {
        case "Trampa de pinchos":
          // Trampa básica que daña a quien la pisa
          this.triggerChance = 1.0; // 100% de activarse
          this.emoji = "📌";
          this.description = "Pinchos afilados que dañan a cualquiera que pase por encima.";
          this.effectType = "damage";
          this.reset = 0.8; // 80% de posibilidad de rearmarse
          break;
          
        case "Foso":
          // Trampa que atrapa al aventurero por turnos
          this.triggerChance = 0.9; // 85% de activarse
          this.emoji = "🕳️";
          this.description = "Un pozo profundo que atrapa al aventurero durante varios turnos.";
          this.effectType = "trap";
          this.trapDuration = 2; // Atrapa durante 2 turnos
          this.reset = 0.5; // 50% de posibilidad de rearmarse
          break;
          
        case "Trampa de fuego":
          // Trampa de área que daña a todos los que están cerca
          this.triggerChance = 0.8; // 75% de activarse
          this.emoji = "🔥";
          this.description = "Lanza una explosión de fuego que daña a todos los aventureros cercanos.";
          this.effectType = "area";
          this.areaRange = 1; // Afecta a celdas adyacentes
          this.reset = 0.3;
          this.damage = Math.floor(this.damage * 0.9); // 30% de posibilidad de rearmarse
          break;
          
        case "Gas venenoso":
          // Trampa que envenena al aventurero
          this.triggerChance = 0.8; // 80% de activarse
          this.emoji = "☠️";
          this.description = "Libera gas venenoso que daña a los aventureros durante varios turnos.";
          this.effectType = "poison";
          this.poisonDuration = 2; // Envenena durante 3 turnos
          this.poisonDamage = Math.floor(this.damage * 0.35); // Daño por envenenamiento
          this.reset = 0.4; // 40% de posibilidad de rearmarse
          break;
          
        case "Muro aplastante":
          // Trampa con alto daño pero baja probabilidad
          this.triggerChance = 0.6; // 60% de activarse
          this.emoji = "🧱";
          this.description = "Un muro que cae aplastando a los aventureros con gran daño.";
          this.effectType = "crush";
          this.crushDamage = this.damage * 2; // Doble daño
          this.stunDuration = 1; // Aturde durante 1 turno
          this.reset = 0.2; // 20% de posibilidad de rearmarse
          break;
          
        case "Trampa de hielo":
          // Ralentiza a los aventureros
          this.triggerChance = 0.9; // 90% de activarse
          this.emoji = "❄️";
          this.description = "Congela el suelo ralentizando a los aventureros.";
          this.effectType = "slow";
          this.slowDuration = 2; // Ralentiza durante 2 turnos
          this.reset = 0.6; // 60% de posibilidad de rearmarse
          break;
          
        case "Trampa arcana":
          // Trampa mágica con efectos aleatorios
          this.triggerChance = 0.7; // 70% de activarse
          this.emoji = "✨";
          this.description = "Trampa mágica que causa diferentes efectos aleatorios.";
          this.effectType = "arcane";
          this.effects = ["damage", "trap", "poison", "slow"]; // Posibles efectos
          this.reset = 0.5; // 50% de posibilidad de rearmarse
          break;
          
        default:
          this.triggerChance = 0.8;
          this.emoji = "⚠️";
          this.description = "Una trampa común que protege la mazmorra.";
          this.effectType = "damage";
          this.reset = 0.5;
          break;
      }
    }
    
    // Calcula el número de usos basado en el nivel
    calculateUses() {
      return this.level + 1; // Nivel 1 = 2 usos, Nivel 2 = 3 usos, etc.
    }
    
    // Actualiza propiedades cuando sube de nivel
    levelUp() {
      if (this.level >= this.maxLevel) {
        return false;
      }
      
      this.level += 1;
      
      // Mejora el daño
      this.damage = Math.floor(this.damage * 1.4);
      
      // Mejora la probabilidad de rearmarse
      this.reset = Math.min(0.95, this.reset + 0.1);
      
      // Actualiza el número de usos
      this.remainingUses = this.calculateUses();
      
      // Actualiza propiedades especiales
      this.applyTrapSpecialties();
      
      return true;
    }
    
    // Activa la trampa cuando un aventurero pasa por encima
    trigger(adventurer) {
      if (this.isTriggered || this.remainingUses <= 0) {
        return { success: false, reason: "Trampa ya activada o sin usos" };
      }
      
      // Verificar si la trampa se activa según su probabilidad
      if (Math.random() > this.triggerChance) {
        return { success: false, reason: "La trampa falló", triggered: false };
      }
      
      // Marcar como activada
      this.isTriggered = true;
      this.remainingUses--;
      
      // Efectos según el tipo de trampa
      let result = {
        success: true,
        triggered: true,
        damage: 0,
        effects: []
      };
      
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
          break;
          
        case "arcane":
          // Elige un efecto aleatorio
          const effect = this.effects[Math.floor(Math.random() * this.effects.length)];
          result.effects.push(effect);
          result.effects.push("arcane");
          
          // Aplica efectos basados en el tipo elegido
          if (effect === "damage") {
            result.damage = Math.floor(this.damage * 1.5);
          } else if (effect === "trap") {
            result.damage = Math.floor(this.damage * 0.3);
            result.trapDuration = 1;
          } else if (effect === "poison") {
            result.damage = Math.floor(this.damage * 0.2);
            result.poisonDuration = 2;
            result.poisonDamage = Math.floor(this.damage * 0.3);
          } else if (effect === "slow") {
            result.damage = Math.floor(this.damage * 0.1);
            result.slowDuration = 1;
          }
          break;
          
        default:
          result.damage = this.damage;
          break;
      }
      
      return result;
    }
    
    // Intenta rearmar la trampa
    reset() {
      if (!this.isTriggered || this.remainingUses <= 0) {
        return false;
      }
      
      // Verificar si la trampa se rearma según su probabilidad
      if (Math.random() < this.reset) {
        this.isTriggered = false;
        return true;
      }
      
      return false;
    }
    
    // Calcula el coste de mejora
    getUpgradeCost() {
      return this.cost * this.level;
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
        upgradeCost: this.getUpgradeCost()
      };
    }
  }
  
  export default Trap;