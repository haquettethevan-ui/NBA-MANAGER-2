# Exemple d'intégration UI pour les 6 focus tactiques

Ce document explique comment intégrer les **6 listes déroulantes** (3 attaque + 3 défense) dans l'interface utilisateur.

---

## Structure des données

### Ancien système (à remplacer)
```json
{
  "tactics1": {
    "offenseStyle": "Pace & Space",
    "tempo": "Normal",
    "threePointFocus": "Équilibré",
    "ballMovement": "Équilibré",
    "transitionOffense": "Équilibrée",
    "pickAndRollFrequency": "Normal",
    "postUpFrequency": "Normal",
    "driveFrequency": "Normal",
    "primaryOption": "Équilibrée",
    "shotSelection": "Normale",
    "offensiveRebound": "Normal",
    "defenseStyle": "Homme à homme",
    "pressure": "Normale",
    "helpDefense": "Normale",
    "pickAndRollCoverage": "Drop",
    "defensivePriority": "Équilibrée",
    "transitionDefense": "Équilibré",
    "defensiveRebound": "Équilibré",
    "foulAggression": "Normale"
  }
}
```

### Nouveau système (6 focus)
```json
{
  "tactics1": {
    // ===== NOUVEAU: 6 focus tactiques =====
    "attackFocus1": "Jeu rapide",      // Focus d'attaque principal
    "attackFocus2": "Tir à 3 points",    // Focus d'attaque secondaire
    "attackFocus3": "Jeu intérieur",     // Focus d'attaque tertiaire
    "defenseFocus1": "Défense intérieur", // Focus de défense principal
    "defenseFocus2": "Agressivité extérieur", // Focus de défense secondaire
    "defenseFocus3": "Rebond défensif",  // Focus de défense tertiaire
    
    // ===== Anciennes options (optionnel, pour compatibilité) =====
    "offenseStyle": "Équilibré",
    "tempo": "Normal",
    "threePointFocus": "Équilibré",
    "ballMovement": "Équilibré",
    "transitionOffense": "Équilibrée",
    "pickAndRollFrequency": "Normal",
    "postUpFrequency": "Normal",
    "driveFrequency": "Normal",
    "primaryOption": "Équilibrée",
    "shotSelection": "Normale",
    "offensiveRebound": "Normal",
    "defenseStyle": "Homme à homme",
    "pressure": "Normale",
    "helpDefense": "Normale",
    "pickAndRollCoverage": "Drop",
    "defensivePriority": "Équilibrée",
    "transitionDefense": "Équilibré",
    "defensiveRebound": "Équilibré",
    "foulAggression": "Normale"
  }
}
```

---

## Options disponibles

### Focus d'attaque (6 options)
| Valeur | Description | Bonus principaux |
|--------|-------------|-----------------|
| `"Tir à 3 points"` | Priorité aux tirs extérieurs | +outside_scoring, +three |
| `"Jeu intérieur"` | Attaque près du panier | +inside_scoring, +paint |
| `"Jeu rapide"` | Transition rapide | +athleticism, +transition |
| `"Jeu posé"` | Attaque structurée | +playmaking, +midrange |
| `"Rebond offensif"` | Récupération des rebonds | +rebounding, +box_out |
| `"Contre-attaque"` | Exploiter les erreurs adverses | +transition, +drive |

### Focus de défense (6 options)
| Valeur | Description | Bonus principaux |
|--------|-------------|-----------------|
| `"Défense intérieur"` | Protection du panier | +defense, +rim_protection |
| `"Agressivité extérieur"` | Pression sur les tireurs | +perimeter_pressure, +closeout |
| `"Rebond défensif"` | Priorité aux rebonds | +rebounding, +box_out |
| `"Défense de zone"` | Couverture collective | +help, +switch |
| `"Défense H2H"` | Marquage individuel | +closeout, +deny |
| `"Contre"` | Tentative de contrer | +rim_protection, +box_out |

---

## Matrice d'interaction (exemples)

| Attaque \ Défense | Défense intérieur | Agressivité extérieur | Rebond défensif |
|-------------------|-------------------|----------------------|-----------------|
| Tir à 3 points | **1.8x** (très efficace) | 0.6x (peu efficace) | 1.0x (neutre) |
| Jeu intérieur | 0.7x (peu efficace) | **1.6x** (très efficace) | 1.1x (neutre) |
| Jeu rapide | 1.0x (neutre) | 1.2x (efficace) | **1.7x** (très efficace) |

---

## Exemple de code HTML/JavaScript

