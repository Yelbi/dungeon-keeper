// src/utils/gameConfig.js
import Monster from '../models/Monster';
import Trap from '../models/Trap';

/**
 * Configuración global del juego
 * Contiene toda la información de balance, progresión y configuración
 */
const gameConfig = {
  // Metadatos del juego
  meta: {
    version: "1.0.0",
    title: "Dungeon Keeper",
    maxDays: 30, // Número máximo de días (victoria final)
    saveEnabled: true
  },

  // Configuración del tablero
  board: {
    width: 10,
    height: 10,
    entrancePosition: { x: 0, y: 0 },
    playerPosition: { x: 9, y: 9 },
    minPathLength: 5, // Longitud mínima del camino entre entrada y jefe
    maxStructures: {
      rooms: 5,  // Número máximo de habitaciones 2x2 permitidas
      halls: 3   // Número máximo de salas 3x3 permitidas
    }
  },
  
  // Configuración de dificultad
  difficulty: {
    easy: {
      adventurerScaling: 0.6,
      goldReward: 1.4,
      expReward: 1.4,
      monsterHealth: 1.2, // Los monstruos tienen más salud
      monsterDamage: 1.0, // Daño normal
      adventurerDamage: 0.8, // Aventureros hacen menos daño
      name: "Fácil",
      description: "Para jugadores nuevos. Más oro y experiencia, aventureros más débiles."
    },
    normal: {
      adventurerScaling: 0.8,
      goldReward: 1.2,
      expReward: 1.2,
      monsterHealth: 1.0,
      monsterDamage: 1.0,
      adventurerDamage: 1.0,
      name: "Normal",
      description: "Experiencia equilibrada para la mayoría de jugadores."
    },
    hard: {
      adventurerScaling: 1.2,
      goldReward: 0.8,
      expReward: 1.5,
      monsterHealth: 0.9, // Monstruos con menos salud
      monsterDamage: 0.9, // Monstruos hacen menos daño
      adventurerDamage: 1.2, // Aventureros hacen más daño
      name: "Difícil",
      description: "Para jugadores experimentados. Más aventureros y más fuertes."
    },
    nightmare: {
      adventurerScaling: 1.5,
      goldReward: 0.7,
      expReward: 2.0,
      monsterHealth: 0.8,
      monsterDamage: 0.8,
      adventurerDamage: 1.5,
      name: "Pesadilla",
      description: "¡El mayor desafío! Hordas de aventureros poderosos."
    }
  },
  
  // Valores iniciales para el jugador
  initialState: {
    gold: 150,
    experience: 0,
    day: 1,
    tutorial: true, // Mostrar tutorial en la primera partida
    upgrades: {
      monsterCapacity: 1, // Número inicial de monstruos activos permitidos
      trapCapacity: 2,    // Número inicial de trampas activas permitidas
      goldStorage: 500    // Límite inicial de oro
    }
  },
  
  // Costos de estructuras
  structures: {
    path: 0,        // Caminos son gratis
    room: 50,       // Habitación 2x2
    hall: 150,      // Sala 3x3
    // Bonificaciones
    roomBonus: {
      monsterDamage: 0.15,  // +15% daño para monstruos
      monsterDefense: 0.10  // +10% defensa para monstruos
    },
    hallBonus: {
      monsterDamage: 0.20,    // +20% daño para monstruos
      monsterHealth: 0.10,    // +10% salud para monstruos
      adventurerSpeed: -0.15  // -15% velocidad para aventureros
    }
  },
  
  // Progresión de nivel
  levelProgression: {
    // Experiencia requerida para subir de nivel
    expToLevel: (level) => 100 * Math.pow(1.5, level - 1),
    
    // Bonificaciones por nivel para monstruos y trampas
    monsterLevelBonus: {
      health: 0.25,    // +25% de salud por nivel
      damage: 0.30,    // +30% de daño por nivel
      defense: 0.20,   // +20% de defensa por nivel
      cooldown: -0.10  // -10% de tiempo de enfriamiento por nivel
    },
    trapLevelBonus: {
      damage: 0.35,      // +35% de daño por nivel
      uses: 1,           // +1 uso por nivel
      cooldown: -0.15,   // -15% de tiempo de recarga por nivel
      duration: 0.20     // +20% duración de efectos por nivel
    }
  },
  
  // Configuración de aventureros
  adventurers: {
    // Número base de aventureros según el día
    baseCount: (day) => {
      if (day === 1) return 1;                       // Solo 1 aventurero el primer día
      return Math.min(1 + Math.floor(day / 2), 10);  // Crecimiento más lento, máximo 10
    },
    
    // Distribución de niveles según el día
    levelDistribution: (day) => {
      if (day <= 3) return [{ level: 1, chance: 1.0 }];
      if (day <= 6) return [
        { level: 1, chance: 0.8 },
        { level: 2, chance: 0.2 }
      ];
      if (day <= 10) return [
        { level: 1, chance: 0.5 },
        { level: 2, chance: 0.4 },
        { level: 3, chance: 0.1 }
      ];
      if (day <= 15) return [
        { level: 1, chance: 0.3 },
        { level: 2, chance: 0.4 },
        { level: 3, chance: 0.2 },
        { level: 4, chance: 0.1 }
      ];
      return [
        { level: 1, chance: 0.2 },
        { level: 2, chance: 0.3 },
        { level: 3, chance: 0.3 },
        { level: 4, chance: 0.15 },
        { level: 5, chance: 0.05 }
      ];
    },
    
    // Clases de aventureros disponibles y sus probabilidades base
    classDistribution: {
      "Guerrero": 0.25,
      "Mago": 0.15,
      "Ladrón": 0.15,
      "Clérigo": 0.10,
      "Arquero": 0.20,
      "Caballero": 0.10, // Clase especial (rara)
      "Sacerdote": 0.05  // Clase especial (muy rara)
    },
    
    // Nombres posibles para aventureros (se eligen aleatoriamente)
    possibleNames: [
      "Aldric", "Elara", "Thorne", "Lyra", "Gareth", "Sora", "Varis", 
      "Mira", "Rowan", "Freya", "Quint", "Nyla", "Kael", "Tessa", 
      "Brom", "Zara", "Finn", "Orla", "Drake", "Nova"
    ]
  },
  
  // Catálogo de monstruos disponibles
  monsters: [
    {
      id: 1,
      name: "Goblin",
      health: 25,
      damage: 8,
      defense: 2,
      cost: 15,
      level: 1,
      maxLevel: 3,
      cooldown: 2,      // Turnos entre ataques
      attackRange: 1,   // Rango de ataque (1 = adyacente)
      specialTrait: "evasion", // Característica especial
      description: "Pequeño pero rápido. Tiene alta evasión.",
      unlocked: true,
      unlockDay: 1
    },
    {
      id: 2,
      name: "Orco",
      health: 40,
      damage: 10,
      defense: 4,
      cost: 50,
      level: 1,
      maxLevel: 3,
      cooldown: 2,
      attackRange: 1,
      specialTrait: "berserk", // Hace más daño cuando está herido
      description: "Fuerte y resistente. Entra en frenesí cuando está herido.",
      unlocked: false,
      unlockDay: 3
    },
    {
      id: 3,
      name: "Troll",
      health: 80,
      damage: 15,
      defense: 6,
      cost: 100,
      level: 1,
      maxLevel: 3,
      cooldown: 3,
      attackRange: 1,
      specialTrait: "regeneration", // Regenera salud cada turno
      description: "Enorme y regenerativo. Recupera salud cada turno.",
      unlocked: false,
      unlockDay: 6
    },
    {
      id: 4,
      name: "Esqueleto",
      health: 30,
      damage: 7,
      defense: 3,
      cost: 35,
      level: 1,
      maxLevel: 3,
      cooldown: 1,
      attackRange: 1,
      specialTrait: "undead", // Inmune a veneno y sangrado
      description: "No muerto resistente a venenos y efectos de sangrado.",
      unlocked: false,
      unlockDay: 2
    },
    {
      id: 5,
      name: "Araña Gigante",
      health: 25,
      damage: 8,
      defense: 2,
      cost: 40,
      level: 1,
      maxLevel: 3,
      cooldown: 2,
      attackRange: 1,
      specialTrait: "poison", // Envenena a los aventureros
      description: "Ágil y venenosa. Sus ataques pueden envenenar.",
      unlocked: false,
      unlockDay: 4
    },
    {
      id: 6,
      name: "Elemental de Fuego",
      health: 60,
      damage: 12,
      defense: 3,
      cost: 70,
      level: 1,
      maxLevel: 3,
      cooldown: 2,
      attackRange: 2, // Ataque a distancia
      specialTrait: "burn", // Quema a los aventureros
      description: "Criatura de fuego. Puede atacar a distancia y quemar.",
      unlocked: false,
      unlockDay: 8
    },
    {
      id: 7,
      name: "Dragón Joven",
      health: 120,
      damage: 20,
      defense: 8,
      cost: 150,
      level: 1,
      maxLevel: 3,
      cooldown: 3,
      attackRange: 2,
      specialTrait: "fireBreath", // Aliento de fuego (ataque en área)
      description: "Criatura legendaria. Puede usar aliento de fuego en área.",
      unlocked: false,
      unlockDay: 10
    },
    {
      id: 8,
      name: "Hechicero Oscuro",
      health: 45,
      damage: 15,
      defense: 2,
      cost: 85,
      level: 1,
      maxLevel: 3,
      cooldown: 2,
      attackRange: 3, // Gran alcance
      specialTrait: "debuff", // Debilita a los aventureros
      description: "Maestro de la magia negra. Debilita a los enemigos a distancia.",
      unlocked: false,
      unlockDay: 12
    }
  ],
  
  // Catálogo de trampas disponibles
  traps: [
    {
      id: 1,
      name: "Trampa de pinchos",
      damage: 15,
      cost: 10,
      uses: 3,        // Número de usos antes de desarmarse
      rearmTime: 2,   // Turnos para rearmarse
      level: 1,
      maxLevel: 3,
      type: "damage",  // Tipo de trampa
      effects: ["damage"], // Efectos que causa
      description: "Daño instantáneo al pasar. Barata pero efectiva.",
      unlocked: true,
      unlockDay: 1
    },
    {
      id: 2,
      name: "Foso",
      damage: 20,
      cost: 40,
      uses: 2,
      rearmTime: 4,
      level: 1,
      maxLevel: 3,
      type: "trap",
      effects: ["damage", "trapped"],
      trapDuration: 2, // Turnos que atrapa al aventurero
      description: "Atrapa aventureros por 2 turnos y causa daño.",
      unlocked: false,
      unlockDay: 2
    },
    {
      id: 3,
      name: "Trampa de fuego",
      damage: 30,
      cost: 75,
      uses: 1,
      rearmTime: 5,
      level: 1,
      maxLevel: 3,
      type: "area",
      effects: ["damage", "burn"],
      burnDuration: 2, // Turnos que quema al aventurero
      burnDamage: 8,   // Daño por turno de quemadura
      description: "Alto daño y quemaduras persistentes.",
      unlocked: false,
      unlockDay: 5
    },
    {
      id: 4,
      name: "Gas venenoso",
      damage: 15,
      cost: 45,
      uses: 2,
      rearmTime: 3,
      level: 1,
      maxLevel: 3,
      type: "poison",
      effects: ["damage", "poison"],
      poisonDuration: 3, // Turnos que envenena al aventurero
      poisonDamage: 5,   // Daño por turno de veneno
      description: "Libera gas tóxico que causa veneno por 3 turnos.",
      unlocked: false,
      unlockDay: 4
    },
    {
      id: 5,
      name: "Muro aplastante",
      damage: 40,
      cost: 90,
      uses: 1,
      rearmTime: 6,
      level: 1,
      maxLevel: 3,
      type: "heavy",
      effects: ["damage", "stun"],
      stunDuration: 1, // Turnos que aturde al aventurero
      description: "Gran daño y aturde por 1 turno. Un solo uso por batalla.",
      unlocked: false,
      unlockDay: 7
    },
    {
      id: 6,
      name: "Trampa de hielo",
      damage: 10,
      cost: 35,
      uses: 3,
      rearmTime: 2,
      level: 1,
      maxLevel: 3,
      type: "slow",
      effects: ["damage", "slow"],
      slowDuration: 2, // Turnos que ralentiza al aventurero
      description: "Ralentiza a los aventureros por 2 turnos.",
      unlocked: false,
      unlockDay: 3
    },
    {
      id: 7,
      name: "Trampa arcana",
      damage: 25,
      cost: 60,
      uses: 2,
      rearmTime: 4,
      level: 1,
      maxLevel: 3,
      type: "magic",
      effects: ["damage", "silence"],
      silenceDuration: 2, // Turnos que silencia al aventurero
      description: "Daño mágico y bloquea el uso de habilidades mágicas.",
      unlocked: false,
      unlockDay: 9
    }
  ],
  
  // Ajustes para salas y habitaciones
  rooms: {
    small: { // Habitación 2x2
      width: 2,
      height: 2,
      cost: 50,
      bonuses: {
        monsterDamage: 0.15, // +15% daño
        monsterDefense: 0.1  // +10% defensa
      }
    },
    large: { // Sala 3x3
      width: 3,
      height: 3,
      cost: 150,
      bonuses: {
        monsterDamage: 0.2,    // +20% daño
        monsterHealth: 0.1,    // +10% salud
        adventurerSpeed: -0.15 // -15% velocidad para aventureros
      }
    }
  },
  
  // Eventos especiales durante el juego
  events: {
    // Eventos aleatorios que pueden ocurrir (no implementados aún)
    types: [
      {
        id: "merchant",
        name: "Mercader",
        description: "Un mercader itinerante ofrece elementos especiales.",
        minDay: 5, // Día mínimo para aparecer
        chance: 0.1 // Probabilidad
      },
      {
        id: "hero_party",
        name: "Grupo de Héroes",
        description: "¡Un grupo de héroes legendarios ataca tu mazmorra!",
        minDay: 10,
        chance: 0.05
      },
      {
        id: "treasure",
        name: "Tesoro Antiguo",
        description: "Has encontrado un tesoro que atrae más aventureros.",
        minDay: 3,
        chance: 0.1
      }
    ]
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
        const isUnlocked = monsterConfig.unlocked || day >= monsterConfig.unlockDay;
        return new Monster({
          ...monsterConfig,
          unlocked: isUnlocked
        });
      });
    },
    
    // Crea instancias de trampas según el día actual
    createAvailableTraps: (day) => {
      return gameConfig.traps.map(trapConfig => {
        const isUnlocked = trapConfig.unlocked || day >= trapConfig.unlockDay;
        return new Trap({
          ...trapConfig,
          unlocked: isUnlocked
        });
      });
    },
    
    // Devuelve el color asociado a un nivel
    getLevelColor: (level) => {
      const colors = [
        'gray',    // No usado
        '#5cb85c', // Verde - Nivel 1
        '#5bc0de', // Azul - Nivel 2
        '#f0ad4e', // Naranja - Nivel 3
        '#d9534f', // Rojo - Nivel 4
        '#9b59b6'  // Púrpura - Nivel 5
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
    
    // Selecciona una clase de aventurero basada en las probabilidades
    selectAdventurerClass: () => {
      const classes = gameConfig.adventurers.classDistribution;
      const roll = Math.random();
      let cumulative = 0;
      
      for (const [className, chance] of Object.entries(classes)) {
        cumulative += chance;
        if (roll < cumulative) {
          return className;
        }
      }
      
      // Por defecto, devolver Guerrero
      return "Guerrero";
    }
  }
};

export default gameConfig;