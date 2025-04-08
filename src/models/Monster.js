// src/models/Monster.js
class Monster {
    constructor(config) {
      this.id = config.id;
      this.name = config.name;
      this.type = "monster";
      this.level = config.level || 1;
      this.maxLevel = config.maxLevel || 5;
      this.health = config.health || 20;
      this.maxHealth = this.health;
      this.damage = config.damage || 5;
      this.cost = config.cost || 20;
      this.unlocked = config.unlocked || false;
      this.position = config.position || { x: 0, y: 0 };
      this.isDead = false;
      this.cooldown = 0; // Turnos hasta poder atacar de nuevo
      
      // Propiedades especiales basadas en el tipo de monstruo
      this.applyMonsterSpecialties();
    }
    
    applyMonsterSpecialties() {
      switch (this.name) {
        case "Goblin":
          // Los goblins son rápidos pero débiles
          this.attackSpeed = 1; // Puede atacar cada turno
          this.criticalChance = 0.12; // 15% de crítico
          this.emoji = "👺";
          this.description = "Rápido y ágil. Ataca cada turno con probabilidad de crítico.";
          this.weakToHeavyAttacks = true;
          break;
          
        case "Orco":
          // Los orcos son fuertes pero lentos
          this.attackSpeed = 2; // Ataca cada 2 turnos
          this.stunChance = 0.15; // 20% de aturdir al enemigo
          this.armor = Math.floor(this.level * 1.2); // Reduce el daño recibido
          this.emoji = "👹";
          this.description = "Fuerte y resistente. Puede aturdir a los enemigos y tiene armadura.";
          break;
          
        case "Troll":
          // Los trolls tienen regeneración y son muy duros
          this.attackSpeed = 2; // Ataca cada 3 turnos
          this.regeneration = Math.floor(this.maxHealth * 0.04); // Regenera 5% de su vida por turno
          this.areaAttack = true; // Daña a todos los aventureros cercanos
          this.emoji = "🧟";
          this.description = "Enorme y regenerativo. Ataca a varios enemigos y recupera salud cada turno.";
          break;
          
        case "Esqueleto":
          // Los esqueletos tienen resistencia a ataques físicos
          this.attackSpeed = 2;
          this.physicalResistance = 0.25; // 30% menos de daño físico
          this.emoji = "💀";
          this.description = "No muerto y resistente. Recibe menos daño de ataques físicos.";
          this.magicWeakness = 0.15;
          break;
          
        case "Araña Gigante":
          // Las arañas pueden envenenar
          this.attackSpeed = 2;
          this.poisonChance = 0.25; // 25% de envenenar
          this.poisonDamage = Math.floor(this.damage * 0.4); // Daño de veneno
          this.emoji = "🕷️";
          this.description = "Venenosa y ágil. Puede envenenar a los enemigos causando daño continuo.";
          break;
          
        case "Elemental de Fuego":
          // Los elementales tienen inmunidad a ciertos daños
          this.attackSpeed = 2;
          this.fireImmunity = true;
          this.burnChance = 0.25; // 30% de quemar al enemigo
          this.burnDamage = Math.floor(this.damage * 0.3); // Daño de quemadura
          this.emoji = "🔥";
          this.description = "Ardiente e inmune al fuego. Puede quemar a los enemigos.";
          break;
          
        case "Dragón Joven":
          // Los dragones son muy poderosos pero caros
          this.attackSpeed = 3;
          this.fireBreath = true; // Ataque de aliento de fuego
          this.fireBreathDamage = this.damage * 1.8;
          this.fireBreathCooldown = 3; // Usa aliento cada 3 turnos
          this.armor = Math.floor(this.level * 1.5);
          this.emoji = "🐉";
          this.description = "Poderoso y majestuoso. Tiene aliento de fuego que daña a múltiples enemigos.";
          break;
          
        default:
          this.attackSpeed = 2;
          this.emoji = "👾";
          this.description = "Un monstruo común que protege la mazmorra.";
          break;
      }
    }
    
    // Actualiza propiedades cuando sube de nivel
    levelUp() {
      if (this.level >= this.maxLevel) {
        return false;
      }
      
      this.level += 1;
      
      // Mejora las estadísticas base
      this.health = Math.floor(this.health * 1.4);
      this.maxHealth = this.health;
      this.damage = Math.floor(this.damage * 1.25);
      
      // Actualiza propiedades especiales
      this.applyMonsterSpecialties();
      
      return true;
    }
    
