// src/components/GameSummary.js - Versión mejorada
import React, { useState, useEffect, useMemo } from 'react';
import '../styles/GameSummary.css';

// Componente para mostrar estadísticas detalladas de batalla
const BattleBreakdown = ({ stats, battleLog, monstersCount = 0, trapsCount = 0 }) => {
  // Extraer estadísticas detalladas
  const detailedStats = useMemo(() => {
    return {
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
      ).length,
      
      // Estadísticas de efectividad
      monsterEfficiency: monstersCount > 0 
        ? Math.round((stats.monstersKilled / monstersCount) * 100) 
        : 0,
      
      trapEfficiency: trapsCount > 0 
        ? Math.round((stats.trapsTriggered / trapsCount) * 100) 
        : 0
    };
  }, [battleLog, monstersCount, trapsCount, stats]);

  // Datos para la visualización de la efectividad
  const efficiencyData = [
    { type: 'Monstruos', value: detailedStats.monsterEfficiency, color: '#e74c3c' },
    { type: 'Trampas', value: detailedStats.trapEfficiency, color: '#f39c12' }
  ];

  return (
    <div className="battle-breakdown">
      <h3>Resultados de la Batalla</h3>
      <div className="breakdown-grid">
        <div className="breakdown-item">
          <div className="breakdown-icon">⚔️</div>
          <span className="breakdown-label">Monstruos efectivos:</span>
          <span className="breakdown-value">{detailedStats.monstersKilled}</span>
        </div>
        <div className="breakdown-item">
          <div className="breakdown-icon">⚡</div>
          <span className="breakdown-label">Trampas activadas:</span>
          <span className="breakdown-value">{detailedStats.trapsTriggered}</span>
        </div>
        <div className="breakdown-item">
          <div className="breakdown-icon">🎯</div>
          <span className="breakdown-label">Golpes críticos:</span>
          <span className="breakdown-value">{detailedStats.criticalHits}</span>
        </div>
        <div className="breakdown-item">
          <div className="breakdown-icon">💖</div>
          <span className="breakdown-label">Curaciones:</span>
          <span className="breakdown-value">{detailedStats.healingPerformed}</span>
        </div>
      </div>
      
      {/* Visualización de efectividad */}
      <div className="efficiency-visualization">
        <h4>Efectividad de Defensas</h4>
        <div className="efficiency-bars">
          {efficiencyData.map((item, index) => (
            <div className="efficiency-item" key={index}>
              <div className="efficiency-label">{item.type}</div>
              <div className="efficiency-bar-container">
                <div 
                  className="efficiency-bar" 
                  style={{ 
                    width: `${item.value}%`,
                    backgroundColor: item.color 
                  }}
                ></div>
                <span className="efficiency-value">{item.value}%</span>
              </div>
            </div>
          ))}
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
  adventurers = [], 
  battleLog = [],
  goldReward = 0,
  experienceReward = 0,  // La experiencia ganada en esta batalla
  roomsCount = 0,
  hallsCount = 0,
  monstersCount = 0,
  trapsCount = 0
}) => {
  const [showFullLog, setShowFullLog] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const [goldCounted, setGoldCounted] = useState(gold);
  const [expCounted, setExpCounted] = useState(experience);
  const [isGoldCounting, setIsGoldCounting] = useState(false);
  const [isExpCounting, setIsExpCounting] = useState(false);
  
  // Configurar las animaciones de entrada secuencial
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStage(1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Iniciar animación de conteo de oro
  useEffect(() => {
    if (animationStage >= 2 && !isGoldCounting) {
      setIsGoldCounting(true);
      const totalGold = gold + goldReward;
      const step = Math.ceil(goldReward / 50); // Divide la animación en ~50 pasos
      const interval = setInterval(() => {
        setGoldCounted(prev => {
          const next = prev + step;
          if (next >= totalGold) {
            clearInterval(interval);
            return totalGold;
          }
          return next;
        });
      }, 20);
      
      return () => clearInterval(interval);
    }
  }, [animationStage, gold, goldReward, isGoldCounting]);
  
  // Iniciar animación de conteo de experiencia
  useEffect(() => {
    if (animationStage >= 3 && !isExpCounting) {
      setIsExpCounting(true);
      const totalExp = experience + experienceReward;
      const step = Math.ceil(experienceReward / 50);
      const interval = setInterval(() => {
        setExpCounted(prev => {
          const next = prev + step;
          if (next >= totalExp) {
            clearInterval(interval);
            return totalExp;
          }
          return next;
        });
      }, 20);
      
      return () => clearInterval(interval);
    }
  }, [animationStage, experience, experienceReward, isExpCounting]);
  
  // Avanzar animaciones
  useEffect(() => {
    if (animationStage === 1) {
      const timer = setTimeout(() => setAnimationStage(2), 800);
      return () => clearTimeout(timer);
    }
    
    if (animationStage === 2 && goldCounted >= gold + goldReward) {
      const timer = setTimeout(() => setAnimationStage(3), 500);
      return () => clearTimeout(timer);
    }
    
    if (animationStage === 3 && expCounted >= experience + experienceReward) {
      const timer = setTimeout(() => setAnimationStage(4), 500);
      return () => clearTimeout(timer);
    }
  }, [animationStage, goldCounted, expCounted, gold, goldReward, experience, experienceReward]);
  
  // Calcular estadísticas de la batalla
  const stats = useMemo(() => {
    const totalAdventurers = adventurers.length;
    const deadAdventurers = adventurers.filter(a => a.isDead).length;
    const aliveAdventurers = totalAdventurers - deadAdventurers;
    const successRate = totalAdventurers > 0 ? Math.round((deadAdventurers / totalAdventurers) * 100) : 0;
    
    return {
      totalAdventurers,
      deadAdventurers,
      aliveAdventurers,
      successRate,
      monstersKilled: battleLog.filter(entry => 
        entry.includes('ha sido derrotado') && !entry.includes('aventurero')
      ).length,
      trapsTriggered: battleLog.filter(entry => 
        entry.includes('trampa') && entry.includes('activa')
      ).length
    };
  }, [adventurers, battleLog]);
  
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
  
  // Generar consejos basados en el desempeño y configuración
  const tips = useMemo(() => {
    const allTips = [
      {
        condition: () => stats.successRate < 60,
        text: "Intenta colocar más monstruos y trampas en el camino principal."
      },
      {
        condition: () => stats.aliveAdventurers > 0,
        text: "Considera crear caminos más largos para tener más oportunidades de detener a los aventureros."
      },
      {
        condition: () => roomsCount === 0,
        text: "Las habitaciones dan un 15% de bonus de daño a los monstruos que coloques en ellas."
      },
      {
        condition: () => hallsCount === 0,
        text: "Las salas dan un 20% de bonus de daño y 10% de salud extra a los monstruos, además de ralentizar a los aventureros."
      },
      {
        condition: () => stats.monstersKilled < stats.trapsTriggered,
        text: "Tus trampas son efectivas. Considera mejorarlas antes de comprar nuevas."
      },
      {
        condition: () => stats.monstersKilled > stats.trapsTriggered,
        text: "Tus monstruos son efectivos. Considera mejorarlos para aumentar su potencia."
      },
      {
        condition: () => true,
        text: "Combina trampas y monstruos para crear sinergias defensivas."
      },
      {
        condition: () => day < 5,
        text: "En los primeros días, enfócate en establecer una buena estructura de mazmorra."
      },
      {
        condition: () => day >= 5 && day < 10,
        text: "A medida que avanzan los días, los aventureros se vuelven más fuertes. Mejora tus defensas existentes."
      },
      {
        condition: () => day >= 10,
        text: "Los aventureros de alto nivel requieren defensas combinadas y monstruos mejorados."
      }
    ];
    
    return allTips
      .filter(tip => tip.condition())
      .map(tip => tip.text)
      .slice(0, 3); // Mostrar solo 3 consejos
  }, [stats, roomsCount, hallsCount, day]);

  // Obtener momentos destacados del log
  const highlightedLogs = useMemo(() => {
    return battleLog
      .filter(entry => 
        entry.includes('Victoria') || 
        entry.includes('Derrota') || 
        entry.includes('derrotado') || 
        entry.includes('crítico') ||
        entry.includes('alcanzado al jefe') ||
        (entry.includes('trampa') && entry.includes('activa'))
      )
      .slice(0, 6); // Mostrar máximo 6 entradas destacadas
  }, [battleLog]);
  
  // Determinar nivel de éxito para medalla
  const successLevel = useMemo(() => {
    if (stats.successRate >= 90) return "gold";
    if (stats.successRate >= 70) return "silver";
    if (stats.successRate >= 50) return "bronze";
    return "";
  }, [stats.successRate]);
  
  return (
    <div className="game-summary">
      <div className="summary-header">
        <h2>Resumen del Día {day}</h2>
        {successLevel && (
          <div className={`summary-medal ${successLevel}`}>
            {successLevel === "gold" && "🏆"}
            {successLevel === "silver" && "🥈"}
            {successLevel === "bronze" && "🥉"}
          </div>
        )}
      </div>
      
      <div className="summary-content">
        <div className={`battle-results summary-section ${animationStage >= 1 ? 'show' : ''}`}>
          <h3>Resultados de la Batalla</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-icon">👤</div>
              <span className="stat-label">Aventureros enfrentados:</span>
              <span className="stat-value">{stats.totalAdventurers}</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon">💀</div>
              <span className="stat-label">Aventureros derrotados:</span>
              <span className="stat-value victory-text">{stats.deadAdventurers}</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏃</div>
              <span className="stat-label">Aventureros escapados:</span>
              <span className="stat-value defeat-text">{stats.aliveAdventurers}</span>
            </div>
            <div className="stat-item highlight">
              <div className="stat-icon">📊</div>
              <span className="stat-label">Tasa de éxito:</span>
              <span className="stat-value">{stats.successRate}%</span>
              <div className="success-bar-container">
                <div 
                  className={`success-bar ${
                    stats.successRate >= 80 ? 'high' : 
                    stats.successRate >= 50 ? 'medium' : 'low'
                  }`}
                  style={{ width: `${stats.successRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Componente de estadísticas detalladas */}
        <div className={`summary-section ${animationStage >= 1 ? 'show delay-1' : ''}`}>
          <BattleBreakdown 
            stats={stats}
            battleLog={battleLog}
            monstersCount={monstersCount}
            trapsCount={trapsCount}
          />
        </div>
        
        <div className={`rewards summary-section ${animationStage >= 2 ? 'show' : ''}`}>
          <h3>Recompensas Obtenidas</h3>
          <div className="rewards-grid">
            <div className="reward-item">
              <div className="reward-icon gold">💰</div>
              <span className="reward-label">Oro ganado:</span>
              <span className="reward-value">{goldReward}</span>
              <div className="reward-progress">
                <div className="reward-progress-bar" style={{ width: `${((goldCounted - gold) / goldReward) * 100}%` }}></div>
              </div>
            </div>
            <div className="reward-item">
              <div className="reward-icon exp">✨</div>
              <span className="reward-label">Experiencia ganada:</span>
              <span className="reward-value">{experienceReward}</span>
              <div className="reward-progress">
                <div className="reward-progress-bar" style={{ width: `${((expCounted - experience) / experienceReward) * 100}%` }}></div>
              </div>
            </div>
            <div className="reward-item total">
              <div className="reward-icon gold">💰</div>
              <span className="reward-label">Oro total:</span>
              <span className="reward-value">{goldCounted}</span>
            </div>
            <div className="reward-item total">
              <div className="reward-icon exp">✨</div>
              <span className="reward-label">Experiencia total:</span>
              <span className="reward-value">{expCounted}</span>
            </div>
          </div>
        </div>
        
        <div className={`battle-tips summary-section ${animationStage >= 3 ? 'show' : ''}`}>
          <h3>Consejos Tácticos</h3>
          <ul className="tip-list">
            {tips.map((tip, index) => (
              <li key={index} className="tip-item">{tip}</li>
            ))}
          </ul>
        </div>
        
        <div className={`battle-log-summary summary-section ${animationStage >= 4 ? 'show' : ''}`}>
          <div className="log-header">
            <h3>Momentos Destacados</h3>
            <button 
              className="toggle-log-btn"
              onClick={() => setShowFullLog(!showFullLog)}
              aria-label={showFullLog ? "Ver resumen" : "Ver registro completo"}
            >
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
                {highlightedLogs.length > 0 ? (
                  highlightedLogs.map((entry, index) => (
                    <div key={index} className="log-entry">
                      {formatLogMessage(entry)}
                    </div>
                  ))
                ) : (
                  <p className="empty-log-message">No hay momentos destacados para mostrar.</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={`next-day-container summary-section ${animationStage >= 4 ? 'show delay-1' : ''}`}>
          <h3>Preparándose para el Día {day + 1}</h3>
          <p>Los aventureros se fortalecen con cada día que pasa. Mejora tus defensas y prepárate para el próximo asalto.</p>
          <button 
            className="next-day-btn" 
            onClick={nextDay}
            aria-label={`Continuar al Día ${day + 1}`}
          >
            <span className="btn-text">Continuar al Día {day + 1}</span>
            <span className="btn-icon">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSummary;