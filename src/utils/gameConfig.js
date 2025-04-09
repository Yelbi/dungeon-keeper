// src/utils/gameConfig.js
import Monster from '../models/Monster';
import Trap from '../models/Trap';

/**
 * Configuración global del juego - REBALANCEADA
 * Contiene toda la información de balance, progresión y configuración
 */
const gameConfig = {
  // Metadatos del juego
  meta: {
    version: "2.0.0",
    title: "Dungeon Keeper",
    maxDays: 40, // Número máximo de días (victoria final) - Extendido para alcanzar el contenido de nivel alto
    saveEnabled: true
  },

  // Configuración del tablero
  board: {
    width: 12, // Aumentado para más espacio estratégico
    height: 12,
    entrancePosition: { x: 0, y: 0 },
    playerPosition: { x: 11, y: 11 },
    minPathLength: 8, // Longitud mínima del camino entre entrada y jefe - Aumentado para mayor complejidad
    maxStructures: {
      rooms: 5,  // Número máximo de habitaciones 2x2 permitidas
      halls: 3   // Número máximo de salas 3x3 permitidas
    }
  },
  
  // Configuración de dificultad
  difficulty: {
    easy: {
      adventurerScaling: 0.6,
      goldReward: 1.5,
      expReward: 1.5,
      monsterHealth: 1.2, // Los monstruos tienen más salud
      monsterDamage: 1.1, // Más daño para balancear con menos aventureros
      adventurerDamage: 0.7, // Aventureros hacen menos daño
      name: "Fácil",
      description: "Para jugadores nuevos. Más oro y experiencia, aventureros más débiles."
    },
    normal: {
      adventurerScaling: 0.9,
      goldReward: 1.0,
      expReward: 1.0,
      monsterHealth: 1.0,
      monsterDamage: 1.0,
      adventurerDamage: 1.0,
      name: "Normal",
      description: "Experiencia equilibrada para la mayoría de jugadores."
    },
    hard: {
      adventurerScaling: 1.3,
      goldReward: 0.8,
      expReward: 1.3,
      monsterHealth: 0.9, // Monstruos con menos salud
      monsterDamage: 0.9, // Monstruos hacen menos daño
      adventurerDamage: 1.3, // Aventureros hacen más daño
      name: "Difícil",
      description: "Para jugadores experimentados. Más aventureros y más fuertes."
    },
    nightmare: {
      adventurerScaling: 1.6,
      goldReward: 0.6,
      expReward: 1.8,
      monsterHealth: 0.8,
      monsterDamage: 0.8,
      adventurerDamage: 1.6,
      name: "Pesadilla",
      description: "¡El mayor desafío! Hordas de aventureros poderosos."
    }
  },
  
  // Valores iniciales para el jugador
  initialState: {
    gold: 50, // Oro inicial reducido a 50
    experience: 0,
    day: 1,
    tutorial: true, // Mostrar tutorial en la primera partida
    upgrades: {
      monsterCapacity: 1, // Número inicial de monstruos activos permitidos
      trapCapacity: 2,    // Número inicial de trampas activas permitidas
      goldStorage: 300    // Límite inicial de oro reducido para incremento gradual
    }
  },
  
  // Costos de estructuras
  structures: {
    path: 0,        // Caminos son gratis
    room: 100,      // Habitación 2x2 (Aumentado)
    hall: 250,      // Sala 3x3 (Aumentado)
    // Bonificaciones
    roomBonus: {
      monsterDamage: 0.20,  // +20% daño para monstruos (Mejorado)
      monsterDefense: 0.15  // +15% defensa para monstruos (Mejorado)
    },
    hallBonus: {
      monsterDamage: 0.25,    // +25% daño para monstruos (Mejorado)
      monsterHealth: 0.15,    // +15% salud para monstruos (Mejorado)
      adventurerSpeed: -0.20  // -20% velocidad para aventureros (Mejorado)
    },
    // Desbloqueos de estructuras
    roomUnlockDay: 10,  // Día de desbloqueo para habitaciones
    hallUnlockDay: 20,  // Día de desbloqueo para salas
  },
  
  // Progresión de nivel
  levelProgression: {
    // Experiencia requerida para subir de nivel (curva más empinada)
    expToLevel: (level) => 100 * Math.pow(2, level - 1),
    
    // Bonificaciones por nivel para monstruos y trampas (escalado para 10 niveles)
    monsterLevelBonus: {
      health: 0.20,    // +20% de salud por nivel (reducido para balancear con más niveles)
      damage: 0.15,    // +15% de daño por nivel (reducido para balancear con más niveles)
      defense: 0.10,   // +10% de defensa por nivel (reducido)
      cooldown: -0.05  // -5% de tiempo de enfriamiento por nivel (reducido)
    },
    trapLevelBonus: {
      damage: 0.15,      // +15% de daño por nivel (reducido)
      uses: 0.5,          // +0.5 uso por nivel (escalado)
      cooldown: -0.08,   // -8% de tiempo de recarga por nivel (reducido)
      duration: 0.10     // +10% duración de efectos por nivel (reducido)
    },
    
    // Nuevo: Curva de mejora para aventureros por nivel
    adventurerLevelBonus: {
      health: 0.15,     // +15% de salud por nivel
      damage: 0.12,     // +12% de daño por nivel
      defense: 0.08,    // +8% de defensa por nivel
      evasion: 0.05,    // +5% de evasión por nivel (para algunas clases)
      healing: 0.10     // +10% de curación por nivel (para clérigos)
    },
    
    // Nuevo: Umbral para evolución de clase
    classEvolutionLevel: {
      firstToSecond: 5,  // Nivel 5 para evolucionar a 2da clase
      secondToThird: 8   // Nivel 8 para evolucionar a 3ra clase
    }
  },
  
  // Configuración de aventureros
  adventurers: {
    // Número base de aventureros según el día (crecimiento más gradual)
    baseCount: (day) => {
      if (day === 1) return 1; // Solo 1 aventurero el primer día
      if (day <= 5) return 1 + Math.floor((day - 1) / 2); // 1-2 aventureros en días iniciales
      if (day <= 15) return 2 + Math.floor((day - 5) / 3); // 2-5 aventureros en días medios
      return 5 + Math.floor((day - 15) / 5); // 5+ aventureros en días avanzados, máximo teórico 10
    },
    
    // Distribución de niveles según el día (escalado para sistema de 10 niveles)
    levelDistribution: (day) => {
      if (day <= 3) return [{ level: 1, chance: 1.0 }];
      if (day <= 6) return [
        { level: 1, chance: 0.7 },
        { level: 2, chance: 0.3 }
      ];
      if (day <= 10) return [
        { level: 1, chance: 0.5 },
        { level: 2, chance: 0.3 },
        { level: 3, chance: 0.2 }
      ];
      if (day <= 15) return [
        { level: 1, chance: 0.3 },
        { level: 2, chance: 0.3 },
        { level: 3, chance: 0.2 },
        { level: 4, chance: 0.15 },
        { level: 5, chance: 0.05 }
      ];
      if (day <= 20) return [
        { level: 2, chance: 0.2 },
        { level: 3, chance: 0.3 },
        { level: 4, chance: 0.2 },
        { level: 5, chance: 0.2 },
        { level: 6, chance: 0.1 }
      ];
      if (day <= 30) return [
        { level: 3, chance: 0.15 },
        { level: 4, chance: 0.2 },
        { level: 5, chance: 0.25 },
        { level: 6, chance: 0.2 },
        { level: 7, chance: 0.15 },
        { level: 8, chance: 0.05 }
      ];
      return [
        { level: 4, chance: 0.1 },
        { level: 5, chance: 0.2 },
        { level: 6, chance: 0.2 },
        { level: 7, chance: 0.2 },
        { level: 8, chance: 0.15 },
        { level: 9, chance: 0.1 },
        { level: 10, chance: 0.05 }
      ];
    },
    
    // Sistema de clases en 3 niveles con probabilidades
    classDistribution: {
      // Clases de 1ra generación
      "Guerrero": 0.25,
      "Mago": 0.20,
      "Ladrón": 0.20,
      "Clérigo": 0.15,
      "Arquero": 0.20,
      // Clases de 2da generación (se obtienen por evolución)
      "Caballero": 0.0, // Evolución de Guerrero
      "Archimago": 0.0, // Evolución de Mago
      "Asesino": 0.0,   // Evolución de Ladrón
      "Sacerdote": 0.0, // Evolución de Clérigo
      "Arquera Elemental": 0.0, // Evolución de Arquero
      // Clases de 3ra generación (se obtienen por evolución de 2da generación)
      "Paladín": 0.0,       // Evolución de Caballero
      "Mago Arcano": 0.0,   // Evolución de Archimago
      "Sombra": 0.0,        // Evolución de Asesino
      "Obispo": 0.0,        // Evolución de Sacerdote
      "Francotirador": 0.0  // Evolución de Arquera Elemental
    },
    
    // Árbol de evoluciones de clases
    classEvolutions: {
      "Guerrero": "Caballero",
      "Mago": "Archimago",
      "Ladrón": "Asesino",
      "Clérigo": "Sacerdote",
      "Arquero": "Arquera Elemental",
      "Caballero": "Paladín",
      "Archimago": "Mago Arcano",
      "Asesino": "Sombra",
      "Sacerdote": "Obispo",
      "Arquera Elemental": "Francotirador"
    },
    
    // Nombres posibles para aventureros (ampliado)
    possibleNames: [
      "Aldric", "Elara", "Thorne", "Lyra", "Gareth", "Sora", "Varis", 
      "Mira", "Rowan", "Freya", "Quint", "Nyla", "Kael", "Tessa", 
      "Brom", "Zara", "Finn", "Orla", "Drake", "Nova", "Tharos",
      "Aria", "Kade", "Serena", "Magnus", "Luna", "Cian", "Minerva",
      "Cedric", "Isolde", "Blake", "Ivy", "Corrin", "Silas", "Ezra",
      "Rhea", "Ash", "Fiona", "Griffin", "Wren", "Jasper", "Lena"
    ],
    
    // Nueva configuración base de estadísticas por clase
    classBaseStats: {
      // 1ra generación
      "Guerrero": {
        health: 35,
        damage: 8,
        defense: 4,
        critChance: 0.05,
        abilities: ["sturdy", "tactical"]
      },
      "Mago": {
        health: 25,
        damage: 10,
        defense: 2,
        critChance: 0.05,
        abilities: ["magicAttack", "elementalAffinity"]
      },
      "Ladrón": {
        health: 28,
        damage: 7,
        defense: 2,
        critChance: 0.15,
        evasion: 0.20,
        abilities: ["stealthy", "trapDisarm"]
      },
      "Clérigo": {
        health: 30,
        damage: 6,
        defense: 3,
        critChance: 0.05,
        abilities: ["healing", "holyPower"]
      },
      "Arquero": {
        health: 28,
        damage: 9,
        defense: 2,
        critChance: 0.10,
        abilities: ["ranged", "precise"]
      },
      
      // 2da generación
      "Caballero": {
        health: 50,
        damage: 12,
        defense: 8,
        critChance: 0.08,
        abilities: ["guard", "challengeShout", "shieldBash"]
      },
      "Archimago": {
        health: 35,
        damage: 16,
        defense: 3,
        critChance: 0.08,
        abilities: ["spellMastery", "elementalControl", "manaShield"]
      },
      "Asesino": {
        health: 40,
        damage: 14,
        defense: 3,
        critChance: 0.25,
        evasion: 0.30,
        abilities: ["shadowStep", "assassinate", "poisonBlade"]
      },
      "Sacerdote": {
        health: 45,
        damage: 10,
        defense: 5,
        critChance: 0.08,
        abilities: ["groupHeal", "divineProtection", "smite"]
      },
      "Arquera Elemental": {
        health: 38,
        damage: 15,
        defense: 3,
        critChance: 0.15,
        abilities: ["elementalArrow", "multishot", "quickReflexes"]
      },
      
      // 3ra generación
      "Paladín": {
        health: 70,
        damage: 18,
        defense: 12,
        critChance: 0.10,
        abilities: ["holyBarrier", "divineStrike", "inspire", "judgement"]
      },
      "Mago Arcano": {
        health: 45,
        damage: 25,
        defense: 5,
        critChance: 0.12,
        abilities: ["arcaneExplosion", "timeManipulation", "dimensionalRift", "spellChanneling"]
      },
      "Sombra": {
        health: 50,
        damage: 22,
        defense: 5,
        critChance: 0.35,
        evasion: 0.40,
        abilities: ["deathMark", "shadowClones", "blinkStrike", "vitalStrike"]
      },
      "Obispo": {
        health: 55,
        damage: 16,
        defense: 8,
        critChance: 0.10,
        abilities: ["resurrect", "holyLight", "massHealing", "divineJudgement"]
      },
      "Francotirador": {
        health: 48,
        damage: 24,
        defense: 4,
        critChance: 0.20,
        abilities: ["deadlyShot", "piercingArrow", "explosiveShot", "eagle"]
      }
    }
  },
  
  // Catálogo de monstruos disponibles - REBALANCEADO
  monsters: [
    {
      id: 1,
      name: "Slime",
      health: 20,
      damage: 5,
      defense: 1,
      cost: 8,
      level: 1,
      maxLevel: 10,
      cooldown: 2,
      attackRange: 1,
      specialTrait: "split", // Se divide al ser dañado
      emoji: "🟢",
      description: "Gelatinoso y básico. Puede dividirse al ser dañado.",
      unlocked: true,
      unlockDay: 1
    },
    {
      id: 2,
      name: "Goblin",
      health: 25,
      damage: 8,
      defense: 2,
      cost: 15,
      level: 1,
      maxLevel: 10,
      cooldown: 1,      // Más rápido
      attackRange: 1,
      specialTrait: "evasion", // Característica especial
      emoji: "👺",
      description: "Pequeño pero rápido. Tiene alta evasión.",
      unlocked: false,
      unlockDay: 3
    },
    {
      id: 3,
      name: "Esqueleto",
      health: 30,
      damage: 9,
      defense: 3,
      cost: 25,
      level: 1,
      maxLevel: 10,
      cooldown: 2,
      attackRange: 1,
      specialTrait: "undead", // Inmune a veneno y sangrado
      emoji: "💀",
      description: "No muerto resistente a venenos y efectos de sangrado.",
      unlocked: false,
      unlockDay: 5
    },
    {
      id: 4,
      name: "Araña Gigante",
      health: 28,
      damage: 10,
      defense: 2,
      cost: 35,
      level: 1,
      maxLevel: 10,
      cooldown: 2,
      attackRange: 1,
      specialTrait: "poison", // Envenena a los aventureros
      emoji: "🕷️",
      description: "Ágil y venenosa. Sus ataques pueden envenenar.",
      unlocked: false,
      unlockDay: 7
    },
    {
      id: 5,
      name: "Orco",
      health: 45,
      damage: 12,
      defense: 4,
      cost: 50,
      level: 1,
      maxLevel: 10,
      cooldown: 3,
      attackRange: 1,
      specialTrait: "berserk", // Hace más daño cuando está herido
      emoji: "👹",
      description: "Fuerte y resistente. Entra en frenesí cuando está herido.",
      unlocked: false,
      unlockDay: 9
    },
    {
      id: 6,
      name: "Golem de Piedra",
      health: 70,
      damage: 14,
      defense: 8,
      cost: 80,
      level: 1,
      maxLevel: 10,
      cooldown: 4,
      attackRange: 1,
      specialTrait: "stun", // Puede aturdir al enemigo
      emoji: "🗿",
      description: "Macizo y lento. Sus ataques pueden aturdir a los aventureros.",
      unlocked: false,
      unlockDay: 12
    },
    {
      id: 7,
      name: "Troll",
      health: 85,
      damage: 16,
      defense: 6,
      cost: 100,
      level: 1,
      maxLevel: 10,
      cooldown: 3,
      attackRange: 1,
      specialTrait: "regeneration", // Regenera salud cada turno
      emoji: "🧟",
      description: "Enorme y regenerativo. Recupera salud cada turno.",
      unlocked: false,
      unlockDay: 15
    },
    {
      id: 8,
      name: "Elemental de Fuego",
      health: 60,
      damage: 18,
      defense: 3,
      cost: 120,
      level: 1,
      maxLevel: 10,
      cooldown: 2,
      attackRange: 2, // Ataque a distancia
      specialTrait: "burn", // Quema a los aventureros
      emoji: "🔥",
      description: "Criatura de fuego. Puede atacar a distancia y quemar.",
      unlocked: false,
      unlockDay: 18
    },
    {
      id: 9,
      name: "Hechicero Oscuro",
      health: 55,
      damage: 20,
      defense: 4,
      cost: 150,
      level: 1,
      maxLevel: 10,
      cooldown: 3,
      attackRange: 3, // Gran alcance
      specialTrait: "debuff", // Debilita a los aventureros
      emoji: "🧙‍♂️",
      description: "Maestro de la magia negra. Debilita a los enemigos a distancia.",
      unlocked: false,
      unlockDay: 22
    },
    {
      id: 10,
      name: "Dragón Joven",
      health: 120,
      damage: 25,
      defense: 10,
      cost: 200,
      level: 1,
      maxLevel: 10,
      cooldown: 4,
      attackRange: 2,
      specialTrait: "fireBreath", // Aliento de fuego (ataque en área)
      emoji: "🐉",
      description: "Criatura legendaria. Puede usar aliento de fuego en área.",
      unlocked: false,
      unlockDay: 25
    },
    {
      id: 11,
      name: "Liche",
      health: 90,
      damage: 28,
      defense: 6,
      cost: 250,
      level: 1,
      maxLevel: 10,
      cooldown: 3,
      attackRange: 3,
      specialTrait: "summon", // Puede invocar esqueletos
      emoji: "⚰️",
      description: "Poderoso nigromante no-muerto. Puede invocar sirvientes.",
      unlocked: false,
      unlockDay: 28
    },
    {
      id: 12,
      name: "Behemot",
      health: 150,
      damage: 30,
      defense: 12,
      cost: 300,
      level: 1,
      maxLevel: 10,
      cooldown: 4,
      attackRange: 1,
      specialTrait: "areaAttack", // Daña a todos en área
      emoji: "👾",
      description: "Gigantesca bestia antigua. Sus ataques afectan a un área.",
      unlocked: false,
      unlockDay: 32
    }
  ],
  
  // Catálogo de trampas disponibles - REBALANCEADO
  traps: [
    {
      id: 1,
      name: "Trampa de pinchos",
      damage: 15,
      cost: 10,
      uses: 2,        // Número de usos antes de desarmarse
      rearmTime: 2,   // Turnos para rearmarse
      level: 1,
      maxLevel: 10,
      type: "damage",  // Tipo de trampa
      effects: ["damage"], // Efectos que causa
      emoji: "📌",
      description: "Daño instantáneo al pasar. Barata pero efectiva.",
      unlocked: true,
      unlockDay: 1
    },
    {
      id: 2,
      name: "Foso",
      damage: 20,
      cost: 25,
      uses: 1,
      rearmTime: 3,
      level: 1,
      maxLevel: 10,
      type: "trap",
      effects: ["damage", "trapped"],
      trapDuration: 2, // Turnos que atrapa al aventurero
      emoji: "🕳️",
      description: "Atrapa aventureros por 2 turnos y causa daño.",
      unlocked: false,
      unlockDay: 2
    },
    {
      id: 3,
      name: "Trampa de hielo",
      damage: 10,
      cost: 20,
      uses: 2,
      rearmTime: 2,
      level: 1,
      maxLevel: 10,
      type: "slow",
      effects: ["damage", "slow"],
      slowDuration: 2, // Turnos que ralentiza al aventurero
      emoji: "❄️",
      description: "Ralentiza a los aventureros por 2 turnos.",
      unlocked: false,
      unlockDay: 4
    },
    {
      id: 4,
      name: "Gas venenoso",
      damage: 8,
      cost: 30,
      uses: 3,
      rearmTime: 3,
      level: 1,
      maxLevel: 10,
      type: "poison",
      effects: ["damage", "poison"],
      poisonDuration: 3, // Turnos que envenena al aventurero
      poisonDamage: 5,   // Daño por turno de veneno
      emoji: "☠️",
      description: "Libera gas tóxico que causa veneno por 3 turnos.",
      unlocked: false,
      unlockDay: 6
    },
    {
      id: 5,
      name: "Trampa de fuego",
      damage: 25,
      cost: 40,
      uses: 2,
      rearmTime: 4,
      level: 1,
      maxLevel: 10,
      type: "area",
      effects: ["damage", "burn"],
      burnDuration: 2, // Turnos que quema al aventurero
      burnDamage: 8,   // Daño por turno de quemadura
      emoji: "🔥",
      description: "Alto daño y quemaduras persistentes.",
      unlocked: false,
      unlockDay: 8
    },
    {
      id: 6,
      name: "Muro aplastante",
      damage: 40,
      cost: 60,
      uses: 1,
      rearmTime: 5,
      level: 1,
      maxLevel: 10,
      type: "heavy",
      effects: ["damage", "stun"],
      stunDuration: 1, // Turnos que aturde al aventurero
      emoji: "🧱",
      description: "Gran daño y aturde por 1 turno. Un solo uso por batalla.",
      unlocked: false,
      unlockDay: 10
    },
    {
      id: 7,
      name: "Trampa arcana",
      damage: 20,
      cost: 50,
      uses: 2,
      rearmTime: 4,
      level: 1,
      maxLevel: 10,
      type: "magic",
      effects: ["damage", "silence"],
      silenceDuration: 2, // Turnos que silencia al aventurero
      emoji: "✨",
      description: "Daño mágico y bloquea el uso de habilidades mágicas.",
      unlocked: false,
      unlockDay: 12
    },
    {
      id: 8,
      name: "Drenaje de vida",
      damage: 30,
      cost: 80,
      uses: 1, 
      rearmTime: 6,
      level: 1,
      maxLevel: 10,
      type: "drain",
      effects: ["damage", "drain"],
      drainAmount: 0.5, // Porcentaje del daño que cura a monstruos cercanos
      emoji: "💔",
      description: "Drena vida de los aventureros y cura monstruos cercanos.",
      unlocked: false,
      unlockDay: 14
    },
    {
      id: 9,
      name: "Cárcel espiritual",
      damage: 15,
      cost: 100,
      uses: 1,
      rearmTime: 7,
      level: 1,
      maxLevel: 10,
      type: "spiritual",
      effects: ["damage", "imprison"],
      imprisonDuration: 3, // Turnos que atrapa al aventurero
      imprisonEffect: "disable", // Desactiva habilidades del aventurero
      emoji: "🌀",
      description: "Atrapa al aventurero en una prisión espiritual que desactiva sus habilidades.",
      unlocked: false,
      unlockDay: 16
    },
    {
      id: 10,
      name: "Explosión de runas",
      damage: 50,
      cost: 120,
      uses: 1,
      rearmTime: 8,
      level: 1,
      maxLevel: 10,
      type: "rune",
      effects: ["damage", "areaEffect"],
      areaRadius: 2, // Radio de efecto en celdas
      emoji: "💥",
      description: "Explosión masiva de runas arcanas que causa gran daño en área.",
      unlocked: false,
      unlockDay: 18
    }
  ],
  
  // Ajustes para salas y habitaciones
  rooms: {
    small: { // Habitación 2x2
      width: 2,
      height: 2,
      cost: 100,
      bonuses: {
        monsterDamage: 0.20, // +20% daño
        monsterDefense: 0.15  // +15% defensa
      }
    },
    large: { // Sala 3x3
      width: 3,
      height: 3,
      cost: 250,
      bonuses: {
        monsterDamage: 0.25,    // +25% daño
        monsterHealth: 0.15,    // +15% salud
        adventurerSpeed: -0.20  // -20% velocidad para aventureros
      }
    }
  },
  
  // Eventos especiales durante el juego
  events: {
    // Eventos aleatorios que pueden ocurrir
    types: [
      {
        id: "merchant",
        name: "Mercader",
        description: "Un mercader itinerante ofrece elementos especiales.",
        minDay: 5, // Día mínimo para aparecer
        chance: 0.15 // Probabilidad aumentada
      },
      {
        id: "hero_party",
        name: "Grupo de Héroes",
        description: "¡Un grupo de héroes legendarios ataca tu mazmorra!",
        minDay: 10,
        chance: 0.10
      },
      {
        id: "treasure",
        name: "Tesoro Antiguo",
        description: "Has encontrado un tesoro que atrae más aventureros.",
        minDay: 3,
        chance: 0.15
      },
      {
        id: "monster_revolt",
        name: "Revuelta de Monstruos",
        description: "Tus monstruos exigen mejores condiciones. ¡Págales o se rebelarán!",
        minDay: 8,
        chance: 0.10
      },
      {
        id: "trap_malfunction",
        name: "Mal Funcionamiento",
        description: "Algunas de tus trampas no funcionan correctamente y necesitan reparación.",
        minDay: 6,
        chance: 0.12
      },
      {
        id: "arcane_surge",
        name: "Oleada Arcana",
        description: "Una oleada de energía mágica potencia temporalmente todos tus monstruos.",
        minDay: 12,
        chance: 0.08
      }
    ]
  },
  
  // Recompensas diarias
  dailyRewards: {
    // Recompensas base que escalan con el día
    gold: (day) => 15 + (day * 5),
    experience: (day) => 10 + (day * 3),
    
    // Bonificaciones especiales por hitos
    milestones: [
      { day: 5, reward: { gold: 50, experience: 30, item: "random_trap" } },
      { day: 10, reward: { gold: 100, experience: 60, item: "random_monster" } },
      { day: 15, reward: { gold: 150, experience: 90, item: "rare_item" } },
      { day: 20, reward: { gold: 200, experience: 120, item: "epic_item" } },
      { day: 30, reward: { gold: 300, experience: 180, item: "legendary_item" } },
    ]
  },
  
  // Sistema de mejoras de mazmorra
  dungeonUpgrades: {
    goldStorage: {
      baseCost: 50,
      costScaling: 1.5,
      baseValue: 300,
      valueIncrease: 200,
      maxLevel: 5,
      description: "Aumenta la capacidad máxima de oro"
    },
    monsterCapacity: {
      baseCost: 100,
      costScaling: 2.0,
      baseValue: 1,
      valueIncrease: 1,
      maxLevel: 5,
      description: "Aumenta el número de monstruos que puedes tener activos"
    },
    trapCapacity: {
      baseCost: 80,
      costScaling: 1.8,
      baseValue: 2,
      valueIncrease: 2,
      maxLevel: 5,
      description: "Aumenta el número de trampas que puedes tener activas"
    },
    dungeonExpansion: {
      baseCost: 150,
      costScaling: 2.5,
      baseValue: 0,
      valueIncrease: 1,
      maxLevel: 3,
      description: "Expande el tamaño de tu mazmorra"
    },
    reinforcedWalls: {
      baseCost: 120,
      costScaling: 1.6,
      baseValue: 0,
      valueIncrease: 10, // % de reducción de daño a monstruos
      maxLevel: 5,
      description: "Refuerza tus defensas reduciendo el daño recibido"
    }
  },
  
  // Acciones permitidas durante las distintas fases
  allowedActions: {
    build: ["place", "upgrade", "delete", "examine"],
    battle: ["speed", "examine", "pause"],
    summary: ["continue", "examine", "save"]
  },
  
  // Funciones de utilidad
  utils: {
    // Crea instancias de monstruos según el día actual
    createAvailableMonsters: (day) => {
      return gameConfig.monsters.map(monsterConfig => {
        const isUnlocked = monsterConfig.unlockDay <= day;
        return new Monster({
          ...monsterConfig,
          unlocked: isUnlocked
        });
      });
    },
    
    // Crea instancias de trampas según el día actual
    createAvailableTraps: (day) => {
      return gameConfig.traps.map(trapConfig => {
        const isUnlocked = trapConfig.unlockDay <= day;
        return new Trap({
          ...trapConfig,
          unlocked: isUnlocked
        });
      });
    },
    
    // Devuelve el color asociado a un nivel
    getLevelColor: (level) => {
      const colors = [
        'gray',     // No usado
        '#5cb85c',  // Verde - Nivel 1
        '#8BC34A',  // Verde claro - Nivel 2
        '#5bc0de',  // Azul - Nivel 3
        '#2196F3',  // Azul medio - Nivel 4
        '#f0ad4e',  // Naranja - Nivel 5
        '#FF9800',  // Naranja medio - Nivel 6
        '#d9534f',  // Rojo - Nivel 7
        '#F44336',  // Rojo medio - Nivel 8
        '#9b59b6',  // Púrpura - Nivel 9
        '#673AB7'   // Púrpura intenso - Nivel 10
      ];
      
      return colors[Math.min(level, colors.length - 1)];
    },
    
    // Calcula el daño con modificadores de dificultad
    calculateDamage: (baseDamage, attackerType, difficulty) => {
      const diffSettings = gameConfig.difficulty[difficulty] || gameConfig.difficulty.normal;
      
      if (attackerType === 'monster') {
        return Math.round(baseDamage * diffSettings.monsterDamage);
      } else if (attackerType === 'adventurer') {
        return Math.round(baseDamage * diffSettings.adventurerDamage);
      }
      
      return baseDamage;
    },
    
    // Calcula la salud con modificadores de dificultad
    calculateHealth: (baseHealth, entityType, difficulty) => {
      const diffSettings = gameConfig.difficulty[difficulty] || gameConfig.difficulty.normal;
      
      if (entityType === 'monster') {
        return Math.round(baseHealth * diffSettings.monsterHealth);
      }
      
      return baseHealth;
    },
    
    // Genera un nombre aleatorio para aventureros
    generateAdventurerName: () => {
      const names = gameConfig.adventurers.possibleNames;
      return names[Math.floor(Math.random() * names.length)];
    },
    
    // Selecciona una clase de aventurero basada en las probabilidades y día
    selectAdventurerClass: (day) => {
      const classes = gameConfig.adventurers.classDistribution;
      // Filtrar solo clases de primera generación en días iniciales
      const availableClasses = {};
      
      // Días 1-15: Solo clases de 1ra generación
      if (day <= 15) {
        Object.entries(classes).forEach(([className, chance]) => {
          if (["Guerrero", "Mago", "Ladrón", "Clérigo", "Arquero"].includes(className)) {
            availableClasses[className] = chance;
          }
        });
      }
      // Días 16-25: Clases de 1ra y algunas de 2da generación
      else if (day <= 25) {
        Object.entries(classes).forEach(([className, chance]) => {
          if (["Guerrero", "Mago", "Ladrón", "Clérigo", "Arquero"].includes(className)) {
            availableClasses[className] = chance * 0.7; // Reducir probabilidad de 1ra gen
          } else if (["Caballero", "Archimago", "Asesino", "Sacerdote", "Arquera Elemental"].includes(className)) {
            availableClasses[className] = 0.06; // Pequeña probabilidad de 2da gen
          }
        });
      }
      // Días 26+: Todas las clases
      else {
        Object.entries(classes).forEach(([className, chance]) => {
          if (["Guerrero", "Mago", "Ladrón", "Clérigo", "Arquero"].includes(className)) {
            availableClasses[className] = chance * 0.5; // Reducir aún más probabilidad de 1ra gen
          } else if (["Caballero", "Archimago", "Asesino", "Sacerdote", "Arquera Elemental"].includes(className)) {
            availableClasses[className] = 0.08; // Aumentar probabilidad de 2da gen
          } else {
            availableClasses[className] = 0.04; // Pequeña probabilidad de 3ra gen
          }
        });
      }
      
      // Normalizar probabilidades
      const total = Object.values(availableClasses).reduce((sum, prob) => sum + prob, 0);
      Object.keys(availableClasses).forEach(className => {
        availableClasses[className] = availableClasses[className] / total;
      });
      
      // Selección por ruleta
      const roll = Math.random();
      let cumulative = 0;
      
      for (const [className, chance] of Object.entries(availableClasses)) {
        cumulative += chance;
        if (roll < cumulative) {
          return className;
        }
      }
      
      // Por defecto, devolver Guerrero
      return "Guerrero";
    },
    
    // Verifica si un aventurero puede evolucionar
    canEvolveClass: (adventurer) => {
      const { classEvolutionLevel, classEvolutions } = gameConfig;
      
      // Verificar si la clase puede evolucionar
      if (!classEvolutions[adventurer.class]) {
        return false;
      }
      
      // Verificar nivel para evolución
      if (adventurer.class in ["Guerrero", "Mago", "Ladrón", "Clérigo", "Arquero"] && 
          adventurer.level >= classEvolutionLevel.firstToSecond) {
        return true;
      }
      
      if (adventurer.class in ["Caballero", "Archimago", "Asesino", "Sacerdote", "Arquera Elemental"] && 
          adventurer.level >= classEvolutionLevel.secondToThird) {
        return true;
      }
      
      return false;
    },
    
    // Evoluciona la clase de un aventurero
    evolveAdventurerClass: (adventurer) => {
      const { classEvolutions, classBaseStats } = gameConfig;
      
      if (!classEvolutions[adventurer.class]) {
        return adventurer;
      }
      
      const newClass = classEvolutions[adventurer.class];
      const newStats = classBaseStats[newClass];
      
      // Mantener nivel y aplicar nuevas estadísticas base
      return {
        ...adventurer,
        class: newClass,
        maxHealth: newStats.health,
        health: newStats.health, // Restaurar completamente la salud
        damage: newStats.damage,
        defense: newStats.defense,
        critChance: newStats.critChance,
        evasion: newStats.evasion || adventurer.evasion || 0,
        abilities: newStats.abilities || [],
        isEvolved: true
      };
    },
    
    // Calcular probabilidad de evolución para aventureros dirigidos por IA
    calculateEvolutionChance: (day, adventurerLevel, classType) => {
      // Probabilidad base según el día
      let baseChance = Math.min(0.5, day * 0.02); // Máximo 50% en día 25+
      
      // Ajustar según el nivel del aventurero
      if (classType === 'first' && adventurerLevel >= 5) {
        baseChance *= 1.5; // Más probable evolucionar de 1ra a 2da
      } else if (classType === 'second' && adventurerLevel >= 8) {
        baseChance *= 0.8; // Menos probable evolucionar de 2da a 3ra
      }
      
      return Math.min(0.75, baseChance); // Máximo 75% de probabilidad
    }
  }
};

export default gameConfig;