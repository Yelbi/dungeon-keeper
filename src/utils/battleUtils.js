// src/utils/battleUtils.js
import { categorizeLogMessage, extractLogData } from './logUtils';
import gameConfig from './gameConfig';

/**
 * Calcula estadísticas detalladas de una batalla a partir del log
 * @param {Array} battleLog - Registro de la batalla
 * @param {Array} adventurers - Lista de aventureros que participaron
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estadísticas detalladas
 */
export function calculateDetailedStats(battleLog, adventurers = [], options = {}) {
  // Estadísticas básicas
  const stats = {
    monstersKilled: 0,
    trapsTriggered: 0,
    criticalHits: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    healingPerformed: 0,
    totalTurns: 0,
    adventurersSurvived: 0,
    adventurersDied: 0,
    pathsTraveled: 0,
    efficiency: 0,
    
    // Estadísticas por clase
    classStats: {
      "Guerrero": { kills: 0, damage: 0, hits: 0, deaths: 0 },
      "Mago": { kills: 0, damage: 0, hits: 0, deaths: 0 },
      "Ladrón": { kills: 0, damage: 0, hits: 0, deaths: 0 },
      "Caballero": { kills: 0, damage: 0, hits: 0, deaths: 0 },
      "Clérigo": { kills: 0, damage: 0, hits: 0, deaths: 0 },
      "Sacerdote": { kills: 0, damage: 0, hits: 0, deaths: 0 },
      "Arquero": { kills: 0, damage: 0, hits: 0, deaths: 0 }
    },
    
    // Estadísticas por tipo de monstruo
    monsterStats: Object.fromEntries(
      gameConfig.monsters.map(monster => [
        monster.name, 
        { kills: 0, damage: 0, received: 0, deaths: 0 }
      ])
    ),
    
    // Estadísticas por tipo de trampa
    trapStats: Object.fromEntries(
      gameConfig.traps.map(trap => [
        trap.name, 
        { triggered: 0, damage: 0 }
      ])
    ),
    
    // Eventos especiales
    specialEvents: []
  };
  
  // Mapeo de aventureros por nombre para acceso rápido
  const adventurerMap = Object.fromEntries(
    (adventurers || []).map(adv => [adv.name, adv])
  );
  
  // Lista para rastrear aventureros derrotados
  const defeatedAdventurers = new Set();
  
  // Rastreo de turnos
  let currentTurn = 0;
  
  // Analizar cada entrada del log
  for (let i = 0; i < battleLog.length; i++) {
    const entry = battleLog[i];
    
    // Detectar cambio de turno
    const turnMatch = entry.match(/--- Turno (\d+) ---/);
    if (turnMatch) {
      currentTurn = parseInt(turnMatch[1], 10);
      stats.totalTurns = Math.max(stats.totalTurns, currentTurn);
      continue;
    }
    
    // Categorizar el mensaje
    const category = categorizeLogMessage(entry);
    
    // Extraer datos estructurados
    const logData = extractLogData(entry);
    
    // Procesar según el tipo de mensaje
    switch (category) {
      case 'combat':
        processCombatLog(entry, logData, stats, adventurerMap, defeatedAdventurers);
        break;
        
      case 'traps':
        processTrapLog(entry, logData, stats);
        break;
        
      case 'movement':
        stats.pathsTraveled++;
        break;
        
      case 'heal':
        processHealingLog(entry, logData, stats);
        break;
        
      case 'system':
        // Detectar eventos especiales
        if (entry.includes('Victoria') || entry.includes('Derrota')) {
          stats.specialEvents.push({
            type: entry.includes('Victoria') ? 'victory' : 'defeat',
            turn: currentTurn,
            message: entry
          });
        }
        break;
    }
  }
  
  // Calcular estadísticas de supervivencia
  if (adventurers && adventurers.length > 0) {
    stats.adventurersSurvived = adventurers.filter(a => !a.isDead).length;
    stats.adventurersDied = adventurers.length - stats.adventurersSurvived;
    
    // Actualizar estadísticas de muerte por clase
    adventurers.forEach(adv => {
      if (adv.isDead && stats.classStats[adv.class]) {
        stats.classStats[adv.class].deaths++;
      }
    });
  }
  
  // Calcular eficiencia
  if (stats.totalTurns > 0) {
    const optimalTurns = options.optimalTurns || 
                        Math.max(5, adventurers.length * 2); // Estimación por defecto
    stats.efficiency = Math.min(100, Math.floor((optimalTurns / stats.totalTurns) * 100));
  }
  
  return stats;
}