    // Recibe daño y verifica si muere
    takeDamage(amount, attackType = "physical") {
      let actualDamage = amount;
      
      // Aplicar reducciones de daño
      if (attackType === "physical" && this.physicalResistance) {
        actualDamage = Math.floor(amount * (1 - this.physicalResistance));
      }
      
      if (attackType === "fire" && this.fireImmunity) {
        actualDamage = 0;
      }
      
      // Aplicar armadura si existe
      if (this.armor) {
        actualDamage = Math.max(1, actualDamage - this.armor);
      }
      
      this.health -= actualDamage;
      
      if (this.health <= 0) {
        this.health = 0;
        this.isDead = true;
      }
      
      return {
        damage: actualDamage,
        blocked: amount - actualDamage,
        currentHealth: this.health,
        isDead: this.isDead
      };
    }
    
    // Regenera salud si tiene esa habilidad
    regenerate() {
      if (!this.regeneration || this.isDead) return null;
      
      const amountToHeal = this.regeneration;
      this.health = Math.min(this.maxHealth, this.health + amountToHeal);
      
      return {
        regenerated: true,
        amount: amountToHeal,
        currentHealth: this.health
      };
    }
    
    // En el método attack
    attack(adventurer) {
      if (this.isDead || this.cooldown > 0) {
        return { success: false, cooldown: this.cooldown };
      }
      
      // Reinicia el cooldown
      this.cooldown = this.attackSpeed;
      
      // Analizar situación táctica
      let damageDealt = this.damage;
      let effects = [];
      let tacticMessage = "";
      
      // Aplicar buffs de habitación o sala (si existen)
      if (this.roomBonus) {
        if (this.roomBonus.type === 'room') {
          // Buff de habitación: +15% daño
          damageDealt = Math.floor(damageDealt * 1.15);
          tacticMessage = " aprovecha la habitación para potenciar su ataque";
          effects.push("room_buff");
        } else if (this.roomBonus.type === 'hall') {
          // Buff de sala: +20% daño
          damageDealt = Math.floor(damageDealt * 1.2);
          tacticMessage = " utiliza la amplitud de la sala a su favor";
          effects.push("hall_buff");
        }
      }
      
      // Monstruos inteligentes ajustan su estrategia según el oponente
      if (this.level >= 2) {
        // Contra magos, usar tácticas defensivas
        if (adventurer.class === "Mago") {
          if (this.armor) {
            tacticMessage = " adopta una postura defensiva";
            this.armor += 2; // Aumentar armadura temporalmente
          }
        }
        
        // Contra guerreros, intentar aturdir
        if (adventurer.class === "Guerrero" && this.stunChance) {
          this.stunChance += 0.1; // Aumentar probabilidad de aturdir
          tacticMessage = " concentra sus ataques en puntos débiles";
        }
        
        // Si el monstruo está muy herido, puede volverse más agresivo
        if (this.health < this.maxHealth * 0.3) {
          damageDealt = Math.floor(damageDealt * 1.5);
          tacticMessage = " ataca desesperadamente";
          effects.push("frenzy");
        }
      }
      
      // Probabilidad de crítico (solo para Goblins)
      if (this.criticalChance && Math.random() < this.criticalChance) {
        damageDealt = Math.floor(damageDealt * 2);
        effects.push("critical");
      }
      
      // Efectos adicionales según tipo de monstruo
      if (this.stunChance && Math.random() < this.stunChance) {
        effects.push("stun");
      }
      
      if (this.poisonChance && Math.random() < this.poisonChance) {
        effects.push("poison");
      }
      
      if (this.burnChance && Math.random() < this.burnChance) {
        effects.push("burn");
      }
      
      // Aliento de fuego (solo dragones)
      if (this.fireBreath && this.fireBreathCooldown <= 0) {
        damageDealt = this.fireBreathDamage;
        effects.push("fireBreath");
        this.fireBreathCooldown = 3;
      } else if (this.fireBreath) {
        this.fireBreathCooldown--;
      }
      
      return {
        success: true,
        damage: damageDealt,
        effects: effects,
        areaAttack: this.areaAttack || false,
        tacticMessage: tacticMessage
      };
    }
    
