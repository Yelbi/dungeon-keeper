// src/models/Monster.js - REBALANCEADO
class Monster {
  constructor(config) {
    // Propiedades básicas
    this.id = config.id;
    this.name = config.name;
    this.type = "monster";
    this.level = config.level || 1;
    this.maxLevel = config.maxLevel || 10;
    
    // Calcular estadísticas base con escalado por nivel
    const levelBonus = this.calculateLevelBonus();
    this.health = Math.floor(config.health * levelBonus.health);
    this.maxHealth = this.health;
    this.damage = Math.floor(config.damage * levelBonus.damage);
    this.defense = Math.floor((config.defense || 0) * levelBonus.defense);
    
    // Costos y disponibilidad
    this.cost = Math.floor(config.cost * (1 + (this.level - 1) * 0.25));
    this.unlocked = config.unlocked || false;
    this.position = config.position || { x: 0, y: 0 };
    
    // Estados de combate
    this.isDead = false;
    this.cooldown = 0; // Turnos hasta poder atacar de nuevo
    this.attackSpeed = config.cooldown || 2;
    this.attackRange = config.attackRange || 1;
    
    // Rasgos especiales
    this.specialTrait = config.specialTrait;
    this.emoji = config.emoji || "👾";
    this.description = config.description || "Un monstruo común que protege la mazmorra.";
    
    // Aplicar bonificaciones específicas para cada tipo de monstruo
    this.applyMonsterSpecialties();
    
    // Memoria y comportamiento táctico
    this.memories = {};
    this.tacticalPreferences = {};
    this.lastTactic = null;
    
    // Estadísticas de combate
    this.combatStats = {
      damageDealt: 0,
      damageReceived: 0,
      criticalHits: 0,
      kills: 0,
      healingDone: 0,
      turnsActive: 0
    };
  }
  
  // Calcula los bonos por nivel
  calculateLevelBonus() {
    const bonusPercentages = {
      health: 1 + ((this.level - 1) * 0.2),    // +20% salud por nivel
      damage: 1 + ((this.level - 1) * 0.15),    // +15% daño por nivel
      defense: 1 + ((this.level - 1) * 0.1),    // +10% defensa por nivel
      cooldown: Math.max(0.5, 1 - ((this.level - 1) * 0.05))  // -5% cooldown por nivel
    };
    
    return bonusPercentages;
  }
  
  // Aplica propiedades específicas según el tipo de monstruo
  applyMonsterSpecialties() {
    switch (this.name) {
      case "Slime":
        // Slimes se dividen al ser dañados
        this.regeneration = Math.floor(this.maxHealth * 0.03); // Regeneración lenta
        this.splitThreshold = Math.floor(this.maxHealth * 0.3); // Se divide al llegar a 30% de vida
        this.splitCount = 0; // Lleva cuenta de las veces que se ha dividido
        this.maxSplits = 1; // Máximo de divisiones
        this.attackSpeed = 2; // Lento pero constante
        this.slimeDamageReduction = 0.1 + (this.level * 0.02); // Reducción de daño por ser gelatinoso
        break;
        
      case "Goblin":
        // Los goblins son rápidos pero débiles, buenos para primeras oleadas
        this.attackSpeed = 1; // Puede atacar cada turno
        this.criticalChance = 0.12 + (this.level * 0.01); // Probabilidad de crítico
        this.criticalMultiplier = 1.5; // Multiplicador de daño crítico
        this.evasion = 0.15 + (this.level * 0.02); // Probabilidad de evadir ataques
        this.attackSpeed = 1; // Muy rápido
        break;
        
      case "Esqueleto":
        // No muertos resistentes a veneno y debilidades físicas
        this.attackSpeed = 2;
        this.physicalResistance = 0.2 + (this.level * 0.02); // Resistencia física
        this.poisonImmunity = true; // Inmune a veneno
        this.magicWeakness = 0.25; // Debilidad contra magia
        this.undeadResilience = 0.1 + (this.level * 0.03); // Probabilidad de resistir un golpe fatal
        break;
        
      case "Araña Gigante":
        // Las arañas envenenan y atacan desde distintos ángulos
        this.attackSpeed = 2;
        this.poisonChance = 0.25 + (this.level * 0.03); // Probabilidad de envenenar
        this.poisonDuration = 3; // Duración del veneno
        this.poisonDamage = Math.floor(this.damage * 0.3); // Daño del veneno
        this.evasion = 0.1 + (this.level * 0.02); // Evasión moderada
        this.ambushChance = 0.15 + (this.level * 0.02); // Emboscada para daño adicional
        break;
        
      case "Orco":
        // Los orcos son fuertes y resistentes, entran en frenesí
        this.attackSpeed = 3; // Más lento
        this.stunChance = 0.15 + (this.level * 0.02); // Puede aturdir al enemigo
        this.armor = Math.floor(this.level * 1.2); // Reduce el daño recibido
        this.berserkThreshold = 0.4; // Activa frenesí al llegar a 40% de vida
        this.berserkDamageBonus = 0.5; // +50% daño en modo frenesí
        this.berserkActive = false; // Estado actual de frenesí
        break;
        
      case "Golem de Piedra":
        // Golems son muy duros pero lentos
        this.attackSpeed = 4; // Muy lento
        this.stunChance = 0.3 + (this.level * 0.03); // Alta probabilidad de aturdir
        this.stunDuration = 2; // Duración del aturdimiento
        this.armor = Math.floor(this.level * 2); // Gran reducción de daño
        this.reflection = 0.15 + (this.level * 0.02); // Refleja parte del daño recibido
        break;
        
      case "Troll":
        // Los trolls tienen regeneración alta y pueden ser difíciles de matar
        this.attackSpeed = 3;
        this.regeneration = Math.floor(this.maxHealth * 0.05) + this.level; // Regeneración poderosa
        this.areaAttack = true; // Daña a todos los aventureros cercanos
        this.areaAttackDamageModifier = 0.7; // Daño reducido en área
        this.areaAttackRange = 1; // Afecta a celdas adyacentes
        break;
        
      case "Elemental de Fuego":
        // Los elementales de fuego queman e ignoran defensas
        this.attackSpeed = 2;
        this.fireImmunity = true; // Inmune a fuego
        this.burnChance = 0.35 + (this.level * 0.03); // Probabilidad de quemar
        this.burnDuration = 3; // Duración de la quemadura
        this.burnDamage = Math.floor(this.damage * 0.4); // Daño por quemadura
        this.magicPenetration = 0.2 + (this.level * 0.03); // Ignora resistencia mágica
        break;
        
      case "Hechicero Oscuro":
        // Los hechiceros debilitan y lanzan maldiciones
        this.attackSpeed = 3;
        this.hasMagicAttack = true; // Ataque mágico
        this.attackRange = 3; // Alcance de ataque
        this.debuffChance = 0.3 + (this.level * 0.03); // Probabilidad de debilitar
        this.debuffStrength = 0.2 + (this.level * 0.02); // Fuerza del debilitamiento
        this.manaShield = 0.2 + (this.level * 0.02); // Reducción de daño mágico
        this.counterSpellChance = 0.15 + (this.level * 0.02); // Contrahechizo
        break;
        
      case "Dragón Joven":
        // Los dragones son muy poderosos con aliento de fuego
        this.attackSpeed = 4; // Lento pero devastador
        this.fireBreath = true; // Aliento de fuego (ataque en área)
        this.fireBreathDamage = this.damage * (1.5 + (this.level * 0.1)); // Daño del aliento
        this.fireBreathCooldown = 3; // Usa aliento cada 3 turnos
        this.fireBreathCharges = 3; // Número de cargas del aliento
        this.armor = Math.floor(this.level * 1.5); // Alta reducción de daño
        this.fireBreathRange = 2; // Alcance del aliento
        this.flightChance = 0.2; // Probabilidad de alzar vuelo (inmunidad temporal)
        this.flightDuration = 1; // Duración del vuelo
        break;
        
      case "Liche":
        // Liches invocan esqueletos y drenan vida
        this.attackSpeed = 3;
        this.hasMagicAttack = true;
        this.attackRange = 3;
        this.summonChance = 0.2 + (this.level * 0.02); // Probabilidad de invocar
        this.summonCooldown = 4; // Cooldown para invocar
        this.drainLifeChance = 0.25 + (this.level * 0.03); // Probabilidad de drenar vida
        this.drainLifeAmount = 0.5; // Porcentaje del daño que recupera
        this.undeadAura = 0.15 + (this.level * 0.02); // Aura que debilita aventureros
        break;
        
      case "Behemot":
        // Los behemots son gigantes devastadores
        this.attackSpeed = 4; // Muy lento
        this.areaAttack = true;
        this.areaAttackRange = 2; // Gran área de efecto
        this.earthquakeChance = 0.2 + (this.level * 0.02); // Probabilidad de terremoto
        this.earthquakeDamage = this.damage * 1.2; // Daño del terremoto
        this.earthquakeCooldown = 5; // Cooldown para terremoto
        this.damageReduction = 0.2 + (this.level * 0.02); // Reducción de daño general
        this.heavyImpactChance = 0.3; // Probabilidad de impacto pesado (aturdimiento)
        break;
        
      default:
        // Valores por defecto
        this.attackSpeed = 2;
        this.criticalChance = 0.05;
        this.evasion = 0;
        break;
    }
  }
  
  // Actualiza propiedades cuando sube de nivel
  levelUp() {
    if (this.level >= this.maxLevel) {
      return false;
    }
    
    this.level += 1;
    
    // Obtener bonificaciones por nivel
    const levelBonus = this.calculateLevelBonus();
    
    // Actualizar estadísticas base
    this.health = Math.floor(this.health * levelBonus.health);
    this.maxHealth = this.health;
    this.damage = Math.floor(this.damage * levelBonus.damage);
    this.defense = Math.floor(this.defense * levelBonus.defense);
    
    // Actualizar coste
    this.cost = Math.floor(this.cost * 1.25);
    
    // Actualizar propiedades especiales
    this.applyMonsterSpecialties();
    
    return true;
  }
  
  // Recibe daño y verifica si muere
  takeDamage(amount, attackType = "physical") {
    let actualDamage = amount;
    
    // Verificar si el monstruo está en modo vuelo (solo Dragón)
    if (this.name === "Dragón Joven" && this.isFlying) {
      return {
        damage: 0,
        blocked: amount,
        evaded: true,
        currentHealth: this.health,
        isDead: this.isDead,
        message: `${this.name} evita el daño mientras vuela.`
      };
    }
    
    // Aplicar reducciones de daño según tipo
    if (attackType === "physical") {
      // Resistencia física (Esqueletos)
      if (this.physicalResistance) {
        const blockAmount = Math.floor(amount * this.physicalResistance);
        actualDamage -= blockAmount;
      }
      
      // Reducción de daño por ser gelatinoso (Slime)
      if (this.slimeDamageReduction) {
        actualDamage = Math.floor(actualDamage * (1 - this.slimeDamageReduction));
      }
    } else if (attackType === "magic") {
      // Debilidad mágica (Esqueletos)
      if (this.magicWeakness) {
        actualDamage = Math.floor(actualDamage * (1 + this.magicWeakness));
      }
      
      // Escudo de mana (Hechicero Oscuro)
      if (this.manaShield) {
        actualDamage = Math.floor(actualDamage * (1 - this.manaShield));
      }
    }
    
    // Aplicar inmunidades
    if (attackType === "fire" && this.fireImmunity) {
      actualDamage = 0;
    }
    
    if (attackType === "poison" && this.poisonImmunity) {
      actualDamage = 0;
    }
    
    // Aplicar armadura si existe
    if (this.armor) {
      actualDamage = Math.max(1, actualDamage - this.armor);
    }
    
    // Aplicar evasión (Goblins, Arañas)
    if (this.evasion && Math.random() < this.evasion) {
      return {
        damage: 0,
        blocked: amount,
        evaded: true,
        currentHealth: this.health,
        isDead: this.isDead,
        message: `${this.name} evade el ataque con agilidad.`
      };
    }
    
    // Aplicar reducción de daño general (Behemot)
    if (this.damageReduction) {
      actualDamage = Math.floor(actualDamage * (1 - this.damageReduction));
    }
    
    // Reflejar daño si tiene esa habilidad (Golem)
    let reflectionDamage = 0;
    if (this.reflection && attackType === "physical") {
      reflectionDamage = Math.floor(amount * this.reflection);
    }
    
    // Aplicar el daño
    this.health = Math.max(0, this.health - actualDamage);
    this.combatStats.damageReceived += actualDamage;
    
    // Verificar activación de frenesí (Orco)
    if (this.name === "Orco" && this.berserkThreshold && 
        this.health <= this.maxHealth * this.berserkThreshold && !this.berserkActive) {
      this.berserkActive = true;
      this.damage = Math.floor(this.damage * (1 + this.berserkDamageBonus));
    }
    
    // Verificar división (Slime)
    let splitOccurred = false;
    if (this.name === "Slime" && this.splitThreshold && 
        this.health <= this.maxHealth * this.splitThreshold && 
        this.splitCount < this.maxSplits) {
      this.splitCount += 1;
      splitOccurred = true;
      
      // Recuperar algo de salud al dividirse
      this.health += Math.floor(this.maxHealth * 0.2);
    }
    
    // Verificar si muere
    if (this.health <= 0) {
      // Intento de sobrevivir para no-muertos (Esqueleto, Liche)
      if (this.undeadResilience && Math.random() < this.undeadResilience) {
        this.health = 1; // Sobrevive con 1 de vida
        return {
          damage: actualDamage,
          blocked: amount - actualDamage,
          reflection: reflectionDamage,
          currentHealth: this.health,
          undeadResilience: true,
          isDead: false,
          split: splitOccurred,
          message: `${this.name} se niega a morir, manteniéndose en pie con 1 de vida.`
        };
      }
      
      this.health = 0;
      this.isDead = true;
    }
    
    // Resultado final
    return {
      damage: actualDamage,
      blocked: amount - actualDamage,
      reflection: reflectionDamage,
      currentHealth: this.health,
      isDead: this.isDead,
      split: splitOccurred,
      message: splitOccurred ? `${this.name} se divide al recibir daño.` : undefined
    };
  }
  
