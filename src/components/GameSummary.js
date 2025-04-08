// src/components/GameSummary.js (versión corregida)
import React, { useState } from 'react';
import '../styles/GameSummary.css';

// Función auxiliar para calcular estadísticas detalladas
const calculateDetailedStats = (battleLog) => {
  const stats = {
    monstersKilled: battleLog.filter(entry => 
      entry.includes('ha sido derrotado') && !entry.includes('aventurero')
    ).length,
    
    trapsTriggered: battleLog.filter(entry => 
      entry.includes('trampa') && entry.includes('activa')
    ).length,
    
    criticalHits: battleLog.filter(entry => 
      entry.includes('CRÍTICO') || entry.includes('crítico')
    ).length,
    
    healingPerformed: battleLog.filter(entry => 
      entry.includes('cura') || entry.includes('regenera') || entry.includes('curado')
    ).length
  };
  
  return stats;
};

// Componente para mostrar estadísticas de batalla
const BattleStatistics = ({ stats, battleLog, monstersCount = 0, trapsCount = 0 }) => {
  // Extraer estadísticas detalladas
  const detailedStats = calculateDetailedStats(battleLog);
  
  return (
    <div className="battle-breakdown">
      <h3>Desglose de Batalla</h3>
      <div className="breakdown-grid">
        <div className="breakdown-item">
          <span className="breakdown-label">Monstruos efectivos:</span>
          <span className="breakdown-value">{detailedStats.monstersKilled}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Trampas activadas:</span>
          <span className="breakdown-value">{detailedStats.trapsTriggered}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Golpes críticos:</span>
          <span className="breakdown-value">{detailedStats.criticalHits}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Curaciones:</span>
          <span className="breakdown-value">{detailedStats.healingPerformed}</span>
        </div>
      </div>
    </div>
  );
};

