// src/models/Adventurer.js - REBALANCEADO
import PathFinder from './PathFinder';
import gameConfig from '../utils/gameConfig';

class Adventurer {
  constructor(id, level, day) {
    this.id = id;
    this.name = this.generateName();
    this.level = level || 1;
    this.day = day;
    this.pathCache = {};
    this.lastPathUpdate = 0;
    
    // Determinar clase basada en el día y probabilidades
    this.class = gameConfig.utils.selectAdventurerClass(day);
    
    // Obtener estadísticas base según la clase
    const baseStats = gameConfig.adventurers.classBaseStats[this.class] || {
      health: 30,
      damage: 7,
      defense: 3,
      critChance: 0.05,
      abilities: []
    };
    
    // Calcular estadísticas escaladas por nivel 
    const levelScaling = gameConfig.levelProgression.adventurerLevelBonus;
    
    // Propiedades base que escalan con el día y nivel
    this.maxHealth = Math.floor(baseStats.health * (1 + (this.level - 1) * levelScaling.health)) + (day * 2);
    this.health = this.maxHealth;
    this.damage = Math.floor(baseStats.damage * (1 + (this.level - 1) * levelScaling.damage)) + Math.floor(day / 3);
    this.defense = Math.floor(baseStats.defense * (1 + (this.level - 1) * levelScaling.defense)) + Math.floor(day / 5);
    this.position = { x: 0, y: 0 }; // Posición inicial (entrada)
    this.isDead = false;
    
    // Economía y recompensas escaladas
    this.gold = Math.floor(10 * level * (1 + day * 0.1));
    this.experienceValue = Math.floor(8 * level * (1 + day * 0.05));
    
    // Propiedades especiales según clase
    this.criticalChance = baseStats.critChance || 0.05;
    this.evasion = baseStats.evasion || 0;
    this.abilities = baseStats.abilities || [];
    
    // Tracking de evolución
    this.classGeneration = this.determineClassGeneration();
    this.isEvolved = this.classGeneration > 1;
    this.evolutionLevel = 0; // 0 = no evolucionado, 1 = 1ra evolución, 2 = 2da evolución
    
    // Comportamiento en la IA
    this.preferredTargets = this.determinePreferredTargets();
    
    // Estadísticas de combate
    this.combatStats = {
      damageDealt: 0,
      damageReceived: 0,
      criticalHits: 0,
      evades: 0,
      kills: 0,
      trapsDisarmed: 0,
      healingDone: 0
    };
    
    // Estadísticas especiales específicas de clase
    this.applyClassSpecialStats();
  }
  
  // Determina la generación de la clase (1ra, 2da o 3ra)
  determineClassGeneration() {
    const firstGenClasses = ["Guerrero", "Mago", "Ladrón", "Clérigo", "Arquero"];
    const secondGenClasses = ["Caballero", "Archimago", "Asesino", "Sacerdote", "Arquera Elemental"];
    const thirdGenClasses = ["Paladín", "Mago Arcano", "Sombra", "Obispo", "Francotirador"];
    
    if (firstGenClasses.includes(this.class)) return 1;
    if (secondGenClasses.includes(this.class)) return 2;
    if (thirdGenClasses.includes(this.class)) return 3;
    
    return 1; // Por defecto, primera generación
  }
  
  // Aplica estadísticas especiales según la clase
  applyClassSpecialStats() {
    // Propiedades específicas para cada clase
    switch (this.class) {
      // Primera generación
      case "Guerrero":
        this.counterAttackChance = 0.10;
        this.damageReduction = 0.05 + (this.level * 0.01);
        break;
        
      case "Mago":
        this.hasMagicAttack = true;
        this.magicPower = 1.2 + (this.level * 0.05);
        this.manaPoints = 30 + (this.level * 5);
        this.maxMana = this.manaPoints;
        this.debuffChance = 0.15 + (this.level * 0.02);
        break;
        
      case "Ladrón":
        this.evasion = 0.15 + (this.level * 0.02);
        this.criticalChance = 0.15 + (this.level * 0.02);
        this.criticalMultiplier = 1.5 + (this.level * 0.05);
        this.trapDisarmChance = 0.3 + (this.level * 0.03);
        break;
        
      case "Clérigo":
        this.healing = true;
        this.healAmount = Math.floor(this.maxHealth * 0.15) + this.level;
        this.healCooldown = 0;
        this.healRadius = 0;
        this.purifyChance = 0.2 + (this.level * 0.03); // Eliminar efectos negativos
        break;
        
      case "Arquero":
        this.ranged = true;
        this.attackRange = 2;
        this.criticalChance = 0.1 + (this.level * 0.015);
        this.accuracy = 0.8 + (this.level * 0.02);
        break;
        
      // Segunda generación
      case "Caballero":
        this.damageReduction = 0.15 + (this.level * 0.02);
        this.counterAttackChance = 0.2 + (this.level * 0.02);
        this.shieldBashChance = 0.15 + (this.level * 0.02);
        this.tauntRadius = 1;
        break;
        
      case "Archimago":
        this.hasMagicAttack = true;
        this.magicPower = 1.5 + (this.level * 0.06);
        this.manaPoints = 50 + (this.level * 8);
        this.maxMana = this.manaPoints;
        this.spellPenetration = 0.15 + (this.level * 0.02);
        this.debuffChance = 0.25 + (this.level * 0.03);
        this.aoeAttackChance = 0.2 + (this.level * 0.02);
        break;
        
      case "Asesino":
        this.evasion = 0.25 + (this.level * 0.03);
        this.criticalChance = 0.25 + (this.level * 0.03);
        this.criticalMultiplier = 2.0 + (this.level * 0.08);
        this.trapDisarmChance = 0.5 + (this.level * 0.03);
        this.shadowStepChance = 0.15 + (this.level * 0.02);
        this.poisonChance = 0.2 + (this.level * 0.03);
        break;
        
      case "Sacerdote":
        this.healing = true;
        this.healAmount = Math.floor(this.maxHealth * 0.2) + (this.level * 2);
        this.healCooldown = 0;
        this.healRadius = 1;
        this.groupHealEfficiency = 0.6 + (this.level * 0.03);
        this.divineProtection = 0.15 + (this.level * 0.02);
        this.purifyChance = 0.4 + (this.level * 0.04);
        break;
        
      case "Arquera Elemental":
        this.ranged = true;
        this.attackRange = 3;
        this.criticalChance = 0.15 + (this.level * 0.02);
        this.accuracy = 0.85 + (this.level * 0.02);
        this.elementalDamage = {
          type: ["fire", "ice", "lightning"][Math.floor(Math.random() * 3)],
          bonus: 0.2 + (this.level * 0.03)
        };
        this.multishotChance = 0.2 + (this.level * 0.02);
        break;
        
      // Tercera generación
      case "Paladín":
        this.damageReduction = 0.25 + (this.level * 0.03);
        this.counterAttackChance = 0.3 + (this.level * 0.02);
        this.holyDamage = 0.3 + (this.level * 0.03);
        this.auraRadius = 1;
        this.divineShieldCooldown = 5;
        this.divineShieldDuration = 2;
        this.inspirationAura = 0.15 + (this.level * 0.02);
        break;
        
      case "Mago Arcano":
        this.hasMagicAttack = true;
        this.magicPower = 2.0 + (this.level * 0.1);
        this.manaPoints = 80 + (this.level * 10);
        this.maxMana = this.manaPoints;
        this.spellPenetration = 0.3 + (this.level * 0.03);
        this.aoeAttackChance = 0.4 + (this.level * 0.03);
        this.timeManipulation = 0.2 + (this.level * 0.02);
        this.arcaneShield = 0.2 + (this.level * 0.02);
        this.spellMastery = ["fire", "ice", "arcane", "void"][Math.floor(Math.random() * 4)];
        break;
        
      case "Sombra":
        this.evasion = 0.35 + (this.level * 0.03);
        this.criticalChance = 0.35 + (this.level * 0.03);
        this.criticalMultiplier = 2.5 + (this.level * 0.1);
        this.trapDisarmChance = 0.7 + (this.level * 0.03);
        this.shadowCloneChance = 0.2 + (this.level * 0.02);
        this.deathMarkDuration = 2;
        this.blinkCooldown = 3;
        this.poisonPotency = 0.3 + (this.level * 0.03);
        break;
        
      case "Obispo":
        this.healing = true;
        this.healAmount = Math.floor(this.maxHealth * 0.25) + (this.level * 3);
        this.healCooldown = 0;
        this.healRadius = 2;
        this.groupHealEfficiency = 0.8 + (this.level * 0.02);
        this.resurrectChance = 0.15 + (this.level * 0.015);
        this.divineJudgement = 0.25 + (this.level * 0.03);
        this.holyBarrier = 0.3 + (this.level * 0.02);
        this.massHealCooldown = 4;
        break;
        
      case "Francotirador":
        this.ranged = true;
        this.attackRange = 4;
        this.criticalChance = 0.25 + (this.level * 0.03);
        this.criticalMultiplier = 2.0 + (this.level * 0.1);
        this.accuracy = 0.95 + (this.level * 0.01);
        this.piercingShot = 0.3 + (this.level * 0.03);
        this.explosiveShotCooldown = 3;
        this.explosiveShotRadius = 1;
        this.eagleEyePrecision = 0.4 + (this.level * 0.04);
        break;
        
      default:
        break;
    }
  }
  
