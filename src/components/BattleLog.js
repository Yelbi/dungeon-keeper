import React, { useEffect, useRef, useState, useMemo } from 'react';
import '../styles/BattleLog.css';
import { formatLogMessage } from '../utils/logUtils';

const BattleLog = ({ log, adventurers, day, bossHealth = 100, bossMaxHealth = 100 }) => {
  const logEndRef = useRef(null);
  const [filter, setFilter] = useState('all');
  
  // Auto-scroll al final del log cuando se añaden nuevas entradas
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log]);
  
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
  
  return (
    <div className="battle-layout">
      <div className="battle-info-column">
        <div className="battle-header">
          <h2>Batalla en Progreso - Día {day}</h2>
        </div>
        
        <div className="battle-info">
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
          
          <div className="adventurers-count">
            <span className="alive">
              Vivos: {adventurers.filter(a => !a.isDead).length}
            </span>
            <span className="separator">/</span>
            <span className="total">
              {adventurers.length}
            </span>
          </div>
        </div>
        
        <div className="battle-speed-control">
          <button 
            className="speed-toggle-btn"
            onClick={() => {/* toggleBattleSpeed */}}
          >
            🐢 1x Velocidad
          </button>
        </div>
      </div>
      
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
    </div>
  );
};

export default BattleLog;