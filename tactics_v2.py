# =========================================================
# NOUVELLE MECANIQUE DE TACTIQUE SIMPLIFIEE (6 focus)
# 3 attaque + 3 defense, avec interactions strategiques
# Compatible avec main.py (utilise les 8 attributs existants)
# =========================================================

# Options pour les listes deroulantes
ATTACK_FOCUS_OPTIONS = [
    "Tir à 3 points",
    "Jeu intérieur", 
    "Jeu rapide",
    "Jeu posé",
    "Rebond offensif",
    "Contre-attaque",
]

DEFENSE_FOCUS_OPTIONS = [
    "Défense intérieur",
    "Agressivité extérieur",
    "Rebond défensif",
    "Défense de zone",
    "Défense H2H",
    "Contre",
]

# =========================================================
# MATRICE D'INTERACTION (Attaque vs Défense)
# Coefficient multiplicateur sur l'efficacité de l'attaque
# Exemple: Tir à 3 points vs Défense intérieur = 1.8 (très efficace)
# =========================================================
ATTACK_DEFENSE_MATRIX = {
    "Tir à 3 points": {
        "Défense intérieur": 1.8,   # Bonne contre défense intérieur (peu de protection extérieur)
        "Agressivité extérieur": 0.6, # Mauvaise contre pression extérieure
        "Rebond défensif": 1.0,
        "Défense de zone": 1.2,
        "Défense H2H": 1.0,
        "Contre": 0.7,              # Mauvaise contre contreurs (peu de bloc extérieur)
    },
    "Jeu intérieur": {
        "Défense intérieur": 0.7,   # Mauvaise contre défense intérieure
        "Agressivité extérieur": 1.6, # Bonne contre pression extérieure (espace intérieur libre)
        "Rebond défensif": 1.1,
        "Défense de zone": 0.9,
        "Défense H2H": 1.2,
        "Contre": 0.5,              # Très mauvaise contre contreurs
    },
    "Jeu rapide": {
        "Défense intérieur": 1.0,
        "Agressivité extérieur": 1.2,
        "Rebond défensif": 1.7,     # Bonne contre rebond défensif (transition rapide)
        "Défense de zone": 0.6,    # Mauvaise contre zone (lente à organiser)
        "Défense H2H": 1.1,
        "Contre": 1.1,
    },
    "Jeu posé": {
        "Défense intérieur": 1.1,
        "Agressivité extérieur": 1.0,
        "Rebond défensif": 0.9,
        "Défense de zone": 1.5,     # Bonne contre zone (jeu structuré)
        "Défense H2H": 0.7,        # Mauvaise contre H2H (défense individuelle efficace)
        "Contre": 1.0,
    },
    "Rebond offensif": {
        "Défense intérieur": 1.3,
        "Agressivité extérieur": 1.1,
        "Rebond défensif": 0.8,    # Mauvaise contre bon rebond défensif
        "Défense de zone": 1.0,
        "Défense H2H": 1.4,       # Bonne contre H2H (défense individuelle moins efficace sur rebonds)
        "Contre": 0.9,
    },
    "Contre-attaque": {
        "Défense intérieur": 1.2,
        "Agressivité extérieur": 1.9, # Très bonne contre pression extérieure (déséquilibre)
        "Rebond défensif": 1.3,
        "Défense de zone": 1.1,
        "Défense H2H": 1.0,
        "Contre": 0.8,             # Mauvaise contre contreurs (risque de contre)
    },
}

# =========================================================
# POIDS DES FOCUS (par ordre d'importance)
# =========================================================
FOCUS_WEIGHTS = {
    "primary": 0.50,   # Focus principal = 50% de l'influence
    "secondary": 0.30, # Focus secondaire = 30% de l'influence
    "tertiary": 0.20,  # Focus tertiaire = 20% de l'influence
}

# =========================================================
# BONUS/MALUS SUR LES ATTRIBUTS DE BASE (8 attributs existants)
# Ces bonus sont appliqués temporairement pendant le match
# =========================================================
ATTACK_FOCUS_BONUSES = {
    "Tir à 3 points": {"outside_scoring": +15, "playmaking": -5},
    "Jeu intérieur": {"inside_scoring": +15, "athleticism": -5},
    "Jeu rapide": {"athleticism": +20, "playmaking": +5},
    "Jeu posé": {"playmaking": +10, "inside_scoring": +5},
    "Rebond offensif": {"rebounding": +20, "athleticism": +5},
    "Contre-attaque": {"athleticism": +10, "playmaking": +5},
}

DEFENSE_FOCUS_BONUSES = {
    "Défense intérieur": {"defense": +10, "rebounding": +5, "athleticism": -10},
    "Agressivité extérieur": {"defense": +10, "athleticism": +5, "rebounding": -5},
    "Rebond défensif": {"rebounding": +20, "defense": +5, "outside_scoring": -5},
    "Défense de zone": {"defense": +10, "playmaking": +5, "inside_scoring": -5},
    "Défense H2H": {"defense": +10, "athleticism": +5, "stamina": -5},
    "Contre": {"defense": +10, "athleticism": +10, "playmaking": -10},
}

# =========================================================
# BONUS SUR LES TENDANCES DERIVEES
# (utilisées dans les calculs de main.py)
# =========================================================
ATTACK_FOCUS_TENDENCY_BONUSES = {
    "Tir à 3 points": {"three": +20, "catch_and_shoot": +15, "drive": -10, "paint": -10},
    "Jeu intérieur": {"paint": +20, "post_up": +15, "three": -10, "transition": -5},
    "Jeu rapide": {"transition": +25, "drive": +10, "paint": +5, "post_up": -5},
    "Jeu posé": {"midrange": +15, "pass": +10, "transition": -10, "three": -5},
    "Rebond offensif": {"box_out": +20, "paint": +10, "transition": -5},
    "Contre-attaque": {"transition": +30, "drive": +10, "three": +5},
}

DEFENSE_FOCUS_TENDENCY_BONUSES = {
    "Défense intérieur": {"rim_protection": +25, "help": +15, "perimeter_pressure": -10, "switch": -5},
    "Agressivité extérieur": {"perimeter_pressure": +20, "closeout": +15, "rim_protection": -10, "box_out": -5},
    "Rebond défensif": {"box_out": +25, "rebounding": +20, "perimeter_pressure": -5},
    "Défense de zone": {"help": +20, "switch": +15, "rim_protection": +5, "perimeter_pressure": +5},
    "Défense H2H": {"closeout": +20, "deny": +15, "help": +10, "rim_protection": -5},
    "Contre": {"rim_protection": +30, "box_out": -10, "perimeter_pressure": -5},
}

# =========================================================
# FONCTIONS POUR CALCULER L'EFFICACITE TACTIQUE
# =========================================================

def calculate_tactic_efficiency(attack_focuses, defense_focuses):
    """
    Calcule l'efficacité tactique globale (0.5 à 2.0)
    
    Args:
        attack_focuses: Liste de 3 focus d'attaque [principal, secondaire, tertiaire]
        defense_focuses: Liste de 3 focus de défense [principal, secondaire, tertiaire]
    
    Returns:
        float: Coefficient d'efficacité (1.0 = neutre)
    """
    if not attack_focuses or not defense_focuses:
        return 1.0
    
    efficiency = 0.0
    weights = [FOCUS_WEIGHTS["primary"], FOCUS_WEIGHTS["secondary"], FOCUS_WEIGHTS["tertiary"]]
    
    for i, (attack, defense) in enumerate(zip(attack_focuses, defense_focuses)):
        if attack in ATTACK_DEFENSE_MATRIX and defense in ATTACK_DEFENSE_MATRIX[attack]:
            efficiency += ATTACK_DEFENSE_MATRIX[attack][defense] * weights[i]
    
    return efficiency


def get_attack_bonuses(attack_focuses):
    """
    Retourne les bonus/malus à appliquer aux attributs de base pour l'attaque
    
    Args:
        attack_focuses: Liste de 3 focus d'attaque
    
    Returns:
        dict: Bonus pour chaque attribut de base (outside_scoring, inside_scoring, etc.)
    """
    bonuses = {
        "outside_scoring": 0, "inside_scoring": 0, "athleticism": 0,
        "playmaking": 0, "defense": 0, "rebounding": 0, "stamina": 0, "overall": 0
    }
    
    weights = [FOCUS_WEIGHTS["primary"], FOCUS_WEIGHTS["secondary"], FOCUS_WEIGHTS["tertiary"]]
    
    for focus, weight in zip(attack_focuses, weights):
        if focus in ATTACK_FOCUS_BONUSES:
            for attr, value in ATTACK_FOCUS_BONUSES[focus].items():
                bonuses[attr] = bonuses.get(attr, 0) + value * weight
    
    return bonuses


def get_defense_bonuses(defense_focuses):
    """
    Retourne les bonus/malus à appliquer aux attributs de base pour la défense
    
    Args:
        defense_focuses: Liste de 3 focus de défense
    
    Returns:
        dict: Bonus pour chaque attribut de base
    """
    bonuses = {
        "outside_scoring": 0, "inside_scoring": 0, "athleticism": 0,
        "playmaking": 0, "defense": 0, "rebounding": 0, "stamina": 0, "overall": 0
    }
    
    weights = [FOCUS_WEIGHTS["primary"], FOCUS_WEIGHTS["secondary"], FOCUS_WEIGHTS["tertiary"]]
    
    for focus, weight in zip(defense_focuses, weights):
        if focus in DEFENSE_FOCUS_BONUSES:
            for attr, value in DEFENSE_FOCUS_BONUSES[focus].items():
                bonuses[attr] = bonuses.get(attr, 0) + value * weight
    
    return bonuses