  // MÉTODO PARA APLICAR EVOLUCIÓN (de 1ra a 2da o de 2da a 3ra clase)
  evolve() {
    if (this.classGeneration === 3) return false; // Ya en clase máxima
    
    // Obtener la clase a la que evolucionar
    const nextClass = gameConfig.adventurers.classEvolutions[this.class];
    if (!nextClass) return false;
    
    // Guardar estadísticas actuales para calcular proporciones
    const oldHealth = this.maxHealth;
    const oldDamage = this.damage;
    
    // Actualizar clase y generación
    this.class = nextClass;
    this.classGeneration++;
    this.evolutionLevel++;
    this.isEvolved = true;
    
    // Obtener nuevas estadísticas base
    const newBaseStats = gameConfig.adventurers.classBaseStats[this.class];
    
    // Recalcular estadísticas con bonificación de evolución
    const levelScaling = gameConfig.levelProgression.adventurerLevelBonus;
    
    // Actualizar estadísticas principales con un bono de evolución
    this.maxHealth = Math.floor(newBaseStats.health * (1 + (this.level - 1) * levelScaling.health * 1.2));
    this.health = this.maxHealth; // Salud completa al evolucionar
    this.damage = Math.floor(newBaseStats.damage * (1 + (this.level - 1) * levelScaling.damage * 1.2));
    this.defense = Math.floor(newBaseStats.defense * (1 + (this.level - 1) * levelScaling.defense * 1.2));
    
    // Actualizar propiedades de recompensa
    this.gold = Math.floor(this.gold * 1.4);
    this.experienceValue = Math.floor(this.experienceValue * 1.5);
    
    // Actualizar propiedades especiales de la clase
    this.criticalChance = newBaseStats.critChance || this.criticalChance;
    this.evasion = newBaseStats.evasion || this.evasion;
    this.abilities = newBaseStats.abilities || [];
    
    // Aplicar estadísticas especiales de la nueva clase
    this.applyClassSpecialStats();
    
    // Actualizar el nombre para reflejar la evolución
    this.name = `${this.name} el ${this.class}`;
    
    return true;
  }
    
  // Genera un nombre aleatorio para el aventurero
  generateName() {
    const names = gameConfig.adventurers.possibleNames;
    return names[Math.floor(Math.random() * names.length)];
  }
  
  // Determina los objetivos preferidos basados en la clase
  determinePreferredTargets() {
    // Clases con preferencias diferentes
    const preferences = {
      // Primera generación
      "Guerrero": ["monster"],
      "Mago": ["monster", "monster", "path"], // Mayor preferencia por monstruos
      "Ladrón": ["trap", "path", "monster"],
      "Clérigo": ["path", "path", "monster"],
      "Arquero": ["monster", "trap", "path"],
      
      // Segunda generación
      "Caballero": ["monster", "monster", "path"],
      "Archimago": ["monster", "monster", "trap"],
      "Asesino": ["trap", "monster", "path"],
      "Sacerdote": ["path", "path", "monster"],
      "Arquera Elemental": ["monster", "trap", "monster"],
      
      // Tercera generación
      "Paladín": ["monster", "monster", "monster"],
      "Mago Arcano": ["monster", "monster", "trap"],
      "Sombra": ["trap", "monster", "monster"],
      "Obispo": ["path", "monster", "monster"],
      "Francotirador": ["monster", "monster", "trap"]
    };
    
    return preferences[this.class] || ["path", "monster", "trap"];
  }
  
