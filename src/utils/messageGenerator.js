/**
 * Generate motivational messages based on user progress
 */

function generateMotivationalMessage(progressPercent, lastDepositDate) {
  // Check for inactivity (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (lastDepositDate && new Date(lastDepositDate) < thirtyDaysAgo) {
    return "Hace un tiempo que no vemos crecer tu ahorro. ¡Ánimo!";
  }

  // Progress-based messages
  if (progressPercent === 100) {
    return "¡Meta alcanzada! Felicitaciones.";
  }

  if (progressPercent >= 50) {
    return "¡Sigue así, cada aporte te acerca más al campamento.";
  }

  if (progressPercent >= 25) {
    return "¡Vas muy bien! Ya superaste el 25% de tu meta.";
  }

  return "¡Excelente! Ya diste el primer paso en tu plan de ahorro.";
}

module.exports = {
  generateMotivationalMessage,
};