def get_tendency_bonuses(attack_focuses, defense_focuses):
    """
    Retourne les bonus à appliquer aux tendances dérivées
    
    Args:
        attack_focuses: Liste de 3 focus d'attaque
        defense_focuses: Liste de 3 focus de défense
    
    Returns:
        tuple: (attack_tendency_bonuses, defense_tendency_bonuses)
    """
    attack_tendencies = {}
    defense_tendencies = {}
    
    weights = [FOCUS_WEIGHTS["primary"], FOCUS_WEIGHTS["secondary"], FOCUS_WEIGHTS["tertiary"]]
    
    for focus, weight in zip(attack_focuses, weights):
        if focus in ATTACK_FOCUS_TENDENCY_BONUSES:
            for tendency, value in ATTACK_FOCUS_TENDENCY_BONUSES[focus].items():
                attack_tendencies[tendency] = attack_tendencies.get(tendency, 0) + value * weight
    
    for focus, weight in zip(defense_focuses, weights):
        if focus in DEFENSE_FOCUS_TENDENCY_BONUSES:
            for tendency, value in DEFENSE_FOCUS_TENDENCY_BONUSES[focus].items():
                defense_tendencies[tendency] = defense_tendencies.get(tendency, 0) + value * weight
    
    return attack_tendencies, defense_tendencies


# =========================================================
# FONCTION POUR APPLIQUER LES BONUS AUX JOUEURS
# =========================================================

def apply_tactic_bonuses_to_player(player, attack_bonuses, defense_bonuses, attack_tendencies, defense_tendencies, is_attacking=True):
    """
    Applique les bonus tactiques à un joueur pendant un match
    
    Args:
        player: Objet Player de main.py
        attack_bonuses: dict de bonus d'attaque (attributs de base)
        defense_bonuses: dict de bonus de défense (attributs de base)
        attack_tendencies: dict de bonus d'attaque (tendances)
        defense_tendencies: dict de bonus de défense (tendances)
        is_attacking: bool (True si l'équipe du joueur est en attaque)
    
    Returns:
        dict: Dictionnaire avec les attributs et tendances modifiés
    """
    # Appliquer les bonus aux attributs de base
    modified_attrs = {}
    for attr in ["outside_scoring", "inside_scoring", "athleticism", "playmaking", "defense", "rebounding", "stamina"]:
        base_value = getattr(player, attr)
        bonus = attack_bonuses.get(attr, 0) if is_attacking else defense_bonuses.get(attr, 0)
        modified_attrs[attr] = max(0, base_value + bonus)
    
    # Appliquer les bonus aux tendances
    # (Les tendances sont calculées dynamiquement dans main.py via build_tendency_profile)
    # On retourne les bonus à ajouter aux tendances de base
    modified_tendencies = {}
    if is_attacking:
        modified_tendencies = attack_tendencies
    else:
        modified_tendencies = defense_tendencies
    
    return {"attrs": modified_attrs, "tendencies": modified_tendencies}


# =========================================================
# EXEMPLE D'UTILISATION
# =========================================================

if __name__ == "__main__":
    # Exemple 1: Bonne combinaison
    attack_focuses = ["Tir à 3 points", "Jeu posé", "Contre-attaque"]
    defense_focuses = ["Défense intérieur", "Défense de zone", "Défense H2H"]
    
    efficiency = calculate_tactic_efficiency(attack_focuses, defense_focuses)
    print(f"Efficacité tactique: {efficiency:.2f}x")  # ~1.45x
    
    attack_bonuses = get_attack_bonuses(attack_focuses)
    defense_bonuses = get_defense_bonuses(defense_focuses)
    attack_tendencies, defense_tendencies = get_tendency_bonuses(attack_focuses, defense_focuses)
    
    print(f"Bonus attaque: {attack_bonuses}")
    print(f"Bonus défense: {defense_bonuses}")
    print(f"Tendances attaque: {attack_tendencies}")
    print(f"Tendances défense: {defense_tendencies}")
    
    # Exemple 2: Mauvaise combinaison
    attack_focuses2 = ["Jeu intérieur", "Jeu rapide", "Rebond offensif"]
    defense_focuses2 = ["Agressivité extérieur", "Contre", "Rebond défensif"]
    
    efficiency2 = calculate_tactic_efficiency(attack_focuses2, defense_focuses2)
    print(f"\nMauvaise combinaison - Efficacité: {efficiency2:.2f}x")  # ~0.78x