  // Recibe daño y verifica si muere
  takeDamage(amount, attackType = "physical") {
    // Verificar protecciones según clase
    if (this.isInvulnerable) {
      return {
        damage: 0,
        blocked: amount,
        invulnerable: true,
        message: `${this.name} es invulnerable al ataque.`
      };
    }
    
    // Aplicar escudo divino (Paladín/Obispo)
    if ((this.class === "Paladín" || this.class === "Obispo") && 
        this.divineShieldActive) {
      this.divineShieldActive = false;
      return {
        damage: 0,
        blocked: amount,
        divineShield: true,
        message: `El escudo divino de ${this.name} absorbe todo el daño.`
      };
    }
    
    // Aplicar reducción de daño para Guerreros/Caballeros/Paladines
    if (this.damageReduction && Math.random() < this.damageReduction) {
      const reduction = (this.class === "Paladín") ? 0.5 : 
                        (this.class === "Caballero") ? 0.4 : 0.3;
      amount = Math.floor(amount * (1 - reduction));
    }
    
    // Aplicar escudo arcano (Mago Arcano)
    if (this.class === "Mago Arcano" && this.arcaneShield && 
        attackType === "magic" && Math.random() < this.arcaneShield) {
      amount = Math.floor(amount * 0.3); // 70% del daño mágico absorbido
    }
    
    // Verificación de evasión (Ladrón/Asesino/Sombra)
    if (this.evasion && Math.random() < this.evasion) {
      // Si tiene sombras clonadas (Sombra), sacrificar una
      if (this.class === "Sombra" && this.shadowClones && this.shadowClones > 0) {
        this.shadowClones--;
        return {
          damage: 0,
          evaded: true,
          shadowClone: true,
          message: `Un clon de sombra de ${this.name} recibe el golpe y desaparece.`
        };
      }
      
      this.combatStats.evades++;
      return {
        damage: 0,
        evaded: true,
        message: `${this.name} evade el ataque con agilidad.`
      };
    }
    
    // Aplicar daño
    this.health -= amount;
    this.combatStats.damageReceived += amount;
    
    // Verificar marca de muerte (Sombra)
    if (this.class === "Sombra" && this.deathMark && this.deathMark.target) {
      const bonusDamage = Math.floor(amount * 0.3);
      this.deathMark.damage += bonusDamage;
      // Si alcanza el umbral, aplicar daño adicional
      if (this.deathMark.damage >= this.deathMark.threshold) {
        const target = this.deathMark.target;
        const deathMarkDamage = Math.floor(this.damage * 1.5);
        target.health -= deathMarkDamage;
        this.deathMark = null; // Limpiar la marca
        
        return {
          damage: amount,
          deathMark: true,
          deathMarkDamage: deathMarkDamage,
          currentHealth: this.health,
          message: `${this.name} activa la Marca de Muerte causando ${deathMarkDamage} daño adicional.`
        };
      }
    }
    
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
    
    // Verificar si muere
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      
      // Verificar resurrección (solo Obispo nivel 3 puede auto-resucitarse)
      if (this.class === "Obispo" && this.resurrectSelf && !this.usedSelfResurrect && 
          Math.random() < this.resurrectChance * 0.5) {
        this.health = Math.floor(this.maxHealth * 0.25);
        this.isDead = false;
        this.usedSelfResurrect = true; // Solo una vez por combate
        
        return {
          damage: amount,
          resurrected: true,
          currentHealth: this.health,
          message: `¡${this.name} se niega a morir y se auto-resucita con un poder divino!`
        };
      }
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
    this.healCooldown = (this.class === "Obispo") ? 1 : 
                       (this.class === "Sacerdote") ? 2 : 3;
    
    // Si hay objetivo, curar al objetivo
    if (target) {
      const healAmount = this.healAmount;
      let actualHeal = healAmount;
      
      // Bonus por clase avanzada
      if (this.class === "Sacerdote") {
        actualHeal = Math.floor(healAmount * this.groupHealEfficiency);
      } else if (this.class === "Obispo") {
        actualHeal = Math.floor(healAmount * this.groupHealEfficiency);
      }
      
      target.health = Math.min(target.maxHealth, target.health + actualHeal);
      this.combatStats.healingDone += actualHeal;
      
      // Purificar efectos negativos (solo Clérigos/Sacerdotes/Obispos)
      let purified = false;
      if ((this.class === "Clérigo" || this.class === "Sacerdote" || this.class === "Obispo") && 
          this.purifyChance && Math.random() < this.purifyChance) {
        purified = true;
      }
      
      return {
        healed: true,
        target: target.name,
        amount: actualHeal,
        purified: purified,
        currentHealth: target.health,
        message: `${this.name} cura a ${target.name} por ${actualHeal} puntos.`
      };
    }
    // Si no, curarse a sí mismo
    else {
      const healAmount = this.healAmount;
      this.health = Math.min(this.maxHealth, this.health + healAmount);
      this.combatStats.healingDone += healAmount;
      
      // Purificar efectos negativos propios
      let purified = false;
      if ((this.class === "Clérigo" || this.class === "Sacerdote" || this.class === "Obispo") && 
          this.purifyChance && Math.random() < this.purifyChance) {
        purified = true;
      }
      
      return {
        healed: true,
        amount: healAmount,
        purified: purified,
        currentHealth: this.health,
        message: `${this.name} se cura por ${healAmount} puntos.`
      };
    }
  }