/**
 * Procesa una entrada de log relacionada con combate
 * @param {string} entry - Entrada del log
 * @param {Object} logData - Datos extraídos
 * @param {Object} stats - Estadísticas a actualizar
 * @param {Object} adventurerMap - Mapa de aventureros por nombre
 * @param {Set} defeatedAdventurers - Conjunto de aventureros derrotados
 */
function processCombatLog(entry, logData, stats, adventurerMap, defeatedAdventurers) {
  // Registrar golpe crítico
  if (entry.includes('CRÍTICO') || entry.includes('crítico')) {
    stats.criticalHits++;
  }
  
  // Registrar monstruo derrotado
  for (const monsterName of Object.keys(stats.monsterStats)) {
    if (entry.includes(`${monsterName} ha sido derrotado`)) {
      stats.monstersKilled++;
      stats.monsterStats[monsterName].deaths++;
      
      // Identificar quién lo derrotó
      const classMatch = entry.match(/(Guerrero|Mago|Ladrón|Caballero|Clérigo|Sacerdote|Arquero)/);
      if (classMatch) {
        const className = classMatch[1];
        if (stats.classStats[className]) {
          stats.classStats[className].kills++;
        }
      }
      
      break;
    }
  }
  
  // Registrar aventurero derrotado
  if (entry.includes('ha sido derrotado') && !Object.keys(stats.monsterStats).some(name => entry.includes(name))) {
    // Buscar nombre de aventurero
    const nameMatches = [];
    for (const advName of Object.keys(adventurerMap)) {
      if (entry.includes(advName)) {
        nameMatches.push(advName);
      }
    }
    
    // Usar el nombre más largo en caso de coincidencias parciales
    if (nameMatches.length > 0) {
      const adventurerName = nameMatches.reduce((a, b) => a.length > b.length ? a : b);
      
      // Solo contar si no estaba ya derrotado
      if (!defeatedAdventurers.has(adventurerName)) {
        defeatedAdventurers.add(adventurerName);
        const adventurer = adventurerMap[adventurerName];
        
        if (adventurer && adventurer.class && stats.classStats[adventurer.class]) {
          stats.classStats[adventurer.class].deaths++;
        }
      }
    }
  }
  
  // Procesar datos de daño
  if (logData && logData.damage) {
    // Daño de aventurero a monstruo
    if (logData.adventurer && logData.monster) {
      stats.totalDamageDealt += logData.damage;
      
      // Actualizar estadísticas de clase
      if (logData.adventurer.class && stats.classStats[logData.adventurer.class]) {
        stats.classStats[logData.adventurer.class].damage += logData.damage;
        stats.classStats[logData.adventurer.class].hits++;
      }
      
      // Actualizar estadísticas de monstruo
      if (stats.monsterStats[logData.monster.name]) {
        stats.monsterStats[logData.monster.name].received += logData.damage;
      }
    }
    
    // Daño de monstruo a aventurero
    if (logData.monster && logData.adventurer && !entry.includes('evade')) {
      stats.totalDamageTaken += logData.damage;
      
      // Actualizar estadísticas de monstruo
      if (stats.monsterStats[logData.monster.name]) {
        stats.monsterStats[logData.monster.name].damage += logData.damage;
      }
    }
  }
}

/**
 * Procesa una entrada de log relacionada con trampas
 * @param {string} entry - Entrada del log
 * @param {Object} logData - Datos extraídos
 * @param {Object} stats - Estadísticas a actualizar
 */
function processTrapLog(entry, logData, stats) {
  // Contar trampa activada
  if (entry.includes('trampa') && entry.includes('activa')) {
    stats.trapsTriggered++;
    
    // Identificar el tipo de trampa
    if (logData && logData.trap) {
      if (stats.trapStats[logData.trap.name]) {
        stats.trapStats[logData.trap.name].triggered++;
        
        // Actualizar daño si está disponible
        if (logData.damage) {
          stats.trapStats[logData.trap.name].damage += logData.damage;
        }
      }
    }
  }
  
  // Acumular daño de trampa
  if (logData && logData.trap && logData.damage) {
    stats.totalDamageTaken += logData.damage;
  }
}

/**
 * Procesa una entrada de log relacionada con curación
 * @param {string} entry - Entrada del log
 * @param {Object} logData - Datos extraídos
 * @param {Object} stats - Estadísticas a actualizar
 */
function processHealingLog(entry, logData, stats) {
  // Determinar cantidad de curación
  let healAmount = 0;
  
  if (logData && logData.damage) {
    healAmount = logData.damage;
  } else {
    // Intentar extraer cantidad si no está en logData
    const healMatch = entry.match(/(\d+) puntos/);
    if (healMatch) {
      healAmount = parseInt(healMatch[1], 10);
    }
  }
  
  if (healAmount > 0) {
    stats.healingPerformed += healAmount;
    
    // Actualizar estadísticas de clase si hay información de clase
    if (logData && logData.adventurer && logData.adventurer.class) {
      const className = logData.adventurer.class;
      if (stats.classStats[className]) {
        // Solo los clérigos y sacerdotes tienen estadísticas de curación
        if (className === "Clérigo" || className === "Sacerdote") {
          stats.classStats[className].healing = 
            (stats.classStats[className].healing || 0) + healAmount;
        }
      }
    }
  }
}

/**
 * Formatea los momentos destacados de la batalla
 * @param {Array} battleLog - Registro completo de la batalla
 * @param {number} limit - Límite máximo de momentos destacados
 * @returns {Array} Momentos destacados formateados
 */
export function formatBattleHighlights(battleLog, limit = 5) {
  // Funciones de puntuación para clasificar la importancia de eventos
  const eventScores = {
    'victory': 100,       // Eventos de victoria
    'defeat': 100,        // Eventos de derrota
    'monster_defeat': 80, // Monstruo derrotado
    'adventurer_defeat': 85, // Aventurero derrotado
    'critical': 70,       // Golpe crítico
    'boss': 90,           // Eventos relacionados con el jefe
    'trap': 50,           // Activación de trampa
    'evasion': 40,        // Evasión
    'healing': 30,        // Curación
    'damage_large': 60,   // Daño grande (más de 15)
    'normal': 10          // Eventos normales
  };
  
  // Analizar cada entrada y asignar puntuación
  const scoredEntries = battleLog.map(entry => {
    const data = extractLogData(entry);
    let score = 0;
    let type = 'normal';
    
    // Asignar puntuación según contenido
    if (entry.includes('Victoria') || entry.includes('éxito')) {
      score = eventScores.victory;
      type = 'victory';
    } else if (entry.includes('Derrota') || entry.includes('alcanzado al jefe')) {
      score = eventScores.defeat;
      type = 'defeat';
    } else if (entry.includes('ha sido derrotado')) {
      // Verificar si es monstruo o aventurero
      const isMonster = gameConfig.monsters.some(m => entry.includes(m.name));
      if (isMonster) {
        score = eventScores.monster_defeat;
        type = 'monster_defeat';
      } else {
        score = eventScores.adventurer_defeat;
        type = 'adventurer_defeat';
      }
    } else if (entry.includes('crítico') || entry.includes('CRÍTICO')) {
      score = eventScores.critical;
      type = 'critical';
    } else if (entry.includes('jefe')) {
      score = eventScores.boss;
      type = 'boss';
    } else if (entry.includes('trampa') && entry.includes('activa')) {
      score = eventScores.trap;
      type = 'trap';
    } else if (entry.includes('evade') || entry.includes('esquiva')) {
      score = eventScores.evasion;
      type = 'evasion';
    } else if (entry.includes('cura') || entry.includes('regenera')) {
      score = eventScores.healing;
      type = 'healing';
    } else if (data && data.damage && data.damage > 15) {
      score = eventScores.damage_large;
      type = 'damage_large';
    }
    
    // Aumentar puntuación si hay números grandes
    const damageMatch = entry.match(/(\d+) puntos de daño/);
    if (damageMatch && parseInt(damageMatch[1], 10) > 20) {
      score += 10; // Bonus por daño grande
    }
    
    // Aumentar puntuación si hay varias entidades mencionadas
    if (entry.includes(' y ')) {
      score += 5; // Bonus por interacción múltiple
    }
    
    // Aumentar puntuación si es una entrada larga y descriptiva
    if (entry.length > 80) {
      score += 5; // Bonus por descripción detallada
    }
    
    return {
      text: entry,
      score: score,
      type: type,
      data: data
    };
  });
  
  // Ordenar por puntuación y limitar
  const sortedEntries = scoredEntries
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return sortedEntries.map(entry => ({
    text: entry.text,
    type: entry.type,
    data: entry.data
  }));
}

