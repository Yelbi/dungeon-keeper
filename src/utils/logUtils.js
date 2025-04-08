// src/utils/logUtils.js
import React from 'react';
import gameConfig from './gameConfig';

/**
 * Formatea mensajes de log con estilos específicos según palabras clave
 * @param {string} message - El mensaje a formatear
 * @param {Array} adventurers - Lista de aventureros para detectar sus nombres
 * @returns {React.ReactElement} Mensaje formateado con estilos
 */
export const formatLogMessage = (message, adventurers = []) => {
  if (!message) return null;
  
  // Definir categorías para agrupar palabras clave similares
  const keywordCategories = {
    victory: {
      pattern: /Victoria!|ganado|derrotado a|exitosamente|triunfo|superado/gi,
      className: 'victory-text'
    },
    defeat: {
      pattern: /Derrota!|muerto|ha sido derrotado|caído|falleció|eliminado/gi,
      className: 'defeat-text'
    },
    critical: {
      pattern: /crítico|golpe crítico|impacto devastador|ataque letal/gi,
      className: 'critical-text'
    },
    evasion: {
      pattern: /evade|evadido|esquiva|eludió|escapa|se defiende/gi,
      className: 'evasion-text'
    },
    status: {
      pattern: /envenenado|quemado|aturdido|ralentizado|atrapado|congelado|silenciado|debilitado/gi,
      className: 'status-effect-text'
    },
    healing: {
      pattern: /regenera|curado|cura|sana|recupera|restaura/gi,
      className: 'healing-text'
    }
  };
  
  // Crear un array con todos los patrones de categorías
  const categories = Object.values(keywordCategories);
  
  // Añadir nombres de aventureros
  const adventurerPatterns = adventurers.map(a => ({
    pattern: new RegExp(`\\b${escapeRegExp(a.name)}\\b`, 'g'),
    className: 'adventurer-name'
  }));
  
  // Añadir nombres de monstruos
  const monsterPatterns = gameConfig.monsters.map(monster => ({
    pattern: new RegExp(`\\b${escapeRegExp(monster.name)}\\b`, 'g'),
    className: 'monster-name'
  }));
  
  // Añadir nombres de trampas
  const trapPatterns = gameConfig.traps.map(trap => ({
    pattern: new RegExp(`\\b${escapeRegExp(trap.name)}\\b`, 'g'),
    className: 'trap-name'
  }));
  
  // Concatenar todos los patrones
  const allPatterns = [
    ...categories,
    ...adventurerPatterns,
    ...monsterPatterns,
    ...trapPatterns
  ];
  
  // Formatear el mensaje
  return formatWithPatterns(message, allPatterns);
};

/**
 * Filtra mensajes de log por categoría
 * @param {Array} logs - Array de mensajes del log
 * @param {string} category - Categoría a filtrar ('all', 'combat', 'trap', etc.)
 * @returns {Array} Mensajes filtrados
 */
export const filterLogMessages = (logs, category = 'all') => {
  if (category === 'all') return logs;
  
  const filters = {
    combat: /ataca|daño|golpe|crítico|contraataca|derrotado|evade|defiende/i,
    traps: /trampa|activa|veneno|quemadura|ralentizado|aturdido|atrapado/i,
    movement: /mueve|avanza|entra|llega|camina|posición/i,
    heal: /cura|regenera|restaura|recupera|sana/i
  };
  
  const pattern = filters[category];
  if (!pattern) return logs;
  
  return logs.filter(message => pattern.test(message));
};

/**
 * Categoriza un mensaje de log
 * @param {string} message - Mensaje del log
 * @returns {string} Categoría del mensaje
 */
export const categorizeLogMessage = (message) => {
  if (/ataca|daño|golpe|crítico|contraataca|derrotado/i.test(message)) {
    return 'combat';
  }
  if (/trampa|activa|veneno|quemadura|ralentizado|aturdido|atrapado/i.test(message)) {
    return 'traps';
  }
  if (/mueve|avanza|entra|llega|camina|posición/i.test(message)) {
    return 'movement';
  }
  if (/cura|regenera|restaura|recupera|sana/i.test(message)) {
    return 'heal';
  }
  if (/Victoria|Derrota|batalla ha comenzado|turno/i.test(message)) {
    return 'system';
  }
  
  return 'other';
};

/**
 * Extrae datos estructurados de un mensaje de log
 * @param {string} message - Mensaje del log
 * @returns {Object|null} Datos extraídos o null si no se pudo extraer
 */
