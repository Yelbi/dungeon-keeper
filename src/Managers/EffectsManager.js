// src/managers/EffectsManager.js
class EffectsManager {
    constructor() {
      this.statusEffects = new Map();
    }
  
    // Procesa los efectos de estado al inicio del turno
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
    
    // Procesa efectos de estado para un aventurero
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
    
    // Procesa efectos de estado para monstruos
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
    
    // Aplica efectos del ataque de un aventurero a un monstruo
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
    
    // Aplica los efectos de la trampa al aventurero
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
    
    // Aplica los efectos del monstruo al aventurero
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
    
    // Aplica daño de área a monstruos cercanos
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
    
    // Aplica efectos de sala/habitación al monstruo
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
    
    // Verifica si una posición está en una sala o habitación especial
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
  }
  
  export default EffectsManager;