/**
 * Calcula las recompensas basadas en el rendimiento de la batalla
 * @param {Object} stats - Estadísticas de la batalla
 * @param {Object} options - Opciones para el cálculo
 * @returns {Object} Recompensas calculadas
 */
export function calculateBattleRewards(stats, options = {}) {
  const {
    day = 1,
    difficulty = 'normal',
    adventurers = [],
    roomsUsed = false,
    hallsUsed = false
  } = options;
  
  // Obtener configuración de dificultad
  const diffConfig = gameConfig.difficulty[difficulty] || gameConfig.difficulty.normal;
  
  // Base de recompensas
  let goldReward = 0;
  let expReward = 0;
  
  // 1. Calcular recompensa base por cada aventurero
  for (const adv of adventurers) {
    // Factor de nivel
    const levelFactor = adv.level || 1;
    
    // Recompensa completa por derrotar
    if (adv.isDead) {
      goldReward += 10 * levelFactor * day;
      expReward += 8 * levelFactor * day;
    } 
    // Recompensa parcial por daño
    else {
      const healthLost = adv.maxHealth ? (adv.maxHealth - adv.health) / adv.maxHealth : 0;
      goldReward += 10 * levelFactor * day * healthLost * 0.8;
      expReward += 8 * levelFactor * day * healthLost * 0.8;
    }
  }
  
  // 2. Ajustar según estadísticas de la batalla
  
  // Bonus por eficiencia
  const efficiencyMultiplier = (stats.efficiency / 100) * 0.5 + 0.5; // 0.5 a 1.0
  goldReward *= efficiencyMultiplier;
  expReward *= efficiencyMultiplier;
  
  // Bonus por monstruos derrotados (penalización)
  const monsterLossMultiplier = Math.max(0.6, 1 - (stats.monstersKilled * 0.05));
  goldReward *= monsterLossMultiplier;
  
  // Bonus por trampas utilizadas
  const trapBonus = 1 + (stats.trapsTriggered * 0.03);
  goldReward *= trapBonus;
  expReward *= trapBonus;
  
  // 3. Ajustar por dificultad
  goldReward *= diffConfig.goldReward;
  expReward *= diffConfig.expReward;
  
  // 4. Aplicar bonificaciones por estructuras
  if (roomsUsed) {
    goldReward *= 1.1;
    expReward *= 1.05;
  }
  
  if (hallsUsed) {
    goldReward *= 1.15;
    expReward *= 1.1;
  }
  
  // 5. Ajustar según el día (progresión)
  const dayMultiplier = 1 + (day * 0.05);
  goldReward *= dayMultiplier;
  expReward *= dayMultiplier;
  
  // 6. Finalizar valores
  goldReward = Math.max(10, Math.floor(goldReward));
  expReward = Math.max(5, Math.floor(expReward));
  
  return {
    gold: goldReward,
    experience: expReward,
    efficiency: stats.efficiency,
    details: {
      baseGold: Math.floor(goldReward / dayMultiplier / (roomsUsed ? 1.1 : 1) / (hallsUsed ? 1.15 : 1) / diffConfig.goldReward),
      baseExp: Math.floor(expReward / dayMultiplier / (roomsUsed ? 1.05 : 1) / (hallsUsed ? 1.1 : 1) / diffConfig.expReward),
      efficiencyBonus: `${Math.floor((efficiencyMultiplier - 1) * 100)}%`,
      difficultyMultiplier: `${diffConfig.goldReward.toFixed(1)}x / ${diffConfig.expReward.toFixed(1)}x`,
      structureBonus: roomsUsed || hallsUsed ? `${roomsUsed ? "+10% oro, +5% exp" : ""}${hallsUsed ? (roomsUsed ? ", " : "") + "+15% oro, +10% exp" : ""}` : "Ninguno"
    }
  };
}

