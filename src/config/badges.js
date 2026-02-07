// Definición de todas las insignias disponibles en el sistema
const BADGES = {
  // Insignias de progreso
  PRIMER_DEPOSITO: {
    id: 'primer_deposito',
    name: 'Primer Paso',
    description: 'Haz tu primer depósito',
    emoji: '🎯',
    condition: (user, depositCount) => depositCount >= 1,
  },
  CINCO_DEPOSITOS: {
    id: 'cinco_depositos',
    name: 'Constante',
    description: 'Realiza 5 depósitos',
    emoji: '⭐',
    condition: (user, depositCount) => depositCount >= 5,
  },
  DIEZ_DEPOSITOS: {
    id: 'diez_depositos',
    name: 'Dedicado',
    description: 'Realiza 10 depósitos',
    emoji: '✨',
    condition: (user, depositCount) => depositCount >= 10,
  },

  // Insignias de meta
  CUARTO_META: {
    id: 'cuarto_meta',
    name: 'Comienzo Prometedor',
    description: 'Ahorra 25% de tu meta',
    emoji: '📈',
    condition: (user, depositCount, totalSaved, goal) => totalSaved >= goal * 0.25,
  },
  MITAD_META: {
    id: 'mitad_meta',
    name: 'A Mitad del Camino',
    description: 'Ahorra 50% de tu meta',
    emoji: '🔥',
    condition: (user, depositCount, totalSaved, goal) => totalSaved >= goal * 0.5,
  },
  TRES_CUARTOS_META: {
    id: 'tres_cuartos_meta',
    name: 'Casi Allá',
    description: 'Ahorra 75% de tu meta',
    emoji: '💪',
    condition: (user, depositCount, totalSaved, goal) => totalSaved >= goal * 0.75,
  },
  META_COMPLETA: {
    id: 'meta_completa',
    name: 'Campeón',
    description: 'Alcanza tu meta de Bs. 500',
    emoji: '🏆',
    condition: (user, depositCount, totalSaved, goal) => totalSaved >= goal,
  },

  // Insignias de ranking
  TOP_TRES: {
    id: 'top_tres',
    name: 'Top 3 Ahorrista',
    description: 'Posiciónate en el top 3 del ranking',
    emoji: '🥇',
    condition: (user, depositCount, totalSaved, goal, position) => position <= 3,
  },

  // Insignias especiales
  DEDICADO_SEMANAL: {
    id: 'dedicado_semanal',
    name: 'Disciplinado',
    description: 'Deposita en 4 semanas consecutivas',
    emoji: '📅',
    condition: (user, depositCount, totalSaved, goal, position, lastDeposits) => {
      // Esta se valida de forma especial
      return false;
    },
  },

  // Insignias de montos
  DEPOSITO_GRANDE: {
    id: 'deposito_grande',
    name: 'Generoso',
    description: 'Realiza un depósito de Bs. 100 o más',
    emoji: '💰',
    condition: (user, depositCount, totalSaved, goal, position, lastDeposits, maxDeposit) =>
      maxDeposit >= 100,
  },
};

// Función para obtener todas las insignias
const getAllBadges = () => BADGES;

// Función para obtener una insignia por ID
const getBadgeById = (id) => {
  for (const [key, badge] of Object.entries(BADGES)) {
    if (badge.id === id) {
      return badge;
    }
  }
  return null;
};

// Función para verificar qué insignias debe desbloquear un usuario
const checkBadges = (user, depositCount, totalSaved, goal, position, deposits = []) => {
  const newBadges = [];
  const existingBadgeIds = user.badges.map((b) => b.id);

  // Calcular el depósito más grande
  const maxDeposit =
    deposits.length > 0 ? Math.max(...deposits.map((d) => d.amount)) : 0;

  for (const [key, badge] of Object.entries(BADGES)) {
    // Si ya tiene la insignia, saltar
    if (existingBadgeIds.includes(badge.id)) {
      continue;
    }

    // Evaluar la condición
    let shouldUnlock = false;

    try {
      shouldUnlock = badge.condition(
        user,
        depositCount,
        totalSaved,
        goal,
        position,
        deposits,
        maxDeposit
      );
    } catch (err) {
      console.error(`Error evaluating badge ${badge.id}:`, err);
    }

    if (shouldUnlock) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        emoji: badge.emoji,
        unlockedAt: new Date(),
      });
    }
  }

  return newBadges;
};

module.exports = {
  BADGES,
  getAllBadges,
  getBadgeById,
  checkBadges,
};
