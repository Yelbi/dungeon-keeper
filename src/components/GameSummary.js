import React, { useState, useEffect, useMemo } from 'react';
import '../styles/GameSummary.css';

const GameSummary = ({ 
  day, 
  gold,
  experience,
  nextDay, 
  adventurers = [], 
  battleLog = [],
  goldReward = 0,
  experienceReward = 0,
  roomsCount = 0,
  hallsCount = 0,
  monstersCount = 0,
  trapsCount = 0
}) => {
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
      successRate
    };
  }, [adventurers]);
  
  return (
    <div className="game-summary">
      <div className="summary-header">
        <h2>Resumen del Día {day}</h2>
        {stats.successRate >= 50 && (
          <div className={`summary-medal ${
            stats.successRate >= 90 ? "gold" : 
            stats.successRate >= 70 ? "silver" : "bronze"
          }`}>
            {stats.successRate >= 90 ? "🏆" : 
             stats.successRate >= 70 ? "🥈" : "🥉"}
          </div>
        )}
      </div>
      
      <div className="summary-content">
        <div className={`summary-section ${animationStage >= 1 ? 'show' : ''}`}>
          <h3>Resultados</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Aventureros:</span>
              <span className="stat-value">{stats.totalAdventurers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Derrotados:</span>
              <span className="stat-value victory-text">{stats.deadAdventurers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Escapados:</span>
              <span className="stat-value defeat-text">{stats.aliveAdventurers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Éxito:</span>
              <span className="stat-value">{stats.successRate}%</span>
            </div>
          </div>
        </div>
        
        <div className={`summary-section ${animationStage >= 2 ? 'show' : ''}`}>
          <h3>Recompensas</h3>
          <div className="rewards-grid">
            <div className="reward-item">
              <span className="reward-label">Oro ganado:</span>
              <span className="reward-value">{goldReward}</span>
              <div className="reward-progress">
                <div className="reward-progress-bar" style={{ width: `${((goldCounted - gold) / goldReward) * 100}%` }}></div>
              </div>
            </div>
            <div className="reward-item">
              <span className="reward-label">Exp ganada:</span>
              <span className="reward-value">{experienceReward}</span>
              <div className="reward-progress">
                <div className="reward-progress-bar" style={{ width: `${((expCounted - experience) / experienceReward) * 100}%` }}></div>
              </div>
            </div>
            <div className="reward-item total">
              <span className="reward-label">Oro total:</span>
              <span className="reward-value">{goldCounted}</span>
            </div>
            <div className="reward-item total">
              <span className="reward-label">Exp total:</span>
              <span className="reward-value">{expCounted}</span>
            </div>
          </div>
        </div>
        
        <div className={`next-day-container ${animationStage >= 4 ? 'show' : ''}`}>
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