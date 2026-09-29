/**
 * NBA Manager 2 - Gestion des tactiques (Frontend JavaScript)
 * Ce fichier gère la communication entre l'interface et le serveur Python
 */

// =========================================================
// CONFIGURATION
// =========================================================

const SERVER_URL = window.location.origin || 'http://localhost:8000';

// =========================================================
// FONCTIONS DE COMMUNICATION AVEC LE SERVEUR
// =========================================================

/**
 * Envoyer les tactiques au serveur pour un match
 * @param {Object} matchData - Données du match
 * @param {string} matchData.team1_id - ID de l'équipe 1
 * @param {string} matchData.team2_id - ID de l'équipe 2
 * @param {Object} matchData.tactics1 - Tactiques de l'équipe 1
 * @param {Function} callback - Fonction de rappel
 */
async function sendMatchRequest(matchData, callback) {
    try {
        const response = await fetch(`${SERVER_URL}/rotation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(matchData)
        });

        const data = await response.json();
        
        if (data.success) {
            callback(null, data);
        } else {
            callback(new Error(data.message || 'Erreur inconnue'), null);
        }
    } catch (error) {
        callback(error, null);
    }
}

/**
 * Sauvegarder les tactiques pour une équipe
 * @param {string} teamId - ID de l'équipe
 * @param {Object} tactics - Les 6 focus tactiques
 * @param {Function} callback - Fonction de rappel
 */
async function saveTactics(teamId, tactics, callback) {
    try {
        const response = await fetch(`${SERVER_URL}/api/save-tactics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                team_id: teamId,
                tactics: tactics
            })
        });

        const data = await response.json();
        
        if (data.success) {
            callback(null, data);
        } else {
            callback(new Error(data.message || 'Erreur inconnue'), null);
        }
    } catch (error) {
        callback(error, null);
    }
}

/**
 * Charger les tactiques sauvegardées pour une équipe
 * @param {string} teamId - ID de l'équipe
 * @param {Function} callback - Fonction de rappel
 */
async function loadTactics(teamId, callback) {
    try {
        const response = await fetch(`${SERVER_URL}/api/load-tactics?team_id=${teamId}`);
        const data = await response.json();
        
        if (data.success) {
            callback(null, data.tactics);
        } else {
            callback(new Error(data.message || 'Erreur inconnue'), null);
        }
    } catch (error) {
        callback(error, null);
    }
}

// =========================================================
// FONCTIONS UTILITAIRES POUR LES TACTIQUES
// =========================================================

// Matrice d'interaction (copie de tactics_v2.py)
const ATTACK_DEFENSE_MATRIX = {
    "Tir à 3 points": {
        "Défense intérieur": 1.8, "Agressivité extérieur": 0.6, "Rebond défensif": 1.0,
        "Défense de zone": 1.2, "Défense H2H": 1.0, "Contre": 0.7
    },
    "Jeu intérieur": {
        "Défense intérieur": 0.7, "Agressivité extérieur": 1.6, "Rebond défensif": 1.1,
        "Défense de zone": 0.9, "Défense H2H": 1.2, "Contre": 0.5
    },
    "Jeu rapide": {
        "Défense intérieur": 1.0, "Agressivité extérieur": 1.2, "Rebond défensif": 1.7,
        "Défense de zone": 0.6, "Défense H2H": 1.1, "Contre": 1.1
    },
    "Jeu posé": {
        "Défense intérieur": 1.1, "Agressivité extérieur": 1.0, "Rebond défensif": 0.9,
        "Défense de zone": 1.5, "Défense H2H": 0.7, "Contre": 1.0
    },
    "Rebond offensif": {
        "Défense intérieur": 1.3, "Agressivité extérieur": 1.1, "Rebond défensif": 0.8,
        "Défense de zone": 1.0, "Défense H2H": 1.4, "Contre": 0.9
    },
    "Contre-attaque": {
        "Défense intérieur": 1.2, "Agressivité extérieur": 1.9, "Rebond défensif": 1.3,
        "Défense de zone": 1.1, "Défense H2H": 1.0, "Contre": 0.8
    }
};

const FOCUS_WEIGHTS = {
    primary: 0.50,
    secondary: 0.30,
    tertiary: 0.20
};