### HTML (3 listes déroulantes pour l'attaque)
```html
<div class="tactics-section">
  <h3>Tactiques d'attaque (par ordre d'importance)</h3>
  
  <div class="focus-selector">
    <label>1. Focus principal:</label>
    <select id="attackFocus1">
      <option value="Tir à 3 points">Tir à 3 points</option>
      <option value="Jeu intérieur">Jeu intérieur</option>
      <option value="Jeu rapide">Jeu rapide</option>
      <option value="Jeu posé">Jeu posé</option>
      <option value="Rebond offensif">Rebond offensif</option>
      <option value="Contre-attaque">Contre-attaque</option>
    </select>
  </div>
  
  <div class="focus-selector">
    <label>2. Focus secondaire:</label>
    <select id="attackFocus2">
      <option value="Tir à 3 points">Tir à 3 points</option>
      <option value="Jeu intérieur">Jeu intérieur</option>
      <option value="Jeu rapide">Jeu rapide</option>
      <option value="Jeu posé">Jeu posé</option>
      <option value="Rebond offensif">Rebond offensif</option>
      <option value="Contre-attaque">Contre-attaque</option>
    </select>
  </div>
  
  <div class="focus-selector">
    <label>3. Focus tertiaire:</label>
    <select id="attackFocus3">
      <option value="Tir à 3 points">Tir à 3 points</option>
      <option value="Jeu intérieur">Jeu intérieur</option>
      <option value="Jeu rapide">Jeu rapide</option>
      <option value="Jeu posé">Jeu posé</option>
      <option value="Rebond offensif">Rebond offensif</option>
      <option value="Contre-attaque">Contre-attaque</option>
    </select>
  </div>
</div>

<div class="tactics-section">
  <h3>Tactiques de défense (par ordre d'importance)</h3>
  
  <div class="focus-selector">
    <label>1. Focus principal:</label>
    <select id="defenseFocus1">
      <option value="Défense intérieur">Défense intérieur</option>
      <option value="Agressivité extérieur">Agressivité extérieur</option>
      <option value="Rebond défensif">Rebond défensif</option>
      <option value="Défense de zone">Défense de zone</option>
      <option value="Défense H2H">Défense H2H</option>
      <option value="Contre">Contre</option>
    </select>
  </div>
  
  <div class="focus-selector">
    <label>2. Focus secondaire:</label>
    <select id="defenseFocus2">
      <option value="Défense intérieur">Défense intérieur</option>
      <option value="Agressivité extérieur">Agressivité extérieur</option>
      <option value="Rebond défensif">Rebond défensif</option>
      <option value="Défense de zone">Défense de zone</option>
      <option value="Défense H2H">Défense H2H</option>
      <option value="Contre">Contre</option>
    </select>
  </div>
  
  <div class="focus-selector">
    <label>3. Focus tertiaire:</label>
    <select id="defenseFocus3">
      <option value="Défense intérieur">Défense intérieur</option>
      <option value="Agressivité extérieur">Agressivité extérieur</option>
      <option value="Rebond défensif">Rebond défensif</option>
      <option value="Défense de zone">Défense de zone</option>
      <option value="Défense H2H">Défense H2H</option>
      <option value="Contre">Contre</option>
    </select>
  </div>
</div>
```

### JavaScript (pour construire le payload)
```javascript
// Récupérer les valeurs sélectionnées
const tactics1 = {
  // Anciennes tactiques (optionnel)
  offenseStyle: "Équilibré",
  tempo: "Normal",
  threePointFocus: "Équilibré",
  ballMovement: "Équilibré",
  transitionOffense: "Équilibrée",
  pickAndRollFrequency: "Normal",
  postUpFrequency: "Normal",
  driveFrequency: "Normal",
  primaryOption: "Équilibrée",
  shotSelection: "Normale",
  offensiveRebound: "Normal",
  defenseStyle: "Homme à homme",
  pressure: "Normale",
  helpDefense: "Normale",
  pickAndRollCoverage: "Drop",
  defensivePriority: "Équilibrée",
  transitionDefense: "Équilibré",
  defensiveRebound: "Équilibré",
  foulAggression: "Normale",
  
  // NOUVEAUX: 6 focus tactiques
  attackFocus1: document.getElementById('attackFocus1').value,
  attackFocus2: document.getElementById('attackFocus2').value,
  attackFocus3: document.getElementById('attackFocus3').value,
  defenseFocus1: document.getElementById('defenseFocus1').value,
  defenseFocus2: document.getElementById('defenseFocus2').value,
  defenseFocus3: document.getElementById('defenseFocus3').value
};

// Envoyer au serveur
fetch('/rotation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    team1_id: 'LAL',
    team2_id: 'BOS',
    rotation1: [...],
    tactics1: tactics1
  })
});
```

---

## Feedback visuel (optionnel)