  // MODIFICADO: Ataque mejorado con habilidades de clase
  attack(target) {
    if (this.isDead) return { success: false, reason: "Aventurero muerto" };
    
    let damageDealt = this.damage;
    let effects = [];
    let message = "";
    
    // Aplicar bonificaciones o habilidades especiales según la clase
    switch(this.classGeneration) {
      // Primera generación - habilidades básicas
      case 1:
        // Guerrero - ataque potente ocasional
        if (this.class === "Guerrero" && Math.random() < 0.2) {
          damageDealt = Math.floor(damageDealt * 1.3);
          message = "realiza un ataque potente";
          effects.push("strong_attack");
        }
        
        // Mago - ataque mágico
        else if (this.class === "Mago" && this.hasMagicAttack) {
          damageDealt = Math.floor(damageDealt * this.magicPower);
          message = "lanza una descarga arcana";
          effects.push("magic");
          
          // Debuff ocasional
          if (Math.random() < this.debuffChance) {
            effects.push("debuff");
            effects.push(["weakness", "slow"][Math.floor(Math.random() * 2)]);
            message += " con un efecto debilitante";
          }
        }
        
        // Ladrón - críticos frecuentes
        else if (this.class === "Ladrón" && Math.random() < this.criticalChance) {
          damageDealt = Math.floor(damageDealt * (this.criticalMultiplier || 1.5));
          message = "encuentra un punto débil y realiza un golpe crítico";
          effects.push("critical");
          this.combatStats.criticalHits++;
        }
        
        // Clérigo - daño con curación ocasional
        else if (this.class === "Clérigo" && Math.random() < 0.15) {
          message = "canaliza energía divina";
          effects.push("holy");
          
          // Curación aliada
          if (Math.random() < 0.3) {
            effects.push("healing_pulse");
            message += " que también cura a sus aliados";
          }
        }
        
        // Arquero - ataque a distancia
        else if (this.class === "Arquero" && this.ranged) {
          message = "dispara una flecha certera";
          effects.push("ranged");
          
          // Crítico ocasional
          if (Math.random() < this.criticalChance) {
            damageDealt = Math.floor(damageDealt * 1.8);
            message += " que da en un punto vital";
            effects.push("critical");
            this.combatStats.criticalHits++;
          }
        }
        break;
        
      // Segunda generación - habilidades intermedias
      case 2:
        // Caballero - ataques tácticos
        if (this.class === "Caballero") {
          // Escudo bashing
          if (Math.random() < this.shieldBashChance) {
            effects.push("shield_bash");
            effects.push("stun");
            message = "golpea con su escudo aturdiendo al enemigo";
          } else {
            message = "ejecuta un corte táctico";
            
            // Provocar
            if (Math.random() < 0.2) {
              effects.push("taunt");
              message += " provocando a su enemigo";
            }
          }
        }
        
        // Archimago - ataques elementales avanzados
        else if (this.class === "Archimago" && this.hasMagicAttack) {
          damageDealt = Math.floor(damageDealt * this.magicPower);
          
          // Tipo de ataque elemental
          const elementType = ["fire", "ice", "arcane"][Math.floor(Math.random() * 3)];
          effects.push(elementType);
          
          if (elementType === "fire") {
            message = "lanza una bola de fuego";
            effects.push("burn");
          } else if (elementType === "ice") {
            message = "invoca una ventisca de hielo";
            effects.push("slow");
          } else {
            message = "dispara un rayo arcano";
            effects.push("arcane_damage");
          }
          
          // Ataque en área
          if (Math.random() < this.aoeAttackChance) {
            effects.push("aoe");
            message += " que afecta a un área";
          }
        }
        
        // Asesino - ataques sigilosos mortales
        else if (this.class === "Asesino") {
          // Shadow Step (teleport)
          if (Math.random() < this.shadowStepChance) {
            effects.push("shadow_step");
            message = "se desvanece en las sombras y reaparece para atacar";
          }
          
          // Crítico mejorado
          if (Math.random() < this.criticalChance) {
            damageDealt = Math.floor(damageDealt * this.criticalMultiplier);
            effects.push("critical");
            if (effects.includes("shadow_step")) {
              damageDealt = Math.floor(damageDealt * 1.3); // Bonus por ataque sorpresa
              message += " con un golpe devastador desde las sombras";
            } else {
              message = "encuentra un punto vital y realiza un golpe crítico";
            }
            this.combatStats.criticalHits++;
          }
          
          // Veneno
          if (Math.random() < this.poisonChance) {
            effects.push("poison");
            message += " envenenando al objetivo";
          }
        }
        
        // Sacerdote - ataques divinos con soporte
        else if (this.class === "Sacerdote") {
          effects.push("holy");
          message = "canaliza poder divino";
          
          // Ataque que también cura
          if (Math.random() < 0.4) {
            effects.push("healing_pulse");
            message += " que fortalece a sus aliados";
          }
          
          // Protección divina
          if (Math.random() < this.divineProtection) {
            effects.push("divine_protection");
            message += " y crea un aura de protección";
          }
        }
        
        // Arquera Elemental - ataques elementales a distancia
        else if (this.class === "Arquera Elemental" && this.ranged) {
          effects.push("ranged");
          
          // Tipo de flecha elemental
          const arrowType = this.elementalDamage.type;
          effects.push(arrowType);
          damageDealt = Math.floor(damageDealt * (1 + this.elementalDamage.bonus));
          
          if (arrowType === "fire") {
            message = "dispara una flecha de fuego";
            effects.push("burn");
          } else if (arrowType === "ice") {
            message = "dispara una flecha de hielo";
            effects.push("slow");
          } else {
            message = "dispara una flecha de relámpago";
            effects.push("lightning");
          }
          
          // Disparo múltiple
          if (Math.random() < this.multishotChance) {
            effects.push("multishot");
            message = "dispara múltiples flechas elementales";
          }
        }
        break;
        
      // Tercera generación - habilidades avanzadas
      case 3:
        // Paladín - campeón de la luz
        if (this.class === "Paladín") {
          effects.push("holy");
          damageDealt = Math.floor(damageDealt * (1 + this.holyDamage));
          
          // Tipo de ataque divino
          if (Math.random() < 0.3) {
            effects.push("judgement");
            message = "ejecuta un Juicio Divino";
            damageDealt = Math.floor(damageDealt * 1.5);
          } else {
            message = "canaliza luz sagrada en su arma";
            
            // Inspiración para aliados
            if (Math.random() < this.inspirationAura) {
              effects.push("inspiration");
              message += " inspirando a sus aliados";
            }
          }
          
          // Escudo divino activado por probabilidad
          if (!this.divineShieldActive && Math.random() < 0.1 && this.divineShieldCooldown <= 0) {
            this.divineShieldActive = true;
            this.divineShieldCooldown = 5;
            effects.push("divine_shield_activate");
            message += " y activa su escudo divino";
          }
        }
        
        // Mago Arcano - maestro de los elementos
        else if (this.class === "Mago Arcano" && this.hasMagicAttack) {
          damageDealt = Math.floor(damageDealt * this.magicPower);
          
          // Especialidad arcana
          if (Math.random() < 0.25) {
            effects.push("arcane_explosion");
            message = "desata una explosión arcana devastadora";
            damageDealt = Math.floor(damageDealt * 1.8);
            effects.push("aoe");
          } else {
            // Ataque basado en maestría
            effects.push(this.spellMastery);
            
            if (this.spellMastery === "fire") {
              message = "conjura un pilar de fuego";
              effects.push("burn");
            } else if (this.spellMastery === "ice") {
              message = "invoca una tormenta de hielo";
              effects.push("freeze");
            } else if (this.spellMastery === "arcane") {
              message = "manipula energía arcana pura";
              effects.push("mana_burn");
            } else {
              message = "abre un portal al vacío";
              effects.push("void_damage");
            }
          }
          
          // Manipulación temporal
          if (Math.random() < this.timeManipulation) {
            effects.push("time_warp");
            message += " alterando el flujo temporal";
          }
        }
        
        // Sombra - Asesino de élite
        else if (this.class === "Sombra") {
          // Generación de sombras clonadas
          if (!this.shadowClones && Math.random() < this.shadowCloneChance) {
            this.shadowClones = 2;
            effects.push("shadow_clones");
            message = "genera clones de sombra para confundir";
          }
          
          // Crítico letal
          if (Math.random() < this.criticalChance) {
            damageDealt = Math.floor(damageDealt * this.criticalMultiplier);
            effects.push("critical");
            this.combatStats.criticalHits++;
            
            // Marca de muerte
            if (!this.deathMark && Math.random() < 0.3) {
              effects.push("death_mark");
              message = "marca a su objetivo para la muerte";
              this.deathMark = {
                target: target,
                damage: 0,
                threshold: target.maxHealth * 0.3,
                duration: this.deathMarkDuration
              };
            } else {
              message = "ejecuta un golpe mortal desde las sombras";
            }
          }
          
          // Teleportación
          if (Math.random() < 0.2 && this.blinkCooldown <= 0) {
            effects.push("blink");
            message = (message === "") ? "se teletransporta en un destello de sombras" : 
                                        message + " después de teletransportarse";
            this.blinkCooldown = 3;
          }
          
          // Veneno mejorado
          if (Math.random() < this.poisonChance) {
            effects.push("deadly_poison");
            message += " aplicando un veneno mortal";
          }
        }
        
        // Obispo - Maestro de la luz y la vida
        else if (this.class === "Obispo") {
          effects.push("holy");
          message = "canaliza luz divina concentrada";
          damageDealt = Math.floor(damageDealt * 1.3);
          
          // Juicio divino
          if (Math.random() < this.divineJudgement) {
            effects.push("divine_judgement");
            message = "pronuncia un Juicio Divino";
            damageDealt = Math.floor(damageDealt * 1.8);
          }
          
          // Curación masiva
          if (Math.random() < 0.2 && this.massHealCooldown <= 0) {
            effects.push("mass_healing");
            message += " e invoca una onda de curación masiva";
            this.massHealCooldown = 4;
          }
          
          // Barrera santa
          if (Math.random() < this.holyBarrier) {
            effects.push("holy_barrier");
            message += " creando una barrera de luz protectora";
          }
        }
        
        // Francotirador - Maestro de la precisión
        else if (this.class === "Francotirador" && this.ranged) {
          effects.push("ranged");
          
          // Disparo mortal
          if (Math.random() < this.eagleEyePrecision) {
            effects.push("deadly_shot");
            damageDealt = Math.floor(damageDealt * 2.0);
            message = "realiza un disparo certero a un punto vital";
          }
          // Disparo penetrante
          else if (Math.random() < this.piercingShot) {
            effects.push("piercing_shot");
            message = "dispara una flecha que atraviesa la defensa";
          }
          // Disparo explosivo
          else if (Math.random() < 0.2 && this.explosiveShotCooldown <= 0) {
            effects.push("explosive_shot");
            effects.push("aoe");
            message = "dispara una flecha explosiva";
            this.explosiveShotCooldown = 3;
          }
          else {
            message = "dispara con precisión infalible";
          }
          
          // Crítico
          if (Math.random() < this.criticalChance) {
            damageDealt = Math.floor(damageDealt * this.criticalMultiplier);
            effects.push("critical");
            message += " que da en un punto crítico";
            this.combatStats.criticalHits++;
          }
        }
        break;
      
      default:
        message = "ataca";
    }
    
    // NUEVO: Actualizar estadísticas de combate
    this.combatStats.damageDealt += damageDealt;
    
    return {
      success: true,
      damage: damageDealt,
      isCritical: effects.includes("critical"),
      ranged: this.ranged || false,
      effects: effects,
      message: message
    };
  }

