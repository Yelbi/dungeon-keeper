// src/components/GameOver.js
import React from 'react';
import '../styles/GameOver.css';

const GameOver = ({ day, restartGame }) => {
  // Genera un mensaje personalizado según los días sobrevividos
  const generateMessage = () => {
    if (day <= 3) {
      return "Has caído rápidamente ante los aventureros. Con práctica y mejor estrategia, seguro mejorarás.";
    } else if (day <= 7) {
      return "No está mal para un guardián de mazmorra. Has mantenido tu dominio durante varios días.";
    } else if (day <= 12) {
      return "¡Impresionante! Tu mazmorra ha sido temida por muchos aventureros.";
    } else {
      return "¡Extraordinario! Eres uno de los mejores guardianes de mazmorras de todos los tiempos.";
    }
  };
  
  // Calcula una puntuación basada en los días sobrevividos
  const calculateScore = () => {
    return day * 100 + Math.pow(day, 2) * 10;
  };
  
  // Genera un título basado en la puntuación
  const generateTitle = () => {
    const score = calculateScore();
    
    if (score < 500) {
      return "Aprendiz de Guardián";
    } else if (score < 1500) {
      return "Guardián Competente";
    } else if (score < 3000) {
      return "Maestro Guardián";
    } else if (score < 5000) {
      return "Señor de la Mazmorra";
    } else {
      return "Emperador de las Profundidades";
    }
  };
  
  const message = generateMessage();
  const score = calculateScore();
  const title = generateTitle();
  
  return (
    <div className="game-over-container">
      <div className="game-over-content">
        <h2 className="game-over-header">Game Over</h2>
        
        <div className="game-over-stats">
          <div className="stat-item">
            <span className="stat-label">Días sobrevividos:</span>
            <span className="stat-value">{day}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Puntuación final:</span>
            <span className="stat-value score">{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Título obtenido:</span>
            <span className="stat-value title">{title}</span>
          </div>
        </div>
        
        <div className="game-over-message">
          <p>{message}</p>
        </div>
        
        <div className="game-over-tips">
          <h3>Consejos para tu próxima mazmorra:</h3>
          <ul>
            <li>Coloca monstruos de alta resistencia al principio del camino para desgastar a los aventureros.</li>
            <li>Combina trampas y monstruos para crear sinergias defensivas.</li>
            <li>Invierte tu experiencia en mejorar defensas existentes antes de desbloquear nuevas.</li>
            <li>Crea caminos largos para maximizar las oportunidades de dañar a los aventureros.</li>
            <li>Adapta tu estrategia según los tipos de aventureros que enfrentes.</li>
          </ul>
        </div>
        
        <button className="restart-game-btn" onClick={restartGame}>
          ¡Intentar de nuevo!
        </button>
      </div>
    </div>
  );
};

export default GameOver;