  // Regenera salud si tiene esa habilidad
  regenerate() {
    if (!this.regeneration || this.isDead) return null;
    
    const amountToHeal = this.regeneration;
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amountToHeal);
    const actualHeal = this.health - oldHealth;
    
    if (actualHeal > 0) {
      this.combatStats.healingDone += actualHeal;
    }
    
    return {
      regenerated: actualHeal > 0,
      amount: actualHeal,
      currentHealth: this.health
    };
  }
  
  // Ataque mejorado con habilidades específicas
  attack(adventurer) {
    if (this.isDead || this.cooldown > 0) {
      return { success: false, cooldown: this.cooldown };
    }
    
    // Registrar turno activo
    this.combatStats.turnsActive++;
    
    // Reinicia el cooldown
    this.cooldown = this.attackSpeed;
    
    // Preparar ataque base
    let damageDealt = this.damage;
    let effects = [];
    let tacticMessage = "";
    
    // Verificar si es un ataque a distancia y si el objetivo está dentro del rango
    if (this.attackRange > 1) {
      const distance = Math.abs(this.position.x - adventurer.position.x) + Math.abs(this.position.y - adventurer.position.y);
      if (distance > this.attackRange) {
        return { 
          success: false, 
          reason: "target_out_of_range",
          message: `${this.name} no puede alcanzar al objetivo desde esta distancia.`
        };
      }
    }
    
    // Verificar si es un ataque mágico
    const isSpecialAttack = this.specialTrait === "fireBreath" || 
                          this.hasMagicAttack || 
                          this.specialTrait === "poison" ||
                          this.specialTrait === "burn";
    
    // Implementar comportamientos específicos según tipo de monstruo
    switch (this.name) {
      case "Slime":
        // Ataque básico con probabilidad de ralentizar
        if (Math.random() < 0.3 + (this.level * 0.03)) {
          effects.push("slow");
          tacticMessage = " engullendo parcialmente al objetivo y ralentizándolo";
        } else {
          tacticMessage = " con su cuerpo gelatinoso";
        }
        break;
        
      case "Goblin":
        // Ataque rápido con probabilidad de crítico
        if (Math.random() < this.criticalChance) {
          damageDealt = Math.floor(damageDealt * this.criticalMultiplier);
          effects.push("critical");
          tacticMessage = " realizando un golpe crítico desde un ángulo inesperado";
          this.combatStats.criticalHits++;
        } else {
          tacticMessage = " con rápidos movimientos";
        }
        break;
        
      case "Esqueleto":
        // Inmune a efectos de estado, ataque normal
        tacticMessage = " con sus huesos afilados";
        
        // Probabilidad de ataque con armadura penetrante
        if (Math.random() < 0.2 + (this.level * 0.02)) {
          effects.push("armor_pierce");
          tacticMessage = " ignorando parte de la armadura del objetivo";
        }
        break;
        
      case "Araña Gigante":
        // Ataque con veneno
        if (Math.random() < this.poisonChance) {
          effects.push("poison");
          tacticMessage = " inyectando veneno paralizante";
          
          // Guardar datos del envenenamiento
          effects.push({
            type: "poison",
            duration: this.poisonDuration,
            damage: this.poisonDamage
          });
        } else if (Math.random() < this.ambushChance) {
          // Ataque sorpresa
          damageDealt = Math.floor(damageDealt * 1.4);
          effects.push("ambush");
          tacticMessage = " emboscando desde un ángulo ciego";
        } else {
          tacticMessage = " atacando con sus colmillos";
        }
        break;
        
      case "Orco":
        // Ataque potente con probabilidad de aturdir
        if (Math.random() < this.stunChance) {
          effects.push("stun");
          tacticMessage = " golpeando con fuerza brutal y aturdiendo al objetivo";
        } else {
          tacticMessage = " con su fuerza bruta";
        }
        
        // Si está en modo frenesí, mensaje adicional
        if (this.berserkActive) {
          tacticMessage += " en estado de frenesí";
          effects.push("berserk");
        }
        break;
        
      case "Golem de Piedra":
        // Ataque poderoso y lento
        if (Math.random() < this.stunChance) {
          effects.push("stun");
          effects.push({
            type: "stun",
            duration: this.stunDuration
          });
          tacticMessage = " aplastando con un golpe devastador que aturde";
        } else {
          tacticMessage = " con su puño de piedra";
        }
        break;
        
      case "Troll":
        // Ataque que puede afectar a múltiples objetivos
        if (this.areaAttack) {
          effects.push("area_attack");
          tacticMessage = " golpeando el suelo y generando una onda de choque";
          
          // Modificador de daño en área
          damageDealt = Math.floor(damageDealt * this.areaAttackDamageModifier);
        } else {
          tacticMessage = " con un mazo destructor";
        }
        break;
        
      case "Elemental de Fuego":
        // Ataque ígneas que quema
        if (Math.random() < this.burnChance) {
          effects.push("burn");
          effects.push({
            type: "burn",
            duration: this.burnDuration,
            damage: this.burnDamage
          });
          tacticMessage = " envolviendo al objetivo en llamas abrasadoras";
        } else {
          tacticMessage = " con una llamarada ardiente";
        }
        effects.push("magic");
        break;
        
      case "Hechicero Oscuro":
        // Hechizos malignos
        effects.push("magic");
        
        if (Math.random() < this.debuffChance) {
          effects.push("debuff");
          
          // Tipo de debilitamiento aleatorio
          const debuffTypes = ["weakness", "vulnerability", "curse"];
          const debuffType = debuffTypes[Math.floor(Math.random() * debuffTypes.length)];
          effects.push(debuffType);
          
          if (debuffType === "weakness") {
            tacticMessage = " lanzando un hechizo de debilidad";
          } else if (debuffType === "vulnerability") {
            tacticMessage = " aplicando una maldición de vulnerabilidad";
          } else {
            tacticMessage = " invocando una maldición oscura";
          }
          
          // Guardar datos del debilitamiento
          effects.push({
            type: debuffType,
            strength: this.debuffStrength,
            duration: 3 // Duración estándar 3 turnos
          });
        } else {
          tacticMessage = " con energía oscura concentrada";
        }
        break;
        
      case "Dragón Joven":
        // Decidir entre aliento de fuego o ataque normal
        if (this.fireBreath && this.fireBreathCooldown <= 0 && this.fireBreathCharges > 0) {
          // Usar aliento de fuego
          effects.push("fire_breath");
          effects.push("area_attack");
          effects.push("burn");
          damageDealt = this.fireBreathDamage;
          
          // Efectos adicionales
          effects.push({
            type: "burn",
            duration: 3,
            damage: Math.floor(this.damage * 0.3)
          });
          
          tacticMessage = " desatando un devastador aliento de fuego";
          
          // Actualizar contadores
          this.fireBreathCooldown = 3;
          this.fireBreathCharges--;
        } else {
          // Ataque con garras o mordisco
          tacticMessage = " con sus afiladas garras";
          
          // Probabilidad de alzar vuelo
          if (!this.isFlying && Math.random() < this.flightChance) {
            this.isFlying = true;
            this.flightDuration = this.flightDuration || 1;
            effects.push("flight");
            tacticMessage += " y alza el vuelo";
          }
        }
        break;
        
      case "Liche":
        // Ataques de magia negra
        effects.push("magic");
        
        // Decidir tipo de ataque
        if (Math.random() < this.drainLifeChance) {
          // Drenar vida
          effects.push("life_drain");
          tacticMessage = " absorbiendo la fuerza vital de su objetivo";
          
          // Calcular cantidad drenada
          effects.push({
            type: "drain",
            amount: Math.floor(damageDealt * this.drainLifeAmount)
          });
        } else if (Math.random() < this.summonChance && this.summonCooldown <= 0) {
          // Invocar no-muerto
          effects.push("summon");
          tacticMessage = " invocando un sirviente no-muerto";
          this.summonCooldown = 4;
        } else {
          // Debilitar
          effects.push("undead_aura");
          tacticMessage = " proyectando un aura de muerte";
        }
        break;
        
      case "Behemot":
        // Ataques poderosos que sacuden el suelo
        if (Math.random() < this.earthquakeChance && this.earthquakeCooldown <= 0) {
          // Terremoto
          effects.push("earthquake");
          effects.push("area_attack");
          damageDealt = this.earthquakeDamage;
          tacticMessage = " generando un terremoto destructivo";
          this.earthquakeCooldown = 5;
        } else if (Math.random() < this.heavyImpactChance) {
          // Impacto pesado
          effects.push("heavy_impact");
          effects.push("stun");
          tacticMessage = " asestando un golpe que hace temblar el suelo";
        } else {
          tacticMessage = " con su enorme fuerza";
        }
        break;
        
      default:
        tacticMessage = " con fuerza";
    }
    
    // Añadir conocimiento a la memoria táctica
    this.learnFromCombat(adventurer);
    
    // Actualizar estadísticas de combate
    this.combatStats.damageDealt += damageDealt;
    
    return {
      success: true,
      damage: damageDealt,
      effects: effects,
      areaAttack: effects.includes("area_attack"),
      tacticMessage: tacticMessage,
      isSpecial: isSpecialAttack
    };
  }
  
  // Actualizar la memoria táctica del monstruo basado en el combate
  learnFromCombat(adventurer) {
    // Inicializar memoria para este aventurero si no existe
    if (!this.memories[adventurer.id]) {
      this.memories[adventurer.id] = {
        damageTaken: 0,
        damageDealt: 0,
        encounters: 0,
        weaknesses: [],
        strengths: []
      };
    }
    
    // Incrementar contador de encuentros
    this.memories[adventurer.id].encounters++;
    
    // Aprender sobre clases
    if (!this.tacticalPreferences[adventurer.class]) {
      this.tacticalPreferences[adventurer.class] = {
        priority: 0,
        threatLevel: 1,
        counterStrategy: ""
      };
    }
    
    // Ajustar prioridad basada en el tipo de aventurero
    if (["Mago", "Archimago", "Mago Arcano"].includes(adventurer.class)) {
      // Priorizar magos si el monstruo es débil contra magia
      if (this.magicWeakness) {
        this.tacticalPreferences[adventurer.class].priority += 1;
        this.tacticalPreferences[adventurer.class].threatLevel = 2;
      }
    }
    
    if (["Clérigo", "Sacerdote", "Obispo"].includes(adventurer.class)) {
      // Priorizar sanadores para cualquier monstruo
      this.tacticalPreferences[adventurer.class].priority += 1.5;
    }
    
    if (["Guerrero", "Caballero", "Paladín"].includes(adventurer.class)) {
      // Evaluar contra tanques
      if (this.attackRange > 1) {
        // Ventaja para monstruos a distancia
        this.tacticalPreferences[adventurer.class].priority -= 0.5;
      } else {
        this.tacticalPreferences[adventurer.class].priority += 0.5;
        this.tacticalPreferences[adventurer.class].counterStrategy = "area_damage";
      }
    }
  }
  
  // Método para tomar decisiones tácticas basadas en la situación
  decideTactic(nearbyAdventurers, dungeon) {
    // Si no hay aventureros cerca, no hay decisión que tomar
    if (!nearbyAdventurers || nearbyAdventurers.length === 0) {
      return { action: "wait" };
    }
    
    // Posición actual del monstruo
    const myPosition = this.position;
    
    // Si está aturdido, no puede hacer nada
    if (this.isStunned) {
      return { 
        action: "stunned", 
        reason: "stunned"
      };
    }
    
    // Actualizar estados específicos
    this.updateSpecialStates();
    
    // Clasificación y priorización de amenazas
    const targets = nearbyAdventurers.map(target => {
      const adventurer = target.adventurer;
      let threatLevel = 0;
      
      // Evaluar nivel de amenaza
      threatLevel += adventurer.damage * 2; // Daño es importante
      
      // Ajustar según la clase específica
      if (this.tacticalPreferences[adventurer.class]) {
        threatLevel *= this.tacticalPreferences[adventurer.class].threatLevel;
      }
      
      // Priorizar objetivos débiles
      const healthPercentage = adventurer.health / adventurer.maxHealth;
      threatLevel += (1 - healthPercentage) * 50;
      
      // Historial previo con este aventurero
      if (this.memories[adventurer.id]) {
        threatLevel += this.memories[adventurer.id].damageTaken * 0.5;
      }
      
      // Considerar distancia
      threatLevel -= target.distance * 5; // Penalizar objetivos lejanos
      
      return {
        adventurer,
        distance: target.distance,
        threatLevel
      };
    });
    
    // Ordenar por nivel de amenaza (mayor primero)
    targets.sort((a, b) => b.threatLevel - a.threatLevel);
    
    // Comportamiento específico según tipo de monstruo
    let decision = { action: "attack", target: targets[0].adventurer };
    
    // Decisiones especiales según el tipo de monstruo
    switch (this.name) {
      case "Slime":
        // Si está muy herido, intentar dividirse
        if (this.health < this.maxHealth * 0.3 && this.splitCount < this.maxSplits) {
          decision = { action: "defensive", reason: "split" };
        }
        break;
        
      case "Troll":
        // Si está gravemente herido, prefiere regenerarse
        if (this.health < this.maxHealth * 0.3) {
          decision = { action: "defensive", reason: "regenerate" };
        } else if (nearbyAdventurers.filter(a => a.distance <= 1).length >= 2) {
          // Si hay múltiples objetivos cercanos, usar ataque en área
          decision = { 
            action: "area_attack", 
            targets: nearbyAdventurers.filter(t => t.distance <= 1).map(t => t.adventurer),
            reason: "multiple_targets"
          };
        }
        break;
        
      case "Orco":
        // Si está en modo frenesí, atacar al objetivo más cercano
        if (this.berserkActive) {
          const closestTarget = [...targets].sort((a, b) => a.distance - b.distance)[0];
          decision = { 
            action: "attack", 
            target: closestTarget.adventurer, 
            reason: "berserk" 
          };
        }
        break;
        
      case "Elemental de Fuego":
        // Preferir objetivos vulnerables al fuego
        const fireVulnerableTarget = targets.find(t => 
          t.adventurer.class !== "Elemental de Fuego" && // No otros elementales
          !t.adventurer.fireImmunity);
          
        if (fireVulnerableTarget) {
          decision = { 
            action: "attack", 
            target: fireVulnerableTarget.adventurer, 
            reason: "fire_vulnerability" 
          };
        }
        break;
        
      case "Dragón Joven":
        // Comportamiento más sofisticado - analiza el campo de batalla
        if (this.fireBreath && this.fireBreathCooldown <= 0 && this.fireBreathCharges > 0) {
          // Contar aventureros en rango de ataque de área
          const adventurersInRange = nearbyAdventurers.filter(t => t.distance <= this.fireBreathRange).length;
          
          if (adventurersInRange >= 2) {
            // Usar aliento de fuego si hay múltiples objetivos
            decision = { 
              action: "area_attack", 
              targets: nearbyAdventurers.filter(t => t.distance <= this.fireBreathRange).map(t => t.adventurer),
              reason: "fire_breath"
            };
          }
        } else if (this.health < this.maxHealth * 0.4 && !this.isFlying) {
          // En peligro, intentar alzar vuelo para evadir ataques
          decision = { 
            action: "defensive", 
            reason: "flight"
          };
        } else {
          // Priorizar el objetivo que más daño hace
          const highestDamageTarget = [...targets].sort((a, b) => 
            b.adventurer.damage - a.adventurer.damage)[0];
          decision = { 
            action: "attack", 
            target: highestDamageTarget.adventurer,
            reason: "eliminate_threat"
          };
        }
        break;
        
      case "Liche":
        if (this.summonChance > 0 && this.summonCooldown <= 0 && Math.random() < this.summonChance) {
          // Invocar sirviente
          decision = {
            action: "summon",
            reason: "reinforcement"
          };
        } else if (this.health < this.maxHealth * 0.5 && this.drainLifeChance > 0) {
          // Priorizar drenar vida si está herido
          decision = {
            action: "attack",
            target: targets[0].adventurer,
            reason: "life_drain"
          };
        }
        break;
        
      case "Behemot":
        // Verificar si es momento de terremoto
        if (this.earthquakeChance > 0 && this.earthquakeCooldown <= 0) {
          const adventurersInRange = nearbyAdventurers.filter(t => t.distance <= 2).length;
          if (adventurersInRange >= 2) {
            decision = {
              action: "area_attack",
              targets: nearbyAdventurers.filter(t => t.distance <= 2).map(t => t.adventurer),
              reason: "earthquake"
            };
          }
        }
        break;
    }
    
    // Guardar última táctica para contexto
    this.lastTactic = decision;
    
    return decision;
  }
  
  // Actualiza estados especiales como vuelo, frenesí, etc.
  updateSpecialStates() {
    // Actualizar duración de vuelo (Dragón)
    if (this.isFlying && this.flightDuration !== undefined) {
      this.flightDuration--;
      if (this.flightDuration <= 0) {
        this.isFlying = false;
      }
    }
    
    // Actualizar cooldowns
    if (this.fireBreathCooldown !== undefined && this.fireBreathCooldown > 0) {
      this.fireBreathCooldown--;
    }
    
    if (this.summonCooldown !== undefined && this.summonCooldown > 0) {
      this.summonCooldown--;
    }
    
    if (this.earthquakeCooldown !== undefined && this.earthquakeCooldown > 0) {
      this.earthquakeCooldown--;
    }
    
    // Actualizar estado de aturdimiento
    if (this.isStunned) {
      this.stunDuration--;
      if (this.stunDuration <= 0) {
        this.isStunned = false;
      }
    }
  }
  
  // Reduce el cooldown de ataque en cada turno
  updateCooldowns() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
    
    // Actualizar estados especiales
    this.updateSpecialStates();
  }
  
  // Calcula el coste de mejora
  getUpgradeCost() {
    return this.cost * this.level;
  }
  
  // Método para invocar un monstruo aliado (Liche)
  summonAlly() {
    if (this.name !== "Liche" || !this.summonChance || this.summonCooldown > 0) {
      return null;
    }
    
    // Crear un esqueleto básico
    const skeleton = {
      name: "Esqueleto",
      level: Math.max(1, this.level - 2), // Nivel menor que el liche
      health: 20 + (this.level * 3),
      maxHealth: 20 + (this.level * 3),
      damage: 5 + (this.level * 1),
      defense: 2 + Math.floor(this.level / 2),
      attackSpeed: 2,
      physicalResistance: 0.15,
      poisonImmunity: true
    };
    
    // Establecer cooldown
    this.summonCooldown = 4;
    
    return skeleton;
  }
  
  // Calcular valor del monstruo (para recompensas)
  getValue() {
    // Valor base según nivel y tipo
    let value = this.cost + (this.level * 10);
    
    // Bonus por habilidades especiales
    if (this.specialTrait) {
      value += 15;
    }
    
    if (this.areaAttack) {
      value += 20;
    }
    
    if (this.attackRange > 1) {
      value += 15;
    }
    
    // Multiplicador por nivel
    value = Math.floor(value * (1 + (this.level - 1) * 0.2));
    
    return value;
  }
  
  // Obtiene la información para mostrar
  getDisplayInfo() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      health: this.health,
      maxHealth: this.maxHealth,
      damage: this.damage,
      defense: this.defense,
      cost: this.cost,
      unlocked: this.unlocked,
      maxLevel: this.maxLevel,
      emoji: this.emoji,
      description: this.description,
      upgradeCost: this.getUpgradeCost(),
      specialAbility: this.getSpecialAbilityDescription()
    };
  }
  
  // Obtener descripción de habilidad especial para UI
  getSpecialAbilityDescription() {
    switch (this.specialTrait) {
      case "split":
        return "Puede dividirse al ser dañado";
      case "evasion":
        return `${Math.round(this.evasion * 100)}% probabilidad de evadir ataques`;
      case "undead":
        return "Inmune a veneno y efectos de control";
      case "poison":
        return `${Math.round(this.poisonChance * 100)}% probabilidad de envenenar`;
      case "berserk":
        return `Entra en frenesí con <${Math.round(this.berserkThreshold * 100)}% de vida`;
      case "stun":
        return `${Math.round(this.stunChance * 100)}% probabilidad de aturdir`;
      case "regeneration":
        return `Regenera ${this.regeneration} HP por turno`;
      case "burn":
        return `${Math.round(this.burnChance * 100)}% probabilidad de quemar`;
      case "fireBreath":
        return "Aliento de fuego que daña en área";
      case "summon":
        return "Puede invocar sirvientes no-muertos";
      case "areaAttack":
        return "Ataques que dañan a múltiples objetivos";
      default:
        return "Ataque estándar";
    }
  }
}
  
export default Monster;