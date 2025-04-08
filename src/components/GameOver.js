// src/components/GameOver.js - Versión mejorada
import React, { useState, useMemo, useEffect } from 'react';
import '../styles/GameOver.css';

const GameOver = ({ day, restartGame, monstersKilled = 0, trapsTriggered = 0, goldCollected = 0 }) => {
  // Estado para la animación de entrada secuencial
  const [showElements, setShowElements] = useState({
    header: false,
    stats: false,
    message: false,
    badges: false,
    tips: false,
    button: false
  });
  
  // Estado para verificar confirmación de reinicio
  const [confirmRestart, setConfirmRestart] = useState(false);
  
  // Efecto para animar la entrada secuencial de elementos
  useEffect(() => {
    const timeouts = [];
    
    // Programar la aparición secuencial de elementos
    timeouts.push(setTimeout(() => setShowElements(prev => ({ ...prev, header: true })), 300));
    timeouts.push(setTimeout(() => setShowElements(prev => ({ ...prev, stats: true })), 800));
    timeouts.push(setTimeout(() => setShowElements(prev => ({ ...prev, message: true })), 1300));
    timeouts.push(setTimeout(() => setShowElements(prev => ({ ...prev, badges: true })), 1800));
    timeouts.push(setTimeout(() => setShowElements(prev => ({ ...prev, tips: true })), 2300));
    timeouts.push(setTimeout(() => setShowElements(prev => ({ ...prev, button: true })), 2800));
    
    // Limpiar timeouts en unmount
    return () => timeouts.forEach(t => clearTimeout(t));
  }, []);
  
  // Generar un mensaje personalizado según los días sobrevividos
  const generateMessage = useMemo(() => {
    if (day <= 3) {
      return "Has caído rápidamente ante los aventureros. Con práctica y mejor estrategia, seguro mejorarás.";
    } else if (day <= 7) {
      return "No está mal para un guardián de mazmorra. Has mantenido tu dominio durante varios días.";
    } else if (day <= 12) {
      return "¡Impresionante! Tu mazmorra ha sido temida por muchos aventureros.";
    } else {
      return "¡Extraordinario! Eres uno de los mejores guardianes de mazmorras de todos los tiempos.";
    }
  }, [day]);
  
  // Calcular una puntuación basada en los días sobrevividos y otros factores
  const calculateScore = useMemo(() => {
    const baseScore = day * 100 + Math.pow(day, 2) * 10;
    const monsterBonus = monstersKilled * 20;
    const trapBonus = trapsTriggered * 15;
    const goldBonus = goldCollected * 0.5;
    
    return Math.floor(baseScore + monsterBonus + trapBonus + goldBonus);
  }, [day, monstersKilled, trapsTriggered, goldCollected]);
  
  // Genera un título basado en la puntuación
  const generateTitle = useMemo(() => {
    const score = calculateScore;
    
    if (score < 500) {
      return { title: "Aprendiz de Guardián", icon: "🧪" };
    } else if (score < 1500) {
      return { title: "Guardián Competente", icon: "⚔️" };
    } else if (score < 3000) {
      return { title: "Maestro Guardián", icon: "🛡️" };
    } else if (score < 5000) {
      return { title: "Señor de la Mazmorra", icon: "👑" };
    } else {
      return { title: "Emperador de las Profundidades", icon: "🔥" };
    }
  }, [calculateScore]);
  
  // Consejos personalizados según el rendimiento
  const tips = useMemo(() => {
    const baseTips = [
      "Coloca monstruos de alta resistencia al principio del camino para desgastar a los aventureros.",
      "Combina trampas y monstruos para crear sinergias defensivas.",
      "Invierte tu experiencia en mejorar defensas existentes antes de desbloquear nuevas.",
      "Crea caminos largos para maximizar las oportunidades de dañar a los aventureros.",
      "Adapta tu estrategia según los tipos de aventureros que enfrentes."
    ];
    
    // Añadir consejos específicos según el rendimiento
    const specificTips = [];
    
    if (day < 5) {
      specificTips.push("En los primeros días, concentra tus recursos en construir una defensa básica sólida.");
    }
    
    if (monstersKilled < day * 2) {
      specificTips.push("Tus monstruos podrían ser más efectivos. Considera mejorarlos antes de añadir nuevos.");
    }
    
    if (trapsTriggered < day) {
      specificTips.push("Coloca más trampas en puntos estratégicos para debilitar a los aventureros antes de que lleguen a tus monstruos.");
    }
    
    // Combinar y limitar a 5 consejos
    return [...specificTips, ...baseTips].slice(0, 5);
  }, [day, monstersKilled, trapsTriggered]);
  
  // Función para manejar el botón de reinicio
  const handleRestartClick = () => {
    if (confirmRestart) {
      restartGame();
    } else {
      setConfirmRestart(true);
      // Auto-reset del estado de confirmación después de un tiempo
      setTimeout(() => setConfirmRestart(false), 3000);
    }
  };
  
  // Badges/logros desbloqueados
  const badges = useMemo(() => {
    const earnedBadges = [];
    
    if (day >= 5) earnedBadges.push({ name: "Superviviente", description: "Sobrevivir 5 o más días", icon: "🏆" });
    if (monstersKilled >= 20) earnedBadges.push({ name: "Comandante", description: "Derrotar a 20+ aventureros con monstruos", icon: "⚔️" });
    if (trapsTriggered >= 15) earnedBadges.push({ name: "Maestro de Trampas", description: "Activar 15+ trampas", icon: "⚙️" });
    if (day >= 10) earnedBadges.push({ name: "Veterano", description: "Sobrevivir 10 o más días", icon: "🏅" });
    
    return earnedBadges.slice(0, 3); // Mostrar máximo 3 badges
  }, [day, monstersKilled, trapsTriggered]);
  
  return (
    <div className="game-over-container">
      <div className="game-over-content">
        <h2 className={`game-over-header ${showElements.header ? 'show' : ''}`}>
          <span className="game-over-icon">💀</span>
          Game Over
        </h2>
        
        <div className={`game-over-stats ${showElements.stats ? 'show' : ''}`}>
          <div className="stat-item">
            <span className="stat-label">Días sobrevividos:</span>
            <span className="stat-value">{day}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Puntuación final:</span>
            <span className="stat-value score">{calculateScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Título obtenido:</span>
            <span className="stat-value title">
              <span className="title-icon">{generateTitle.icon}</span>
              {generateTitle.title}
            </span>
          </div>
        </div>
        
        <div className={`game-over-message ${showElements.message ? 'show' : ''}`}>
          <p>{generateMessage}</p>
        </div>
        
        {/* Nuevos badges/logros */}
        {badges.length > 0 && (
          <div className={`game-over-badges ${showElements.badges ? 'show' : ''}`}>
            <h3>Logros Desbloqueados</h3>
            <div className="badges-container">
              {badges.map((badge, index) => (
                <div className="badge-item" key={index}>
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-info">
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-description">{badge.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={`game-over-tips ${showElements.tips ? 'show' : ''}`}>
          <h3>Consejos para tu próxima mazmorra:</h3>
          <ul>
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
        
        <button 
          className={`restart-game-btn ${showElements.button ? 'show' : ''} ${confirmRestart ? 'confirm' : ''}`} 
          onClick={handleRestartClick}
          aria-label="Reiniciar juego"
        >
          {confirmRestart ? '¿Estás seguro?' : '¡Intentar de nuevo!'}
        </button>
      </div>
    </div>
  );
};

export default GameOver;