  // Método para intentar desactivar una trampa (para ladrones/asesinos)
  attemptDisarmTrap(trap) {
    if (!this.trapDisarmChance) return { success: false };
    
    const disarmChance = this.trapDisarmChance;
    // Bonificación por nivel
    const levelBonus = (this.level - 1) * 0.03;
    // Penalización por nivel de trampa
    const trapPenalty = (trap.level - 1) * 0.05;
    
    // Probabilidad final
    const finalChance = Math.min(0.9, Math.max(0.1, disarmChance + levelBonus - trapPenalty));
    const isSuccessful = Math.random() < finalChance;
    
    // Actualizar estadísticas si tiene éxito
    if (isSuccessful) {
      this.combatStats.trapsDisarmed++;
    }
    
    return {
      success: isSuccessful,
      chance: finalChance,
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
    
    if (this.blinkCooldown > 0) {
      this.blinkCooldown--;
    }
    
    if (this.divineShieldCooldown > 0) {
      this.divineShieldCooldown--;
    }
    
    if (this.explosiveShotCooldown > 0) {
      this.explosiveShotCooldown--;
    }
    
    if (this.massHealCooldown > 0) {
      this.massHealCooldown--;
    }
    
    // Actualizar duración de la marca de muerte
    if (this.deathMark) {
      this.deathMark.duration--;
      if (this.deathMark.duration <= 0) {
        this.deathMark = null;
      }
    }
  }
  
  // NUEVO: Método para obtener estadísticas de combate
  getCombatStats() {
    return {
      ...this.combatStats,
      survivalRatio: this.health / this.maxHealth,
      effectiveLevel: this.level,
      className: this.class,
      classGeneration: this.classGeneration,
      abilities: this.abilities
    };
  }
  
  // Decide la siguiente acción en base a la situación del tablero
  decideNextAction(dungeon, currentPosition) {
    // Inicializar conjunto de posiciones visitadas si no existe
    this.visitedPositions = this.visitedPositions || new Set();
    this.visitedPositions.add(`${currentPosition.x},${currentPosition.y}`);
    
    // Actualizar cooldowns
    this.updateCooldowns();
    
    // Calcular probabilidad de error basada en nivel y clase
    let errorChance = Math.max(0.05, 0.3 - (0.03 * this.level) - (this.classGeneration * 0.05));
    
    // Clases tácticas cometen menos errores (Arquero, Caballero, etc.)
    if (["Caballero", "Arquero", "Paladín", "Francotirador"].includes(this.class)) {
      errorChance *= 0.7;
    }
    
    const makesMistake = Math.random() < errorChance;
    
    // A veces se queda quieto por indecisión
    if (makesMistake && Math.random() < 0.3) {
      return null;
    }
    
    // Buscar la posición del objetivo final (jefe)
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
    
    // Habilidades especiales que modifican la toma de decisiones
    
    // Blink para Sombras (teleportación ocasional)
    if (this.class === "Sombra" && this.blinkCooldown <= 0 && Math.random() < 0.4) {
      // Buscar posición a la que saltar (más cerca del objetivo)
      const possibleBlinks = [];
      const maxBlinkRange = 2; // Distancia máxima de teleportación
      
      for (let y = Math.max(0, currentPosition.y - maxBlinkRange); 
           y <= Math.min(dungeon.length - 1, currentPosition.y + maxBlinkRange); y++) {
        for (let x = Math.max(0, currentPosition.x - maxBlinkRange); 
             x <= Math.min(dungeon[0].length - 1, currentPosition.x + maxBlinkRange); x++) {
          
          // No teleportarse a la posición actual
          if (x === currentPosition.x && y === currentPosition.y) continue;
          
          // Solo teleportarse a celdas válidas
          const cell = dungeon[y][x];
          if (cell && (cell.type === 'path' || cell.type === 'trap')) {
            const distanceToPlayer = playerPos ? 
              Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) : 
              9999;
              
            possibleBlinks.push({
              x, y, 
              distanceToPlayer,
              isVisited: this.visitedPositions.has(`${x},${y}`)
            });
          }
        }
      }
      
      // Ordenar por distancia al objetivo y preferir celdas no visitadas
      if (possibleBlinks.length > 0) {
        possibleBlinks.sort((a, b) => {
          // Prioridad 1: Preferir celdas no visitadas
          if (a.isVisited !== b.isVisited) {
            return a.isVisited ? 1 : -1;
          }
          // Prioridad 2: Más cerca del objetivo
          return a.distanceToPlayer - b.distanceToPlayer;
        });
        
        // Usar el mejor blink
        const bestBlink = possibleBlinks[0];
        this.blinkCooldown = 3;
        
        return {
          x: bestBlink.x,
          y: bestBlink.y,
          targetType: dungeon[bestBlink.y][bestBlink.x]?.type || 'path',
          blink: true
        };
      }
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
          
          // Analizar tipo de celda para preferencias
          const cellType = dungeon[newY][newX]?.type || 'path';
          let cellPreference = 0;
          
          // Aplicar preferencias según clase
          if (this.preferredTargets.includes(cellType)) {
            // Posición de la preferencia en la lista (0 = más preferida)
            const preferenceIndex = this.preferredTargets.indexOf(cellType);
            cellPreference = 3 - preferenceIndex; // Invierte la puntuación (3 = más alta)
          }
          
          return {
            x: newX,
            y: newY,
            cell: dungeon[newY][newX],
            distanceToPlayer,
            isVisited,
            cellPreference
          };
        }
        return null;
      })
      .filter(move => move !== null);
    
    // Ordenar movimientos (a menos que cometa error)
    if (!makesMistake) {
      validMoves.sort((a, b) => {
        // Prioridad 1: Preferencia de celda
        if (a.cellPreference !== b.cellPreference) {
          return b.cellPreference - a.cellPreference;
        }
        
        // Prioridad 2: No visitados
        if (a.isVisited !== b.isVisited) {
          return a.isVisited ? 1 : -1;
        }
        
        // Prioridad 3: Distancia al objetivo
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
  
  // NUEVO: Método para subir de nivel al aventurero
  levelUp(levels = 1) {
    if (this.level >= 10) return false; // Ya en nivel máximo
    
    const oldLevel = this.level;
    this.level = Math.min(10, this.level + levels);
    
    // Calcular escalado de estadísticas por nivel
    const levelScaling = gameConfig.levelProgression.adventurerLevelBonus;
    
    // Obtener estadísticas base de la clase actual
    const baseStats = gameConfig.adventurers.classBaseStats[this.class];
    
    // Calcular nuevas estadísticas
    this.maxHealth = Math.floor(baseStats.health * (1 + (this.level - 1) * levelScaling.health));
    this.health = this.maxHealth; // Restaurar salud al subir de nivel
    this.damage = Math.floor(baseStats.damage * (1 + (this.level - 1) * levelScaling.damage));
    this.defense = Math.floor(baseStats.defense * (1 + (this.level - 1) * levelScaling.defense));
    
    // Actualizar propiedades de recompensa
    const levelMultiplier = 1 + ((this.level - oldLevel) * 0.2);
    this.gold = Math.floor(this.gold * levelMultiplier);
    this.experienceValue = Math.floor(this.experienceValue * levelMultiplier);
    
    // Reaplicar estadísticas especiales
    this.applyClassSpecialStats();
    
    // Verificar si debe evolucionar
    if (this.classGeneration === 1 && this.level >= gameConfig.levelProgression.classEvolutionLevel.firstToSecond) {
      // Probabilidad de evolución
      const evolutionChance = gameConfig.utils.calculateEvolutionChance(this.day, this.level, 'first');
      if (Math.random() < evolutionChance) {
        this.evolve();
      }
    } else if (this.classGeneration === 2 && this.level >= gameConfig.levelProgression.classEvolutionLevel.secondToThird) {
      // Probabilidad de evolución
      const evolutionChance = gameConfig.utils.calculateEvolutionChance(this.day, this.level, 'second');
      if (Math.random() < evolutionChance) {
        this.evolve();
      }
    }
    
    return true;
  }
  
  // NUEVO: Método para obtener el valor total del aventurero
  getValue() {
    // Base value
    let value = this.gold + this.experienceValue;
    
    // Factores multiplicadores
    const levelFactor = 1 + ((this.level - 1) * 0.1);
    const generationFactor = 1 + ((this.classGeneration - 1) * 0.5);
    
    // Calcular valor final
    value = Math.floor(value * levelFactor * generationFactor);
    
    // Bonus por estadísticas de combate
    if (this.combatStats.kills > 0) {
      value += this.combatStats.kills * 5;
    }
    
    if (this.combatStats.damageDealt > 0) {
      value += Math.floor(this.combatStats.damageDealt * 0.1);
    }
    
    return value;
  }
}
  
export default Adventurer;