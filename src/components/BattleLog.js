// src/components/BattleLog.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import '../styles/BattleLog.css';
import { formatLogMessage } from '../utils/logUtils'; // Nueva utilidad compartida

const BattleLog = ({ log, adventurers, day, bossHealth = 100, bossMaxHealth = 100 }) => {
  const logEndRef = useRef(null);
  const [activeTip, setActiveTip] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'combat', 'traps', 'movement'
  
  // Lista de consejos tácticos aleatorios
  const battleTips = [
    "Los aventureros atacarán a tus monstruos y sortearán las trampas según su clase. Los Magos son más efectivos contra monstruos, mientras que los Ladrones pueden evadir trampas más fácilmente.",
    "Las habitaciones proporcionan un 20% de daño adicional a los monstruos que coloques en ellas.",
    "Las salas proporcionan un 30% de daño adicional y un 10% de salud extra a los monstruos.",
    "Los aventureros siempre intentarán seguir el camino más corto hacia el jefe final.",
    "Las trampas son más efectivas cuando se colocan en serie, debilitando gradualmente a los aventureros.",
    "Algunos aventureros tienen habilidades especiales que se activan bajo ciertas condiciones durante la batalla.",
    "Coloca monstruos fuertes después de trampas para acabar con aventureros ya debilitados."
  ];

  // Filtrar el registro de batalla según el tipo seleccionado
  const filteredLog = useMemo(() => {
    if (filter === 'all') return log;
    
    return log.filter(entry => {
      const lowerEntry = entry.toLowerCase();
      
      switch (filter) {
        case 'combat':
          return lowerEntry.includes('ataca') || 
                 lowerEntry.includes('daño') || 
                 lowerEntry.includes('golpea') ||
                 lowerEntry.includes('crítico');
        case 'traps':
          return lowerEntry.includes('trampa') || 
                 lowerEntry.includes('activa');
        case 'movement':
          return lowerEntry.includes('mueve') || 
                 lowerEntry.includes('avanza') ||
                 lowerEntry.includes('entra');
        default:
          return true;
      }
    });
  }, [log, filter]);

  // Generar consejos tácticos basados en el estado actual
  const generateTacticalTip = () => {
    // Detectar tipo de aventureros vivos
    const hasWarriors = adventurers.some(a => !a.isDead && ['Guerrero', 'Caballero'].includes(a.class));
    const hasMages = adventurers.some(a => !a.isDead && ['Mago', 'Archimago'].includes(a.class));
    const hasThieves = adventurers.some(a => !a.isDead && ['Ladrón', 'Asesino'].includes(a.class));
    const hasPriests = adventurers.some(a => !a.isDead && ['Clérigo', 'Sacerdote'].includes(a.class));
    
    // Calcular promedio de vida de los aventureros vivos
    const aliveAdventurers = adventurers.filter(a => !a.isDead);
    const avgHealthPercent = aliveAdventurers.length > 0 
      ? aliveAdventurers.reduce((sum, a) => sum + (a.health / a.maxHealth), 0) / aliveAdventurers.length
      : 0;
    
    // Consejos específicos según composición y estado
    if (bossHealth < bossMaxHealth * 0.3) {
      return "¡El jefe final está gravemente herido! Usa habilidades especiales de tus monstruos para protegerlo.";
    } else if (avgHealthPercent < 0.4 && aliveAdventurers.length > 0) {
      return "Los aventureros están debilitados. ¡Es el momento perfecto para que tus monstruos ataquen!";
    } else if (hasWarriors && hasMages) {
      return "Los Guerreros absorben daño mientras los Magos causan daño desde atrás. Esta combinación es efectiva contra grupos de monstruos.";
    } else if (hasThieves) {
      return "Los Ladrones son expertos en desactivar trampas y tienen alta evasión. Son débiles contra monstruos con ataques de área.";
    } else if (hasPriests) {
      return "Los Clérigos y Sacerdotes pueden curar a sus aliados. Concéntrate en eliminarlos primero para evitar que prolonguen la batalla.";
    } else {
      return battleTips[activeTip]; // Usar el consejo aleatorio normal
    }
  };
  
  // Auto-scroll al final del log cuando se añaden nuevas entradas
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLog]);
  
  // Cambiar el consejo cada 15 segundos
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTip(prev => (prev + 1) % battleTips.length);
    }, 15000);
    
    return () => clearInterval(tipInterval);
  }, [battleTips.length]);
  
  // Calcular el nivel de peligro para el jefe
  const dangerLevel = useMemo(() => {
    const alive = adventurers.filter(a => !a.isDead);
    const bossHealthPercent = bossHealth / bossMaxHealth;
    
    if (alive.length === 0) return 'bajo';
    if (bossHealthPercent < 0.3) return 'extremo';
    if (bossHealthPercent < 0.5) return 'alto';
    if (alive.length > 3) return 'medio';
    return 'bajo';
  }, [adventurers, bossHealth, bossMaxHealth]);
  
  // Renderizar información de aventureros vivos
  const renderAdventurersInfo = () => {
    const alive = adventurers.filter(a => !a.isDead);
    const dead = adventurers.filter(a => a.isDead);
    
    return (
      <div className="adventurers-info">
        <h3>Estado de Aventureros</h3>
        <div className="adventurer-counts">
          <span className="alive-count">Vivos: {alive.length}</span>
          <span className="dead-count">Caídos: {dead.length}</span>
          <span className="total-count">Total: {adventurers.length}</span>
        </div>
        
        {/* Barra de vida del jefe con indicador de peligro */}
        <div className="boss-health">
          <div className="boss-health-header">
            <h4>Salud del Jefe Final:</h4>
            <span className={`danger-indicator danger-${dangerLevel}`} 
                  title={`Nivel de peligro: ${dangerLevel}`}>
              {dangerLevel === 'bajo' ? '🟢' : 
               dangerLevel === 'medio' ? '🟡' : 
               dangerLevel === 'alto' ? '🟠' : '🔴'}
            </span>
          </div>
          
          <div className="health-bar-container">
            <div 
              className={`health-bar ${bossHealth < bossMaxHealth * 0.3 ? 'health-critical' : 
                         bossHealth < bossMaxHealth * 0.6 ? 'health-warning' : ''}`}
              style={{ width: `${(bossHealth / bossMaxHealth) * 100}%` }}
            ></div>
            <span className="health-text">{bossHealth}/{bossMaxHealth}</span>
          </div>
        </div>
        
        {alive.length > 0 && (
          <div className="alive-adventurers">
            <h4>Aventureros activos:</h4>
            <ul>
              {alive.map(adventurer => (
                <li key={adventurer.id} className="adventurer-status">
                  <div className="adventurer-info">
                    <span className="adventurer-name">{adventurer.name}</span>
                    <span className="adventurer-class">({adventurer.class} Nv.{adventurer.level})</span>
                  </div>
                  <div className="health-bar-container">
                    <div 
                      className={`health-bar ${adventurer.health < adventurer.maxHealth * 0.3 ? 'health-critical' : 
                                 adventurer.health < adventurer.maxHealth * 0.6 ? 'health-warning' : ''}`}
                      style={{ width: `${(adventurer.health / adventurer.maxHealth) * 100}%` }}
                    ></div>
                    <span className="health-text">{adventurer.health}/{adventurer.maxHealth}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="battle-log-container">
      <div className="battle-header">
        <h2>Batalla en Progreso - Día {day}</h2>
      </div>
      
      {renderAdventurersInfo()}
      
      <div className="log-container">
        <div className="log-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
          >
            Todos
          </button>
          <button 
            className={`filter-btn ${filter === 'combat' ? 'active' : ''}`}
            onClick={() => setFilter('combat')}
            aria-pressed={filter === 'combat'}
          >
            Combate
          </button>
          <button 
            className={`filter-btn ${filter === 'traps' ? 'active' : ''}`}
            onClick={() => setFilter('traps')}
            aria-pressed={filter === 'traps'}
          >
            Trampas
          </button>
          <button 
            className={`filter-btn ${filter === 'movement' ? 'active' : ''}`}
            onClick={() => setFilter('movement')}
            aria-pressed={filter === 'movement'}
          >
            Movimiento
          </button>
        </div>
        
        <div className="battle-log" role="log" aria-live="polite">
          {filteredLog.length > 0 ? (
            <>
              {filteredLog.map((entry, index) => (
                <div 
                  key={index} 
                  className={`log-entry ${index === filteredLog.length - 1 ? 'new' : ''}`}
                >
                  {formatLogMessage(entry, adventurers)}
                </div>
              ))}
              <div ref={logEndRef} />
            </>
          ) : (
            <div className="empty-log">No hay mensajes que coincidan con el filtro seleccionado.</div>
          )}
        </div>
      </div>
      
      <div className="battle-tip">
        <h4>Consejo Táctico</h4>
        <p>{generateTacticalTip()}</p>
      </div>
    </div>
  );
};

export default BattleLog;