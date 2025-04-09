// src/managers/BuildManager.js
class BuildManager {
    constructor({
      setDungeon, 
      setMessage, 
      setGold, 
      setRooms, 
      setHalls
    }) {
      this.setDungeon = setDungeon;
      this.setMessage = setMessage;
      this.setGold = setGold;
      this.setRooms = setRooms;
      this.setHalls = setHalls;
    }
    
    // Método principal para colocar un elemento en la mazmorra
    placeItem = (x, y, selectedTool, selectedItem, dungeon, boardWidth, boardHeight, entrancePosition, playerPosition, gold, rooms, halls, roomCost, hallCost) => {
      // Validación de coordenadas
      if (x < 0 || y < 0 || x >= boardWidth || y >= boardHeight) {
        console.error("Coordenadas fuera de rango:", x, y);
        return;
      }
      
      // No permitir colocar en la entrada o en la posición del jugador
      if ((x === entrancePosition.x && y === entrancePosition.y) || 
          (x === playerPosition.x && y === playerPosition.y)) {
        this.setMessage('¡No puedes construir aquí!');
        return;
      }
      
      const newDungeon = [...dungeon];
      
      // Acción según la herramienta seleccionada
      switch (selectedTool) {
        case 'path':
          this.handlePathPlacement(x, y, newDungeon);
          break;
          
        case 'room':
          this.handleRoomPlacement(x, y, dungeon, boardWidth, boardHeight, entrancePosition, playerPosition, gold, rooms, roomCost);
          break;
          
        case 'hall':
          this.handleHallPlacement(x, y, dungeon, boardWidth, boardHeight, entrancePosition, playerPosition, gold, halls, hallCost);
          break;
          
        case 'monster':
          this.handleMonsterPlacement(x, y, newDungeon, selectedItem, gold);
          break;
          
        case 'trap':
          this.handleTrapPlacement(x, y, newDungeon, selectedItem, gold);
          break;
          
        case 'delete':
          this.handleItemDeletion(x, y, dungeon, entrancePosition, playerPosition, gold, rooms, halls);
          break;
          
        default:
          break;
      }
    };
  
    // Función para manejar la colocación de caminos
    handlePathPlacement = (x, y, newDungeon) => {
      // Verificar si la celda ya tiene contenido
      if (newDungeon[y][x] !== null) {
        this.setMessage('Esta celda ya está ocupada');
        return;
      }
      
      // Verificar si es adyacente a un camino existente
      const hasAdjacentPath = this.checkAdjacentPath(x, y, newDungeon);
      
      if (!hasAdjacentPath) {
        this.setMessage('¡Debes construir caminos conectados!');
        return;
      }
      
      // Colocar el camino
      newDungeon[y][x] = { type: 'path' };
      this.setDungeon(newDungeon);
      
      // Verificar si se forma un patrón de habitación o sala
      this.checkForRoomPattern(x, y, newDungeon);
    };
    
    // Método para colocación continua de caminos
    handleContinuousPathPlace = (x, y, dungeon, boardWidth, boardHeight, entrancePosition, playerPosition) => {
      // Validación de coordenadas
      if (x < 0 || y < 0 || x >= boardWidth || y >= boardHeight) {
        return; // Silenciosamente ignorar coordenadas fuera de rango
      }
      
      // Verificar posiciones inválidas
      if ((x === entrancePosition.x && y === entrancePosition.y) || 
          (x === playerPosition.x && y === playerPosition.y)) {
        return;
      }
      
      const newDungeon = [...dungeon];
      
      // Verificar si la celda ya tiene contenido
      if (newDungeon[y][x] !== null) {
        return;
      }
      
      // Verificar si es adyacente a un camino existente
      const hasAdjacentPath = this.checkAdjacentPath(x, y, newDungeon);
      
      if (!hasAdjacentPath) {
        return;
      }
      
      // Colocar el camino
      newDungeon[y][x] = { type: 'path' };
      this.setDungeon(newDungeon);
      
      // Verificar si se forma un patrón de habitación o sala
      this.checkForRoomPattern(x, y, newDungeon);
    };
  
    // Método para verificar patrones de habitación y sala
    checkForRoomPattern = (x, y, newDungeon) => {
      // Verificar patrón de habitación 2x2
      for (let startY = Math.max(0, y - 1); startY <= y; startY++) {
        for (let startX = Math.max(0, x - 1); startX <= x; startX++) {
          // Prevenir verificación fuera de límites
          if (startX + 2 > boardWidth || startY + 2 > boardHeight) continue;
          
          if (this.checkRoomPattern(startX, startY, 2, newDungeon)) {
            this.setMessage('¡Se ha formado un patrón de habitación 2x2! Usa la herramienta de Habitación para mejorarla.');
            return;
          }
        }
      }
      
      // Verificar patrón de sala 3x3
      for (let startY = Math.max(0, y - 2); startY <= y; startY++) {
        for (let startX = Math.max(0, x - 2); startX <= x; startX++) {
          // Prevenir verificación fuera de límites
          if (startX + 3 > boardWidth || startY + 3 > boardHeight) continue;
          
          if (this.checkRoomPattern(startX, startY, 3, newDungeon)) {
            this.setMessage('¡Se ha formado un patrón de sala 3x3! Usa la herramienta de Sala para mejorarla.');
            return;
          }
        }
      }
    };
  
    // Verificar si existe un patrón cuadrado de n×n
    checkRoomPattern = (startX, startY, size, dungeon) => {
      // Verificar límites
      if (startX + size > boardWidth || startY + size > boardHeight) {
        return false;
      }
      
      // Verificar que todas las celdas sean caminos
      for (let y = startY; y < startY + size; y++) {
        for (let x = startX; x < startX + size; x++) {
          // Verificar que la celda no sea la entrada o el jefe
          if ((x === entrancePosition.x && y === entrancePosition.y) || 
              (x === playerPosition.x && y === playerPosition.y)) {
            return false;
          }
          
          // Verificar que sea un camino
          if (!dungeon[y][x] || dungeon[y][x].type !== 'path') {
            return false;
          }
          
          // Verificar que no sea parte de una habitación o sala existente
          const isInRoom = rooms.some(room => 
            x >= room.x && x < room.x + 2 && 
            y >= room.y && y < room.y + 2
          );
          
          const isInHall = halls.some(hall => 
            x >= hall.x && x < hall.x + 3 && 
            y >= hall.y && y < hall.y + 3
          );
          
          if (isInRoom || isInHall) {
            return false;
          }
        }
      }
      
      return true;
    };
  
    // Método para colocar una habitación
    handleRoomPlacement = (x, y, dungeon, boardWidth, boardHeight, entrancePosition, playerPosition, gold, rooms, roomCost) => {
      // Verificar si hay suficiente oro
      if (gold < roomCost) {
        this.setMessage('¡No tienes suficiente oro para construir una habitación!');
        return;
      }
      
      // Verificar que haya espacio para una habitación 2x2
      if (x + 1 >= boardWidth || y + 1 >= boardHeight) {
        this.setMessage('No hay suficiente espacio para una habitación aquí.');
        return;
      }
      
      // Verificar que las celdas sean válidas
      const newDungeon = [...dungeon];
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const cell = newDungeon[y + dy][x + dx];
          
          // Debe ser un camino o estar vacío
          if (cell && cell.type !== 'path') {
            this.setMessage('Solo puedes construir habitaciones en caminos o espacios vacíos.');
            return;
          }
          
          // No puede ser posición del jugador o entrada
          if ((x + dx === playerPosition.x && y + dy === playerPosition.y) || 
              (x + dx === entrancePosition.x && y + dy === entrancePosition.y)) {
            this.setMessage('No puedes construir aquí.');
            return;
          }
        }
      }
      
      // Comprobar superposición con salas existentes
      const overlapsSalas = halls.some(hall => {
        const hallEndX = hall.x + 2;
        const hallEndY = hall.y + 2;
        const roomEndX = x + 1;
        const roomEndY = y + 1;
        
        return !(
          x > hallEndX || roomEndX < hall.x || 
          y > hallEndY || roomEndY < hall.y
        );
      });
      
      if (overlapsSalas) {
        this.setMessage('Esta habitación se solaparía con una sala existente.');
        return;
      }
      
      // Colocar la habitación
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          // Si no hay celda, crear un camino
          if (!newDungeon[y + dy][x + dx]) {
            newDungeon[y + dy][x + dx] = { type: 'path' };
          }
        }
      }
      
      // Registrar la habitación
      this.setRooms([...rooms, {x, y}]);
      
      // Descontar oro
      this.setGold(gold - roomCost);
      this.setMessage(`Has construido una habitación por ${roomCost} de oro.`);
      this.setDungeon(newDungeon);
    };
  
    // Método para colocar una sala
    handleHallPlacement = (x, y, dungeon, boardWidth, boardHeight, entrancePosition, playerPosition, gold, halls, hallCost) => {
      // Verificar si hay suficiente oro
      if (gold < hallCost) {
        this.setMessage('¡No tienes suficiente oro para construir una sala!');
        return;
      }
      
      // Verificar que haya espacio para una sala 3x3
      if (x + 2 >= boardWidth || y + 2 >= boardHeight) {
        this.setMessage('No hay suficiente espacio para una sala aquí.');
        return;
      }
      
      // Verificar que las celdas sean válidas
      const newDungeon = [...dungeon];
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const cell = newDungeon[y + dy][x + dx];
          
          // Debe ser un camino o estar vacío
          if (cell && cell.type !== 'path') {
            this.setMessage('Solo puedes construir salas en caminos o espacios vacíos.');
            return;
          }
          
          // No puede ser posición del jugador o entrada
          if ((x + dx === playerPosition.x && y + dy === playerPosition.y) || 
              (x + dx === entrancePosition.x && y + dy === entrancePosition.y)) {
            this.setMessage('No puedes construir aquí.');
            return;
          }
        }
      }
      
      // Colocar la sala
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          // Si no hay celda, crear un camino
          if (!newDungeon[y + dy][x + dx]) {
            newDungeon[y + dy][x + dx] = { type: 'path' };
          }
        }
      }
      
      // Registrar la sala
      this.setHalls([...halls, {x, y}]);
      
      // Descontar oro
      this.setGold(gold - hallCost);
      this.setMessage(`Has construido una sala por ${hallCost} de oro.`);
      this.setDungeon(newDungeon);
    };
  
    // Función nueva para manejar la colocación de monstruos
    handleMonsterPlacement = (x, y, newDungeon, selectedItem, gold) => {
      // Verificar si hay un monstruo seleccionado
      if (!selectedItem) {
        this.setMessage('Selecciona un monstruo primero');
        return;
      }
      
      // Solo colocar en caminos
      if (newDungeon[y][x]?.type !== 'path') {
        this.setMessage('¡Solo puedes colocar monstruos en los caminos!');
        return;
      }
      
      // Verificar si hay suficiente oro
      if (gold < selectedItem.cost) {
        this.setMessage('¡No tienes suficiente oro!');
        return;
      }
      
      // Crear una copia del monstruo seleccionado
      const monsterCopy = new Monster({
        ...selectedItem,
        position: { x, y }
      });
      
      // Colocar el monstruo
      newDungeon[y][x] = {
        type: 'monster',
        item: monsterCopy
      };
      
      // Restar el oro
      this.setGold(gold - selectedItem.cost);
      this.setDungeon(newDungeon);
    };
  
    // Colocar una trampa
    handleTrapPlacement = (x, y, newDungeon, selectedItem, gold) => {
      // Verificar si hay una trampa seleccionada
      if (!selectedItem) {
        this.setMessage('Selecciona una trampa primero');
        return;
      }
      
      // Solo colocar en caminos
      if (newDungeon[y][x]?.type !== 'path') {
        this.setMessage('¡Solo puedes colocar trampas en los caminos!');
        return;
      }
      
      // Verificar si hay suficiente oro
      if (gold < selectedItem.cost) {
        this.setMessage('¡No tienes suficiente oro!');
        return;
      }
      
      // Crear una copia de la trampa seleccionada
      const trapCopy = new Trap({
        ...selectedItem,
        position: { x, y }
      });
      
      // Colocar la trampa
      newDungeon[y][x] = {
        type: 'trap',
        item: trapCopy
      };
      
      // Restar el oro
      this.setGold(gold - selectedItem.cost);
      this.setDungeon(newDungeon);
    };
  
    // Eliminar un elemento
    handleItemDeletion = (x, y, dungeon, entrancePosition, playerPosition, gold, rooms, halls) => {
      // No permitir eliminar la entrada o el jugador
      if ((x === entrancePosition.x && y === entrancePosition.y) || 
          (x === playerPosition.x && y === playerPosition.y)) {
        this.setMessage('¡No puedes eliminar este elemento!');
        return;
      }
      
      const newDungeon = [...dungeon];
      const cell = newDungeon[y][x];
      
      // Si no hay nada que eliminar
      if (!cell) return;
      
      // Si es un monstruo o trampa dentro de una habitación/sala, solo elimina el elemento
      if (cell.type === 'monster' || cell.type === 'trap') {
        // Comprobar si está en una habitación o sala
        const isInRoom = rooms.some(room => 
          x >= room.x && x < room.x + 2 && 
          y >= room.y && y < room.y + 2
        );
        
        const isInHall = halls.some(hall => 
          x >= hall.x && x < hall.x + 3 && 
          y >= hall.y && y < hall.y + 3
        );
        
        // Devolver el 50% del coste
        const refund = Math.floor(cell.item.cost * 0.5);
        this.setGold(gold + refund);
        this.setMessage(`Has eliminado ${cell.type === 'monster' ? 'un monstruo' : 'una trampa'} y recuperado ${refund} de oro.`);
        
        // Mantener el camino con atributos de sala/habitación
        newDungeon[y][x] = { 
          type: 'path',
          // Mantener los atributos de habitación/sala si los tiene
          ...(isInRoom && { isRoom: true }),
          ...(isInHall && { isHall: true })
        };
        
        this.setDungeon(newDungeon);
        return;
      }
      
      // Para borrar una habitación o sala, exigir que se haga clic en una celda vacía
      // Verificar si pertenece a una habitación y es un camino (sin objetos)
      if (cell.type === 'path') {
        // Verificar habitaciones
        const roomIndex = rooms.findIndex(room => 
          x >= room.x && x < room.x + 2 && 
          y >= room.y && y < room.y + 2
        );
        
        if (roomIndex !== -1) {
          const room = rooms[roomIndex];
          
          // Verificar si hay monstruos o trampas en la habitación
          let hasObjects = false;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const cellContent = newDungeon[room.y + dy][room.x + dx];
              if (cellContent && (cellContent.type === 'monster' || cellContent.type === 'trap')) {
                hasObjects = true;
                break;
              }
            }
            if (hasObjects) break;
          }
          
          if (hasObjects) {
            this.setMessage('Elimina primero todos los monstruos y trampas de la habitación.');
            return;
          }
          
          // Pedir confirmación para borrar la habitación
          if (!window.confirm("¿Estás seguro de que quieres eliminar esta habitación?")) {
            return;
          }
          
          // Si no hay objetos, eliminar la habitación
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              if ((room.x + dx !== playerPosition.x || room.y + dy !== playerPosition.y) && 
                  (room.x + dx !== entrancePosition.x || room.y + dy !== entrancePosition.y)) {
                newDungeon[room.y + dy][room.x + dx] = { type: 'path' };
              }
            }
          }
          
          // Devolver parte del coste
          const refund = Math.floor(roomCost * 0.5);
          this.setGold(gold + refund);
          this.setMessage(`Has eliminado una habitación y recuperado ${refund} de oro.`);
          
          // Actualizar lista de habitaciones
          const newRooms = [...rooms];
        newRooms.splice(roomIndex, 1);
        this.setRooms(newRooms);
        
        this.setDungeon(newDungeon);
        return;
      }
      
      // Verificar salas
      const hallIndex = halls.findIndex(hall => 
        x >= hall.x && x < hall.x + 3 && 
        y >= hall.y && y < hall.y + 3
      );
      
      if (hallIndex !== -1) {
        const hall = halls[hallIndex];
        
        // Verificar si hay monstruos o trampas en la sala
        let hasObjects = false;
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            const cellContent = newDungeon[hall.y + dy][hall.x + dx];
            if (cellContent && (cellContent.type === 'monster' || cellContent.type === 'trap')) {
              hasObjects = true;
              break;
            }
          }
          if (hasObjects) break;
        }
        
        if (hasObjects) {
          this.setMessage('Elimina primero todos los monstruos y trampas de la sala.');
          return;
        }
        
        // Pedir confirmación para borrar la sala
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta sala?")) {
          return;
        }
        
        // Si no hay objetos, eliminar la sala
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            if ((hall.x + dx !== playerPosition.x || hall.y + dy !== playerPosition.y) && 
                (hall.x + dx !== entrancePosition.x || hall.y + dy !== entrancePosition.y)) {
              newDungeon[hall.y + dy][hall.x + dx] = { type: 'path' };
            }
          }
        }
        
        // Devolver parte del coste
        const refund = Math.floor(hallCost * 0.5);
        this.setGold(gold + refund);
        this.setMessage(`Has eliminado una sala y recuperado ${refund} de oro.`);
        
        // Actualizar lista de salas
        const newHalls = [...halls];
        newHalls.splice(hallIndex, 1);
        this.setHalls(newHalls);
        
        this.setDungeon(newDungeon);
        return;
      }
    }
    
    // Si llega aquí, es una celda normal que no es parte de habitación o sala
    // Eliminar el elemento (reemplazar con un camino si no es vacío)
    if (cell.type !== 'path') {
      newDungeon[y][x] = { type: 'path' };
    } else {
      newDungeon[y][x] = null;
    }
    
    this.setDungeon(newDungeon);
  };
  
  // Verificar si hay un camino adyacente
  checkAdjacentPath = (x, y, dungeon) => {
    // Comprobar las cuatro direcciones
    const directions = [
      { x: 0, y: -1 }, // arriba
      { x: 0, y: 1 },  // abajo
      { x: -1, y: 0 }, // izquierda
      { x: 1, y: 0 }   // derecha
    ];
    
    for (const dir of directions) {
      const newX = x + dir.x;
      const newY = y + dir.y;
      
      // Verificar límites
      if (newX < 0 || newY < 0 || newX >= dungeon[0].length || newY >= dungeon.length) continue;
      
      // Comprobar si hay un camino, entrada, jugador O MONSTRUO/TRAMPA
      const cell = dungeon[newY][newX];
      if (cell) {
        // Considerar monstruos y trampas como caminos válidos para la construcción
        if (cell.type === 'path' || cell.type === 'entrance' || cell.type === 'player' || 
            cell.type === 'monster' || cell.type === 'trap') {
          return true;
        }
      }
    }
    
    return false;
  };
}

export default BuildManager;