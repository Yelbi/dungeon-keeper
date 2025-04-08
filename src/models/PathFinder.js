// src/models/PathFinder.js
class PathFinder {
  constructor(dungeon) {
    if (!dungeon || !Array.isArray(dungeon) || dungeon.length === 0) {
      throw new Error('PathFinder requires a valid dungeon array');
    }
    this.dungeon = dungeon;
    this.width = dungeon[0].length;
    this.height = dungeon.length;
  }
  
  // Encuentra el mejor camino usando el algoritmo A*
  findPath(start, end, adventurer = null) {
    // Crea las listas abiertas y cerradas
    const openList = [];
    const closedList = new Set();
    
    // Añade el nodo inicial a la lista abierta
    openList.push({
      x: start.x,
      y: start.y,
      g: 0, // Coste desde el inicio
      h: this.heuristic(start, end), // Estimación hasta el final
      f: this.heuristic(start, end), // Puntuación total
      parent: null // Nodo padre para reconstruir el camino
    });
    
    // Mientras la lista abierta no esté vacía
    while (openList.length > 0) {
      // Ordena la lista abierta por puntuación f (menor primero)
      openList.sort((a, b) => a.f - b.f);
      
      // Toma el nodo con menor puntuación f
      const current = openList.shift();
      
      // Si hemos llegado al destino, reconstruye el camino
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current);
      }
      
      // Añade el nodo actual a la lista cerrada
      closedList.add(`${current.x},${current.y}`);
      
      // Obtener vecinos
      const neighbors = this.getNeighbors(current, adventurer);
      
      // Procesar cada vecino
      for (const neighbor of neighbors) {
        // Si el vecino ya está en la lista cerrada, sáltalo
        if (closedList.has(`${neighbor.x},${neighbor.y}`)) {
          continue;
        }
        
        // Calcular el coste g desde el inicio hasta este vecino
        const gScore = current.g + this.getCost(current, neighbor, adventurer);
        
        // Busca si el vecino ya está en la lista abierta
        const existingNeighbor = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
        
        if (!existingNeighbor) {
          // Si no existe, añádelo
          openList.push({
            x: neighbor.x,
            y: neighbor.y,
            g: gScore,
            h: this.heuristic(neighbor, end),
            f: gScore + this.heuristic(neighbor, end),
            parent: current
          });
        } else if (gScore < existingNeighbor.g) {
          // Si existe y encontramos un camino mejor, actualízalo
          existingNeighbor.g = gScore;
          existingNeighbor.f = gScore + existingNeighbor.h;
          existingNeighbor.parent = current;
        }
      }
    }
    
    // No se encontró camino
    return null;
  }
  
  // Heurística: distancia Manhattan
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  
  // Obtiene los vecinos válidos de un nodo
  getNeighbors(node, adventurer) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // arriba
      { x: 0, y: 1 },  // abajo
      { x: -1, y: 0 }, // izquierda
      { x: 1, y: 0 }   // derecha
    ];
    
    for (const dir of directions) {
      const x = node.x + dir.x;
      const y = node.y + dir.y;
      
      // Verificar límites
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        continue;
      }
      
      // Verificar si es una celda válida
      const cell = this.dungeon[y][x];
      if (this.isValidCell(cell, adventurer)) {
        neighbors.push({ x, y });
      }
    }
    
    return neighbors;
  }
  
  // Verifica si una celda es transitable
  isValidCell(cell, adventurer) {
    // Si la celda es nula, no es válida
    if (!cell) {
      return false;
    }
    
    // Las celdas válidas son: camino, entrada, jugador, monstruo o trampa
    const validTypes = ["path", "entrance", "player", "monster", "trap"];
    
    if (!validTypes.includes(cell.type)) {
      return false;
    }
    
    // Si tenemos información del aventurero, podemos personalizar la lógica
    if (adventurer) {
      // Por ejemplo, los ladrones pueden preferir evitar trampas
      if (adventurer.class === "Ladrón" && cell.type === "trap") {
        // Aún es válido pero con preferencias diferentes
        return true;
      }
      
      // Los magos pueden preferir atacar monstruos
      if (adventurer.class === "Mago" && cell.type === "monster") {
        return true;
      }
    }
    
    return true;
  }
  
  // Calcula el coste de moverse a una celda
  getCost(current, neighbor, adventurer) {
    const cell = this.dungeon[neighbor.y][neighbor.x];
    
    // Coste base
    let cost = 1;
    
    // Ajustar el coste según el tipo de celda
    if (cell.type === "trap") {
      // Las trampas son peligrosas, mayor coste
      cost = 5;
      
      // A menos que sea un ladrón
      if (adventurer && adventurer.class === "Ladrón") {
        cost = 2; // Los ladrones pueden evadir trampas
      }
    }
    
    if (cell.type === "monster") {
      // Los monstruos son peligrosos, mayor coste
      cost = 8;
      
      // A menos que sea un mago o arquero
      if (adventurer && (adventurer.class === "Mago" || adventurer.class === "Arquero")) {
        cost = 3; // Los magos y arqueros prefieren atacar monstruos
      }
    }
    
    if (cell.type === "player") {
      // El jugador es el objetivo final, menor coste para incentivarlo
      cost = 0.5;
    }
    
    return cost;
  }
  
  // Reconstruye el camino desde el nodo final
  reconstructPath(node) {
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    
    return path;
  }
  
  // Encuentra el camino más corto desde una entrada a un jugador
  findPathFromEntranceToPlayer() {
    // Encontrar posiciones de entrada y jugador
    let entrance = null;
    let player = null;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.dungeon[y][x];
        if (cell) {
          if (cell.type === "entrance") {
            entrance = { x, y };
          } else if (cell.type === "player") {
            player = { x, y };
          }
        }
      }
    }
    
    // Si encontramos ambos, buscar camino
    if (entrance && player) {
      return this.findPath(entrance, player);
    }
    
    return null;
  }
  
  // Verifica si hay un camino válido de la entrada al jugador
  hasValidPath() {
    const path = this.findPathFromEntranceToPlayer();
    return path !== null && path.length > 0;
  }
}

export default PathFinder;