Pour aider le joueur à comprendre les interactions, vous pouvez afficher un indicateur d'efficacité :

```javascript
// Après avoir sélectionné les 6 focus
const attackFocuses = [
  document.getElementById('attackFocus1').value,
  document.getElementById('attackFocus2').value,
  document.getElementById('attackFocus3').value
];

const defenseFocuses = [
  document.getElementById('defenseFocus1').value,
  document.getElementById('defenseFocus2').value,
  document.getElementById('defenseFocus3').value
];

// Calculer l'efficacité (côté frontend pour prévisualisation)
// Note: Cette matrice doit correspondre à celle dans tactics_v2.py
const matrix = {
  "Tir à 3 points": {"Défense intérieur": 1.8, "Agressivité extérieur": 0.6, "Rebond défensif": 1.0, "Défense de zone": 1.2, "Défense H2H": 1.0, "Contre": 0.7},
  "Jeu intérieur": {"Défense intérieur": 0.7, "Agressivité extérieur": 1.6, "Rebond défensif": 1.1, "Défense de zone": 0.9, "Défense H2H": 1.2, "Contre": 0.5},
  "Jeu rapide": {"Défense intérieur": 1.0, "Agressivité extérieur": 1.2, "Rebond défensif": 1.7, "Défense de zone": 0.6, "Défense H2H": 1.1, "Contre": 1.1},
  "Jeu posé": {"Défense intérieur": 1.1, "Agressivité extérieur": 1.0, "Rebond défensif": 0.9, "Défense de zone": 1.5, "Défense H2H": 0.7, "Contre": 1.0},
  "Rebond offensif": {"Défense intérieur": 1.3, "Agressivité extérieur": 1.1, "Rebond défensif": 0.8, "Défense de zone": 1.0, "Défense H2H": 1.4, "Contre": 0.9},
  "Contre-attaque": {"Défense intérieur": 1.2, "Agressivité extérieur": 1.9, "Rebond défensif": 1.3, "Défense de zone": 1.1, "Défense H2H": 1.0, "Contre": 0.8}
};

const weights = [0.5, 0.3, 0.2]; // principal, secondaire, tertiaire
let efficiency = 0;
for (let i = 0; i < 3; i++) {
  const attack = attackFocuses[i];
  const defense = defenseFocuses[i];
  if (matrix[attack] && matrix[attack][defense]) {
    efficiency += matrix[attack][defense] * weights[i];
  }
}

// Afficher l'efficacité
const efficiencyElement = document.getElementById('tactic-efficiency');
if (efficiencyElement) {
  efficiencyElement.textContent = `Efficacité tactique: ${efficiency.toFixed(2)}x`;
  if (efficiency > 1.5) {
    efficiencyElement.style.color = 'green';
  } else if (efficiency < 0.8) {
    efficiencyElement.style.color = 'red';
  } else {
    efficiencyElement.style.color = 'orange';
  }
}
```

---

## CSS (optionnel)

```css
.tactics-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.tactics-section h3 {
  margin-top: 0;
  color: #333;
}

.focus-selector {
  margin: 10px 0;
}

.focus-selector label {
  display: inline-block;
  width: 150px;
  font-weight: bold;
}

.focus-selector select {
  padding: 5px;
  border-radius: 3px;
  border: 1px solid #ccc;
  width: 200px;
}

#tactic-efficiency {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
  font-weight: bold;
}
```

---

## Notes importantes

1. **Ordre d'importance** : Les focus sont pondérés (50% pour le principal, 30% pour le secondaire, 20% pour le tertiaire)

2. **Compatibilité** : Les anciennes options de tactique sont toujours supportées pour la rétrocompatibilité

3. **Backend** : Le serveur (`server.py`) gère déjà les 6 focus via `ai_tactics()` pour l'IA

4. **Fichiers Python** : Assurez-vous que `tactics_v2.py` est dans le même dossier que `main.py` et `server.py`

---

## Exemple de combinaison efficace

**Attaque:**
1. Tir à 3 points (principal)
2. Jeu posé (secondaire)
3. Contre-attaque (tertiaire)

**Défense:**
1. Défense intérieur (principal)
2. Défense de zone (secondaire)
3. Défense H2H (tertiaire)

**Résultat:** Efficacité ≈ 1.45x (très bon choix !)

---

## Exemple de mauvaise combinaison

**Attaque:**
1. Jeu intérieur (principal)
2. Jeu rapide (secondaire)
3. Rebond offensif (tertiaire)

**Défense:**
1. Agressivité extérieur (principal)
2. Contre (secondaire)
3. Rebond défensif (tertiaire)

**Résultat:** Efficacité ≈ 0.78x (mauvais choix !)