export const extractLogData = (message) => {
  let data = {};
  
  // Extraer daño causado
  const damageMatch = message.match(/(\d+) puntos de daño/);
  if (damageMatch) {
    data.damage = parseInt(damageMatch[1], 10);
  }
  
  // Extraer nombres de entidades
  // Primero buscar nombres de aventureros (asumiendo nombre + clase entre paréntesis)
  const adventurerMatch = message.match(/([A-Za-zÀ-ÿ]+) \(([A-Za-zÀ-ÿ]+)\)/);
  if (adventurerMatch) {
    data.adventurer = {
      name: adventurerMatch[1],
      class: adventurerMatch[2]
    };
  }
  
  // Buscar nombres de monstruos
  for (const monster of gameConfig.monsters) {
    if (message.includes(monster.name)) {
      data.monster = { name: monster.name };
      break;
    }
  }
  
  // Buscar nombres de trampas
  for (const trap of gameConfig.traps) {
    if (message.includes(trap.name)) {
      data.trap = { name: trap.name };
      break;
    }
  }
  
  // Determinar tipo de evento
  if (message.includes('ha sido derrotado')) {
    data.eventType = 'defeat';
  } else if (message.includes('ataca')) {
    data.eventType = 'attack';
  } else if (message.includes('trampa') && message.includes('activa')) {
    data.eventType = 'trap';
  } else if (message.includes('mueve')) {
    data.eventType = 'movement';
  } else if (message.includes('cura') || message.includes('regenera')) {
    data.eventType = 'healing';
  }
  
  return Object.keys(data).length > 0 ? data : null;
};

/**
 * Genera un resumen de los mensajes de batalla
 * @param {Array} logs - Array de mensajes del log
 * @returns {Object} Resumen de acciones en la batalla
 */
export const generateBattleSummary = (logs) => {
  const summary = {
    totalTurns: 0,
    monstersDefeated: 0,
    adventurersDefeated: 0,
    damageDealt: 0,
    damageTaken: 0,
    trapsTriggered: 0,
    healing: 0
  };
  
  // Procesar los logs
  for (const message of logs) {
    // Contar turnos
    if (message.match(/--- Turno (\d+) ---/)) {
      summary.totalTurns++;
    }
    
    // Monstruos derrotados
    if (message.includes('ha sido derrotado') && 
        gameConfig.monsters.some(m => message.includes(m.name))) {
      summary.monstersDefeated++;
    }
    
    // Aventureros derrotados
    if (message.includes('ha sido derrotado') && !gameConfig.monsters.some(m => message.includes(m.name))) {
      summary.adventurersDefeated++;
    }
    
    // Extraer datos de daño
    const data = extractLogData(message);
    if (data) {
      // Daño causado por aventureros a monstruos
      if (data.eventType === 'attack' && data.adventurer && data.monster && data.damage) {
        summary.damageDealt += data.damage;
      }
      
      // Daño causado por monstruos a aventureros
      if (data.eventType === 'attack' && data.monster && data.adventurer && data.damage) {
        summary.damageTaken += data.damage;
      }
      
      // Trampas activadas
      if (data.eventType === 'trap') {
        summary.trapsTriggered++;
      }
      
      // Curación
      if (data.eventType === 'healing' && data.damage) {
        summary.healing += data.damage;
      }
    }
  }
  
  return summary;
};

// Funciones auxiliares

/**
 * Escapa caracteres especiales para expresiones regulares
 * @param {string} string - Cadena a escapar
 * @returns {string} Cadena escapada
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formatea un mensaje con los patrones especificados
 * @param {string} message - Mensaje a formatear
 * @param {Array} patterns - Patrones y clases CSS
 * @returns {React.ReactElement} Mensaje formateado
 */
function formatWithPatterns(message, patterns) {
  // Si no hay patrones, devolver el mensaje como está
  if (!patterns || patterns.length === 0) {
    return <span>{message}</span>;
  }
  
  // Fragmentar el mensaje en partes basadas en los patrones
  const segments = [];
  let remainingText = message;
  let lastIndex = 0;
  let key = 0;
  
  // Buscar todas las ocurrencias de los patrones
  const matches = [];
  
  for (const { pattern, className } of patterns) {
    let match;
    pattern.lastIndex = 0; // Reiniciar el índice
    
    while ((match = pattern.exec(message)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        className
      });
    }
  }
  
  // Ordenar las coincidencias por posición de inicio
  matches.sort((a, b) => a.start - b.start);
  
  // Manejar superposiciones priorizando las coincidencias más largas
  for (let i = 0; i < matches.length - 1; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    if (current.end > next.start) {
      // Hay superposición, mantener la coincidencia más larga
      if (current.text.length >= next.text.length) {
        // Eliminar la siguiente coincidencia
        matches.splice(i + 1, 1);
        i--; // Revisar este índice de nuevo con la siguiente coincidencia
      } else {
        // Eliminar la coincidencia actual
        matches.splice(i, 1);
        i--; // Revisar este índice de nuevo
      }
    }
  }
  
  // Construir segmentos con texto normal y estilizado
  let currentIndex = 0;
  
  for (const match of matches) {
    // Añadir texto desde el índice actual hasta el inicio de la coincidencia
    if (match.start > currentIndex) {
      segments.push(
        <span key={key++}>{message.substring(currentIndex, match.start)}</span>
      );
    }
    
    // Añadir el texto coincidente con estilo
    segments.push(
      <span className={match.className} key={key++}>{match.text}</span>
    );
    
    currentIndex = match.end;
  }
  
  // Añadir el texto restante después de la última coincidencia
  if (currentIndex < message.length) {
    segments.push(
      <span key={key++}>{message.substring(currentIndex)}</span>
    );
  }
  
  return <span>{segments}</span>;
}