/**
 * Calculer l'efficacité tactique
 * @param {Array} attackFocuses - Les 3 focus d'attaque
 * @param {Array} defenseFocuses - Les 3 focus de défense
 * @returns {number} - Coefficient d'efficacité (0.5 à 2.0)
 */
function calculateTacticEfficiency(attackFocuses, defenseFocuses) {
    const weights = [FOCUS_WEIGHTS.primary, FOCUS_WEIGHTS.secondary, FOCUS_WEIGHTS.tertiary];
    let efficiency = 0;

    for (let i = 0; i < 3; i++) {
        const attack = attackFocuses[i];
        const defense = defenseFocuses[i];
        if (ATTACK_DEFENSE_MATRIX[attack] && ATTACK_DEFENSE_MATRIX[attack][defense]) {
            efficiency += ATTACK_DEFENSE_MATRIX[attack][defense] * weights[i];
        }
    }

    return efficiency;
}

/**
 * Obtenir les options disponibles
 */
const ATTACK_OPTIONS = [
    "Tir à 3 points", "Jeu intérieur", "Jeu rapide", "Jeu posé", "Rebond offensif", "Contre-attaque"
];

const DEFENSE_OPTIONS = [
    "Défense intérieur", "Agressivité extérieur", "Rebond défensif", "Défense de zone", "Défense H2H", "Contre"
];

/**
 * Générer les tactiques par défaut
 */
function getDefaultTactics() {
    return {
        attackFocus1: "Jeu rapide",
        attackFocus2: "Tir à 3 points",
        attackFocus3: "Jeu intérieur",
        defenseFocus1: "Défense intérieur",
        defenseFocus2: "Agressivité extérieur",
        defenseFocus3: "Rebond défensif"
    };
}

/**
 * Obtenir une combinaison aléatoire valide
 */
function getRandomTactics() {
    // Mélanger les options
    const shuffledAttack = [...ATTACK_OPTIONS].sort(() => Math.random() - 0.5);
    const shuffledDefense = [...DEFENSE_OPTIONS].sort(() => Math.random() - 0.5);
    
    return {
        attackFocus1: shuffledAttack[0],
        attackFocus2: shuffledAttack[1],
        attackFocus3: shuffledAttack[2],
        defenseFocus1: shuffledDefense[0],
        defenseFocus2: shuffledDefense[1],
        defenseFocus3: shuffledDefense[2]
    };
}

/**
 * Obtenir une combinaison optimale contre une défense donnée
 * @param {Array} opponentDefense - Les 3 focus de défense de l'adversaire
 */
function getOptimalAttackTactics(opponentDefense) {
    // Trouver les meilleures attaques contre chaque focus de défense
    const bestAgainst = {};
    
    for (const defense of opponentDefense) {
        let bestAttack = null;
        let bestValue = -Infinity;
        
        for (const attack of ATTACK_OPTIONS) {
            const value = ATTACK_DEFENSE_MATRIX[attack][defense];
            if (value > bestValue) {
                bestValue = value;
                bestAttack = attack;
            }
        }
        
        bestAgainst[defense] = bestAttack;
    }
    
    // Retirer les doublons
    const uniqueAttacks = [...new Set(Object.values(bestAgainst))];
    
    // Compléter avec d'autres attaques si nécessaire
    while (uniqueAttacks.length < 3) {
        for (const attack of ATTACK_OPTIONS) {
            if (!uniqueAttacks.includes(attack)) {
                uniqueAttacks.push(attack);
                if (uniqueAttacks.length === 3) break;
            }
        }
    }
    
    return {
        attackFocus1: uniqueAttacks[0],
        attackFocus2: uniqueAttacks[1],
        attackFocus3: uniqueAttacks[2]
    };
}

// =========================================================
// EXPORT POUR UTILISATION DANS D'AUTRES FICHIERS
// =========================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SERVER_URL,
        sendMatchRequest,
        saveTactics,
        loadTactics,
        calculateTacticEfficiency,
        ATTACK_OPTIONS,
        DEFENSE_OPTIONS,
        ATTACK_DEFENSE_MATRIX,
        FOCUS_WEIGHTS,
        getDefaultTactics,
        getRandomTactics,
        getOptimalAttackTactics
    };
}
