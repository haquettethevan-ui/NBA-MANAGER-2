#!/usr/bin/env python3
"""
Script pour intégrer la nouvelle mécanique tactique (6 focus) dans main.py
"""

def apply_modifications():
    # Lire le fichier
    with open('main.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # =========================================================
    # MODIFICATION 1: Ajouter l'import au début
    # =========================================================
    print("1. Ajout de l'import...")
    import_block = '''# =========================================================
# NOUVELLE MECANIQUE DE TACTIQUE SIMPLIFIEE (6 focus)
# Import des constantes et fonctions depuis tactics_v2.py
# =========================================================
'''
    import_lines = [
        'try:\n',
        '    from tactics_v2 import (\n',
        '        ATTACK_FOCUS_OPTIONS, DEFENSE_FOCUS_OPTIONS,\n',
        '        ATTACK_DEFENSE_MATRIX, FOCUS_WEIGHTS,\n',
        '        ATTACK_FOCUS_BONUSES, DEFENSE_FOCUS_BONUSES,\n',
        '        ATTACK_FOCUS_TENDENCY_BONUSES, DEFENSE_FOCUS_TENDENCY_BONUSES,\n',
        '        calculate_tactic_efficiency, get_attack_bonuses, get_defense_bonuses,\n',
        '        get_tendency_bonuses\n',
        '    )\n',
        'except ImportError:\n',
        '    # Fallback si tactics_v2.py n existe pas\n',
        '    ATTACK_FOCUS_OPTIONS = DEFENSE_FOCUS_OPTIONS = []\n',
        '    ATTACK_DEFENSE_MATRIX = FOCUS_WEIGHTS = {}\n',
        '    ATTACK_FOCUS_BONUSES = DEFENSE_FOCUS_BONUSES = {}\n',
    ]
    
    # Trouver la ligne "import math"
    for i, line in enumerate(lines):
        if line.strip() == 'import math':
            lines.insert(i+1, import_block)
            lines[i+2:i+2] = import_lines
            break
    
    # =========================================================
    # MODIFICATION 2: Ajouter les 6 focus à DEFAULT_TACTICS
    # =========================================================
    print("2. Ajout des 6 focus à DEFAULT_TACTICS...")
    for i, line in enumerate(lines):
        if '"foulAggression": "Normale",' in line:
            # Ajouter après cette ligne
            new_focus_lines = [
                '    # Nouveau systeme (6 focus)\n',
                '    "attackFocus1": "Jeu rapide",\n',
                '    "attackFocus2": "Tir à 3 points",\n',
                '    "attackFocus3": "Jeu intérieur",\n',
                '    "defenseFocus1": "Défense intérieur",\n',
                '    "defenseFocus2": "Agressivité extérieur",\n',
                '    "defenseFocus3": "Rebond défensif",\n',
            ]
            lines[i+1:i+1] = new_focus_lines
            break
    
    # =========================================================
    # MODIFICATION 3: Modifier simulate_possession
    # =========================================================
    print("3. Modification de simulate_possession...")
    for i, line in enumerate(lines):
        if 'tactics = normalize_tactics(tactics); defending_tactics = normalize_tactics(defending_tactics)' in line:
            # Ajouter après cette ligne
            new_code = '''    
    # =========================================================
    # NOUVELLE MECANIQUE: Calcul des bonus tactiques (6 focus)
    # =========================================================
    attack_focuses = [
        tactics.get("attackFocus1"),
        tactics.get("attackFocus2"),
        tactics.get("attackFocus3")
    ]
    defense_focuses = [
        defending_tactics.get("defenseFocus1"),
        defending_tactics.get("defenseFocus2"),
        defending_tactics.get("defenseFocus3")
    ]
    
    attack_focuses = [f for f in attack_focuses if f in ATTACK_FOCUS_OPTIONS]
    defense_focuses = [f for f in defense_focuses if f in DEFENSE_FOCUS_OPTIONS]
    
    tactic_efficiency = calculate_tactic_efficiency(attack_focuses, defense_focuses)
    attack_attr_bonuses = get_attack_bonuses(attack_focuses)
    defense_attr_bonuses = get_defense_bonuses(defense_focuses)
    attack_tendency_bonuses, defense_tendency_bonuses = get_tendency_bonuses(attack_focuses, defense_focuses)
    
    attacking_team._tactic_efficiency = tactic_efficiency
    attacking_team._attr_bonuses = attack_attr_bonuses
    attacking_team._tendency_bonuses = attack_tendency_bonuses
    defending_team._tactic_efficiency = tactic_efficiency
    defending_team._attr_bonuses = defense_attr_bonuses
    defending_team._tendency_bonuses = defense_tendency_bonuses
'''
            lines.insert(i+1, new_code)
            break
    
    # =========================================================
    # MODIFICATION 4: Modifier shooting_chance
    # =========================================================
    print("4. Modification de shooting_chance...")
    for i, line in enumerate(lines):
        if line.strip() == 'chance -= attacker.fatigue * 0.06':
            # Ajouter avant cette ligne
            new_code = '''    # =========================================================
    # NOUVELLE MECANIQUE: Appliquer les bonus tactiques
    # =========================================================
    if hasattr(attacking_team, '_tactic_efficiency'):
        chance *= attacking_team._tactic_efficiency
    if hasattr(attacking_team, '_attr_bonuses'):
        ab = attacking_team._attr_bonuses
        p += ab.get("outside_scoring", 0)
        i += ab.get("inside_scoring", 0)
        ath += ab.get("athleticism", 0)
        play += ab.get("playmaking", 0)
    if hasattr(attacking_team, '_tendency_bonuses'):
        tb = attacking_team._tendency_bonuses
        if shot_type == 3:
            chance += tb.get("three", 0) * 0.05 + tb.get("catch_and_shoot", 0) * 0.03
        elif shot_area == "paint":
            chance += tb.get("paint", 0) * 0.05 + tb.get("post_up", 0) * 0.03
        elif shot_area == "midrange":
            chance += tb.get("midrange", 0) * 0.05
    
'''
            lines.insert(i, new_code)
            break
    
    # =========================================================
    # MODIFICATION 5: Modifier choose_shot
    # =========================================================
    print("5. Modification de choose_shot...")
    for i, line in enumerate(lines):
        if 'two = 20 + tendency(player, "paint") * 0.38 + tendency(player, "midrange") * 0.24' in line:
            # Ajouter après cette ligne
            new_code = '''    
    # =========================================================
    # NOUVELLE MECANIQUE: Appliquer les bonus de tendance tactique
    # =========================================================
    if hasattr(player, '_team') and hasattr(player._team, '_tendency_bonuses'):
        tb = player._team._tendency_bonuses
        three += tb.get("three", 0) * 0.3
        two += tb.get("paint", 0) * 0.15 + tb.get("midrange", 0) * 0.15
    
'''
            lines.insert(i+1, new_code)
            break
    
    # =========================================================
    # MODIFICATION 6: Ajouter init_player_team_references
    # =========================================================
    print("6. Ajout de init_player_team_references...")
    for i, line in enumerate(lines):
        if 'def apply_minute_end(team):' in line:
            # Trouver la fin de la fonction (ligne vide ou nouvelle fonction)
            j = i + 1
            while j < len(lines) and (lines[j].startswith(' ') or lines[j].startswith('\t') or lines[j].strip() == ''):
                j += 1
            
            # Insérer avant la prochaine fonction
            new_func = '''\n
def init_player_team_references(team):
    """Initialise la référence _team pour chaque joueur de l équipe.
    Cela permet d'accéder aux bonus tactiques depuis les fonctions de calcul.
    """
    for player in team.roster:
        player._team = team

'''
            lines.insert(j, new_func)
            break
    
    # Écrire le fichier
    with open('main.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("\n✅ Toutes les modifications ont été appliquées avec succès !")
    return True

if __name__ == '__main__':
    apply_modifications()