    // Nueva función para Monster.js - Método para tomar decisiones tácticas
    decideTactic(nearbyAdventurers, dungeon) {
      // Si no hay aventureros cerca, no hay decisión que tomar
      if (!nearbyAdventurers || nearbyAdventurers.length === 0) {
        return { action: "wait" };
      }
      
      // Posición actual del monstruo
      const myPosition = this.position;
      
      // Clasificación y priorización de amenazas
      const targets = nearbyAdventurers.map(target => {
        const adventurer = target.adventurer;
        let threatLevel = 0;
        
        // Evaluar nivel de amenaza
        threatLevel += adventurer.damage * 2; // Daño es importante
        
        // Priorizar objetivos débiles
        const healthPercentage = adventurer.health / adventurer.maxHealth;
        threatLevel += (1 - healthPercentage) * 50;
        
        // Clases específicas son más o menos amenazantes
        switch (adventurer.class) {
          case "Mago":
            threatLevel += 30; // Los magos hacen mucho daño
            if (this.physicalResistance) threatLevel += 20; // Mayor amenaza para no-muertos
            break;
          case "Guerrero":
            threatLevel += 20; // Buena combinación de daño y supervivencia
            break;
          case "Clérigo":
            threatLevel += 40; // Priorizar eliminar sanadores
            break;
          case "Ladrón":
            threatLevel += 15; // Pueden evadir pero hacen menos daño
            break;
          case "Arquero":
            threatLevel += 25; // Buen daño a distancia
            break;
        }
        
        // Historial previo con este aventurero
        if (this.damageReceived && this.damageReceived[adventurer.id]) {
          threatLevel += this.damageReceived[adventurer.id] * 0.5;
        }
        
        return {
          adventurer,
          distance: target.distance,
          threatLevel
        };
      });
      
      // Ordenar por nivel de amenaza (mayor primero)
      targets.sort((a, b) => b.threatLevel - a.threatLevel);
      
      // Decisión táctica basada en el tipo de monstruo y situación
      let decision = { action: "attack", target: targets[0].adventurer };
      
      // Comportamiento específico según tipo de monstruo
      switch (this.name) {
        case "Troll":
          // Si está gravemente herido, prefiere regenerarse
          if (this.health < this.maxHealth * 0.3) {
            decision = { action: "defensive", reason: "regenerate" };
          }
          break;
          
        case "Goblin":
          // Prefiere atacar objetivos ya heridos
          const weakTarget = targets.find(t => t.adventurer.health < t.adventurer.maxHealth * 0.5);
          if (weakTarget) {
            decision = { action: "attack", target: weakTarget.adventurer, reason: "opportunity" };
          }
          break;
          
        case "Elemental de Fuego":
          // Prefiere objetivos inflamables (arqueros, ladrones)
          const burningTarget = targets.find(t => 
            t.adventurer.class === "Arquero" || t.adventurer.class === "Ladrón");
          if (burningTarget) {
            decision = { action: "attack", target: burningTarget.adventurer, reason: "vulnerability" };
          }
          break;
          
        case "Dragón Joven":
          // Comportamiento más sofisticado - analiza el campo de batalla
          
          // Cuenta aventureros en rango de ataque de área
          const adventurersInRange = nearbyAdventurers.filter(t => t.distance <= 1).length;
          
          if (this.fireBreathCooldown <= 0 && adventurersInRange >= 2) {
            // Usar aliento de fuego si hay múltiples objetivos
            decision = { 
              action: "area_attack", 
              targets: nearbyAdventurers.filter(t => t.distance <= 1).map(t => t.adventurer),
              reason: "maximize_damage"
            };
          } else if (this.health < this.maxHealth * 0.4) {
            // En peligro, prioriza el objetivo que más daño hace
            const highestDamageTarget = [...targets].sort((a, b) => 
              b.adventurer.damage - a.adventurer.damage)[0];
            decision = { 
              action: "attack", 
              target: highestDamageTarget.adventurer,
              reason: "eliminate_threat"
            };
          }
          break;
      }
      
      return decision;
    }
    
    // Reduce el cooldown de ataque en cada turno
    updateCooldowns() {
      if (this.cooldown > 0) {
        this.cooldown--;
      }
      
      // Actualizar otros cooldowns si hay
      if (this.fireBreathCooldown > 0) {
        this.fireBreathCooldown--;
      }
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
        health: this.health,
        maxHealth: this.maxHealth,
        damage: this.damage,
        cost: this.cost,
        unlocked: this.unlocked,
        maxLevel: this.maxLevel,
        emoji: this.emoji,
        description: this.description,
        upgradeCost: this.getUpgradeCost()
      };
    }
  }
  
  export default Monster;