const GameSummary = ({ 
  day, 
  gold,  // Oro ANTES de sumar la recompensa
  experience,  // Experiencia ANTES de sumar la recompensa
  nextDay, 
  adventurers, 
  battleLog,
  goldReward = 0,
  experienceReward = 0,  // La experiencia ganada en esta batalla
  roomsCount = 0,
  hallsCount = 0,
  monstersCount = 0,
  trapsCount = 0
}) => {
  const [showFullLog, setShowFullLog] = useState(false);
  
  // Calcular los totales correctamente
  const totalGold = gold + goldReward;
  const totalExperience = experience + experienceReward;
  
  // Formatear mensajes del log
  const formatLogMessage = (message) => {
    // Lógica básica de formateo
    let formattedMessage = message;
    
    // Palabras clave y clases para colorear
    const keywords = [
      { pattern: /Victoria!|ganado|derrotado a/gi, className: 'victory-text' },
      { pattern: /Derrota!|muerto|ha sido derrotado/gi, className: 'defeat-text' },
      { pattern: /crítico|golpe crítico/gi, className: 'critical-text' },
      { pattern: /evade|evadido/gi, className: 'evasion-text' },
      { pattern: /envenenado|quemado|aturdido|ralentizado|atrapado/gi, className: 'status-effect-text' },
      { pattern: /regenera|curado|cura/gi, className: 'healing-text' }
    ];
    
    // Aplicar formateo
    keywords.forEach(({ pattern, className }) => {
      formattedMessage = formattedMessage.replace(pattern, match => 
        `<span class="${className}">${match}</span>`
      );
    });
    
    return <span dangerouslySetInnerHTML={{ __html: formattedMessage }} />;
  };
  
  // Calcular estadísticas de la batalla
  const calculateStats = () => {
    const totalAdventurers = adventurers.length;
    const deadAdventurers = adventurers.filter(a => a.isDead).length;
    const aliveAdventurers = totalAdventurers - deadAdventurers;
    const successRate = totalAdventurers > 0 ? Math.round((deadAdventurers / totalAdventurers) * 100) : 0;
    
    return {
      totalAdventurers,
      deadAdventurers,
      aliveAdventurers,
      successRate,
      goldGained: goldReward,
      expGained: experienceReward
    };
  };
  
  const stats = calculateStats();
  
  // Generar consejos basados en el desempeño y configuración
  const generateTips = () => {
    const tips = [];
    
    if (stats.successRate < 50) {
      tips.push('Intenta colocar más monstruos y trampas en el camino principal.');
      tips.push('Mejora tus defensas existentes antes de comprar nuevas.');
    }
    
    if (stats.aliveAdventurers > 0) {
      tips.push('Considera crear caminos más largos para tener más oportunidades de detener a los aventureros.');
      tips.push('Las combinaciones de monstruos y trampas pueden ser más efectivas.');
    }
    
    // Consejos específicos según el día basados en gameConfig.js
    if (day < 3) {
      tips.push('En los primeros días, enfócate en establecer una buena estructura de mazmorra.');
      tips.push('El Goblin y la Trampa de pinchos son efectivos contra aventureros de nivel 1.');
    } else if (day < 6) {
      tips.push('A partir del día 3 se desbloquean los Orcos, muy efectivos en habitaciones.');
      tips.push('Considera invertir experiencia en mejorar tus monstruos de nivel bajo.');
    } else if (day < 9) {
      tips.push('A partir del día 6 aparecen los Trolls, ideales para salas grandes.');
      tips.push('La trampa de fuego causa daño extra si se combina con un Elemental de Fuego cercano.');
    } else {
      tips.push('Los aventureros de alto nivel requieren defensas combinadas y monstruos mejorados.');
      tips.push('El Dragón Joven es caro pero extremadamente efectivo contra grupos de aventureros.');
    }
    
    return tips.sort(() => 0.5 - Math.random()).slice(0, 3);
  };
  
  const tips = generateTips();
  
  return (
    <div className="game-summary">
      <div className="summary-header">
        <h2>Resumen del Día {day}</h2>
      </div>
      
      <div className="summary-content">
        <div className="battle-results">
          <h3>Resultados de la Batalla</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Aventureros enfrentados:</span>
              <span className="stat-value">{stats.totalAdventurers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Aventureros derrotados:</span>
              <span className="stat-value victory-text">{stats.deadAdventurers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Aventureros escapados:</span>
              <span className="stat-value defeat-text">{stats.aliveAdventurers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tasa de éxito:</span>
              <span className="stat-value">{stats.successRate}%</span>
            </div>
          </div>
        </div>
        
        {/* Componente de estadísticas de batalla */}
        <BattleStatistics 
          stats={stats}
          battleLog={battleLog}
          monstersCount={monstersCount}
          trapsCount={trapsCount}
        />
        
        <div className="rewards">
        <h3>Recompensas Obtenidas</h3>
        <div className="rewards-grid">
          <div className="reward-item">
            <span className="reward-icon">💰</span>
            <span className="reward-label">Oro ganado:</span>
            <span className="reward-value">{goldReward}</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">✨</span>
            <span className="reward-label">Experiencia ganada:</span>
            <span className="reward-value">{experienceReward}</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">💰</span>
            <span className="reward-label">Oro total:</span>
            <span className="reward-value">{totalGold}</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">✨</span>
            <span className="reward-label">Experiencia total:</span>
            <span className="reward-value">{totalExperience}</span>
          </div>
        </div>
      </div>
        
        <div className="battle-tips">
          <h3>Consejos para mejorar</h3>
          <ul className="tip-list">
            {tips.map((tip, index) => (
              <li key={index} className="tip-item">{tip}</li>
            ))}
          </ul>
        </div>
        
        <div className="battle-log-summary">
          <div className="log-header">
            <h3>Registro de Batalla</h3>
            <button className="toggle-log-btn" onClick={() => setShowFullLog(!showFullLog)}>
              {showFullLog ? 'Ver resumen' : 'Ver completo'}
            </button>
          </div>
          
          <div className="log-content">
            {showFullLog ? (
              // Mostrar log completo con formato
              <div className="full-log">
                {battleLog.map((entry, index) => (
                  <div key={index} className="log-entry">
                    {formatLogMessage(entry)}
                  </div>
                ))}
              </div>
            ) : (
              // Mostrar solo eventos importantes
              <div className="summary-log">
                {battleLog
                  .filter(entry => 
                    entry.includes('Victoria') || 
                    entry.includes('Derrota') || 
                    entry.includes('derrotado') || 
                    entry.includes('crítico') ||
                    entry.includes('alcanzado al jefe') ||
                    (entry.includes('trampa') && entry.includes('activa'))
                  )
                  .map((entry, index) => (
                    <div key={index} className="log-entry">
                      {formatLogMessage(entry)}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
        
        <div className="next-day-container">
          <h3>Preparándose para el Día {day + 1}</h3>
          <p>Los aventureros se fortalecen con cada día que pasa. Mejora tus defensas y prepárate para el próximo asalto.</p>
          <button className="next-day-btn" onClick={nextDay}>
            Continuar al Día {day + 1}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSummary;