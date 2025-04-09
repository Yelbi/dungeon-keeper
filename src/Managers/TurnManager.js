// src/managers/TurnManager.js
class TurnManager {
    constructor(onBattleUpdate) {
      this.onBattleUpdate = onBattleUpdate;
      this.turnCounter = 0;
      this.simulationSpeed = 1;
      this.adventurerMoveDelay = 500;
      this.turnDelay = 1000;
      this.animationsEnabled = true;
    }
  
    // Actualiza los delays de animación según la velocidad
    updateDelays() {
      this.adventurerMoveDelay = 500 / this.simulationSpeed;
      this.turnDelay = 1000 / this.simulationSpeed;
    }
    
    // Cambia la velocidad de simulación
    setSimulationSpeed(speed) {
      if (typeof speed !== 'number' || speed <= 0) {
        console.error('Velocidad de simulación inválida:', speed);
        return;
      }
      
      this.simulationSpeed = speed;
      this.updateDelays();
      
      // Notificar cambio de velocidad
      this.onBattleUpdate({
        type: 'speedChange',
        speed: this.simulationSpeed
      });
    }
    
    // Bucle principal de batalla
    async battleLoop(battleState, processAdventurerTurns, processMonsterTurns, updateTraps, checkVictory, checkDefeat, getBattleResults) {
      while (battleState === 'inProgress') {
        try {
          this.turnCounter++;
          const battleLog = [`--- Turno ${this.turnCounter} ---`];
          
          // Procesar efectos de estado al inicio del turno
          this.processStatusEffects();
          
          // Mover aventureros y procesar combates
          await processAdventurerTurns();
          
          // Si la batalla terminó durante los turnos de aventureros, salir
          if (battleState !== 'inProgress') {
            break;
          }
          
          // Procesar acciones de monstruos
          await processMonsterTurns();
          
          // Actualizar trampas
          updateTraps();
          
          // Verificar fin de batalla
          if (checkVictory()) {
            battleState = 'victory';
            battleLog.push('¡Victoria! Has defendido tu mazmorra con éxito.');
            
            // Obtener resultados de batalla
            const results = getBattleResults();
            
            this.onBattleUpdate({
              type: 'victory',
              log: battleLog,
              results: results
            });
            break;
          }
          
          if (checkDefeat()) {
            battleState = 'defeat';
            battleLog.push('¡Derrota! Los aventureros han llegado al jefe final.');
            
            // Obtener resultados de batalla
            const results = getBattleResults();
            
            this.onBattleUpdate({
              type: 'defeat',
              log: battleLog,
              results: results
            });
            break;
          }
          
          // Notificar actualización
          this.onBattleUpdate({
            type: 'turnComplete',
            turn: this.turnCounter,
            log: battleLog
          });
          
          // Esperar entre turnos
          if (this.animationsEnabled) {
            await this.delay(this.turnDelay);
          }
        } catch (error) {
          console.error(`Error en turno ${this.turnCounter}:`, error);
          const battleLog = [`Error en turno ${this.turnCounter}: ${error.message || 'Desconocido'}`];
          
          // Notificar error pero continuar la batalla
          this.onBattleUpdate({
            type: 'error',
            turn: this.turnCounter,
            log: battleLog,
            error: error.message
          });
        }
      }
      
      // Devolver resultados de la batalla
      return {
        state: battleState,
        turns: this.turnCounter
      };
    }
    
    // Utilidad para crear retrasos (para animaciones)
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  export default TurnManager;