/**
 * Genera consejos tácticos basados en el análisis de la batalla
 * @param {Object} stats - Estadísticas de la batalla
 * @param {Array} adventurers - Lista de aventureros
 * @returns {Array} Lista de consejos tácticos
 */
export function generateTacticalTips(stats, adventurers = []) {
  const tips = [];
  
  // Analizar la composición de aventureros por clase
  const classCounts = {};
  for (const adv of adventurers) {
    classCounts[adv.class] = (classCounts[adv.class] || 0) + 1;
  }
  
  // 1. Consejos basados en la eficiencia
  if (stats.efficiency < 60) {
    tips.push({
      type: 'efficiency',
      text: 'Tu mazmorra podría ser más eficiente. Considera rutas más directas entre la entrada y el jefe para atrapar aventureros más rápido.'
    });
  }
  
  // 2. Consejos basados en monstruos y trampas
  if (stats.monstersKilled > 0 && stats.monstersKilled / adventurers.length > 0.3) {
    tips.push({
      type: 'defense',
      text: 'Estás perdiendo demasiados monstruos. Considera usar más trampas para debilitar aventureros antes de que lleguen a tus monstruos.'
    });
  }
  
  if (stats.trapsTriggered === 0) {
    tips.push({
      type: 'traps',
      text: 'No has usado trampas en esta batalla. Las trampas pueden debilitar aventureros antes de que enfrenten a tus monstruos.'
    });
  }
  
  // 3. Consejos basados en tipos específicos de aventureros
  if (classCounts['Ladrón'] > 0 || classCounts['Asesino'] > 0) {
    tips.push({
      type: 'counter',
      text: 'Los ladrones pueden desactivar trampas. Considera usar monstruos con ataques de área contra ellos.'
    });
  }
  
  if (classCounts['Clérigo'] > 0 || classCounts['Sacerdote'] > 0) {
    tips.push({
      type: 'counter',
      text: 'Los clérigos pueden curar a otros aventureros. Prioriza eliminarlos primero o usa efectos que les impidan curar.'
    });
  }
  
  if (classCounts['Mago'] > 0 || classCounts['Arquimago'] > 0) {
    tips.push({
      type: 'counter',
      text: 'Los magos hacen mucho daño a distancia. Usa trampas que los ralenticen y monstruos que se acerquen rápidamente a ellos.'
    });
  }
  
  // 4. Consejos generales de mejora
  if (stats.healingPerformed === 0) {
    tips.push({
      type: 'general',
      text: 'Usa monstruos con regeneración para mantenerlos vivos más tiempo durante las batallas.'
    });
  }
  
  if (!stats.roomsUsed && !stats.hallsUsed) {
    tips.push({
      type: 'structures',
      text: 'Construir habitaciones (2x2) y salas (3x3) proporciona bonificaciones a tus monstruos y ralentiza a los aventureros.'
    });
  }
  
  // Limitar a máximo 3 consejos y asegurar variedad
  const priorityOrder = ['counter', 'defense', 'traps', 'efficiency', 'structures', 'general'];
  
  // Ordenar por prioridad y limitar
  return tips
    .sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.type);
      const indexB = priorityOrder.indexOf(b.type);
      return indexA - indexB;
    })
    .slice(0, 3);
}

/**
 * Determina el tipo de un evento de batalla
 * @param {string} entry - Entrada del log
 * @returns {string} Tipo de evento
 */
export function getBattleEventType(entry) {
  if (entry.includes('Victoria') || entry.includes('derrotado por')) {
    return 'victory';
  } else if (entry.includes('Derrota') || entry.includes('alcanzado al jefe')) {
    return 'defeat';
  } else if (entry.includes('crítico') || entry.includes('CRÍTICO')) {
    return 'critical';
  } else if (entry.includes('trampa') && entry.includes('activa')) {
    return 'trap';
  } else if (entry.includes('evade') || entry.includes('evadido')) {
    return 'evasion';
  } else if (entry.includes('cura') || entry.includes('regenera')) {
    return 'healing';
  } else {
    return 'normal';
  }
}