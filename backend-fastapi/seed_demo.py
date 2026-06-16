"""
Script de seed pour la démo de soutenance.
Ajoute ~25 patients, ~40 consultations/diagnostics répartis sur 14 jours, + feedback.
"""
import mysql.connector
import json
import random
from datetime import datetime, timedelta, date

# ── Connexion ────────────────────────────────────────────────────────────────
conn = mysql.connector.connect(
    host="localhost", port=3306, database="medidag",
    user="root", password="", charset="utf8mb4", autocommit=False,
)
cursor = conn.cursor(dictionary=True)

today = date.today()

# ── Medecin ID (le compte de démo) ──────────────────────────────────────────
cursor.execute("SELECT id FROM users WHERE email='medecin@demo.com' LIMIT 1")
row = cursor.fetchone()
MEDECIN_ID = row["id"] if row else 1

# ── Données patients réalistes (Afrique de l'Ouest) ─────────────────────────
PATIENTS = [
    ("Koné",       "Amadou",   "M", "1985-03-12", "+22507010203", "O+"),
    ("Ouédraogo",  "Fatima",   "F", "1992-07-24", "+22607010204", "A+"),
    ("Traoré",     "Ibrahim",  "M", "1975-11-05", "+22507010205", "B+"),
    ("Diallo",     "Mariama",  "F", "2000-01-18", "+22507010206", "AB+"),
    ("Coulibaly",  "Seydou",   "M", "1968-09-30", "+22507010207", "O-"),
    ("Sawadogo",   "Aïssata",  "F", "1988-04-14", "+22607010208", "A-"),
    ("Bamba",      "Mamadou",  "M", "1995-12-22", "+22507010209", "B-"),
    ("Konaté",     "Ramatou",  "F", "1979-08-07", "+22507010210", "O+"),
    ("Sidibé",     "Boubacar", "M", "2003-05-19", "+22507010211", "A+"),
    ("Touré",      "Kadiatou", "F", "1960-02-28", "+22507010212", "B+"),
    ("Diarra",     "Abdoulaye","M", "1990-06-15", "+22607010213", "O+"),
    ("Sow",        "Rokhaya",  "F", "1983-10-03", "+22507010214", "AB-"),
    ("Keita",      "Moussa",   "M", "1972-01-25", "+22507010215", "O+"),
    ("Bah",        "Fatoumata","F", "1997-03-08", "+22507010216", "A+"),
    ("Ndiaye",     "Ousmane",  "M", "2005-07-17", "+22507010217", "B+"),
    ("Camara",     "Mariam",   "F", "1955-11-11", "+22507010218", "O-"),
    ("Barry",      "Lamine",   "M", "1987-09-02", "+22507010219", "A+"),
    ("Cissé",      "Adama",    "M", "1993-04-20", "+22507010220", "O+"),
    ("Fofana",     "Nene",     "F", "1970-12-05", "+22507010221", "B+"),
    ("Diabaté",    "Cheick",   "M", "2001-08-14", "+22507010222", "AB+"),
    ("Kanté",      "Hawa",     "F", "1965-03-29", "+22507010223", "A-"),
    ("Balde",      "Mamadou",  "M", "1978-06-10", "+22507010224", "O+"),
    ("Sanogo",     "Aminata",  "F", "1999-10-23", "+22507010225", "A+"),
    ("Coulibaly",  "Solo",     "M", "1981-02-16", "+22507010226", "B+"),
    ("Traoré",     "Kadija",   "F", "2008-05-31", "+22507010227", "O+"),
]

# ── Consultations réalistes (maladies, symptômes, scores, urgences) ──────────
SCENARIOS = [
    {
        "maladie": "Paludisme (Malaria)",
        "symptomes": ["Fièvre", "Frissons", "Céphalées", "Fatigue", "Sueurs nocturnes"],
        "score": 87.5, "urgence": "élevée",
        "motif": "Fièvre depuis 3 jours avec frissons intenses"
    },
    {
        "maladie": "Pneumonie bactérienne",
        "symptomes": ["Toux productive", "Fièvre élevée", "Douleur thoracique", "Dyspnée", "Fatigue"],
        "score": 81.2, "urgence": "élevée",
        "motif": "Toux avec expectorations jaunes depuis 5 jours"
    },
    {
        "maladie": "Grippe",
        "symptomes": ["Fièvre", "Myalgie", "Céphalées", "Rhinorrhée", "Toux sèche"],
        "score": 74.8, "urgence": "modérée",
        "motif": "Symptômes grippaux depuis 2 jours"
    },
    {
        "maladie": "Gastroentérite aiguë",
        "symptomes": ["Diarrhée", "Vomissements", "Douleur abdominale", "Nausées", "Fièvre légère"],
        "score": 79.3, "urgence": "modérée",
        "motif": "Vomissements et diarrhées depuis hier soir"
    },
    {
        "maladie": "Hypertension artérielle",
        "symptomes": ["Céphalées occipitales", "Vertiges", "Acouphènes", "Vision floue"],
        "score": 83.0, "urgence": "élevée",
        "motif": "Maux de tête persistants avec vertiges"
    },
    {
        "maladie": "Diabète de type 2",
        "symptomes": ["Polyurie", "Polydipsie", "Fatigue", "Amaigrissement", "Vision floue"],
        "score": 85.6, "urgence": "modérée",
        "motif": "Fatigue importante, soif excessive et urines fréquentes"
    },
    {
        "maladie": "Angine streptococcique",
        "symptomes": ["Dysphagie", "Fièvre", "Érythème pharyngé", "Adénopathies cervicales"],
        "score": 76.4, "urgence": "modérée",
        "motif": "Gorge très douloureuse depuis 2 jours avec fièvre"
    },
    {
        "maladie": "Infection urinaire",
        "symptomes": ["Dysurie", "Pollakiurie", "Brûlures mictionnelles", "Douleur sus-pubienne"],
        "score": 88.1, "urgence": "modérée",
        "motif": "Brûlures en urinant et envies fréquentes depuis 3 jours"
    },
    {
        "maladie": "Anémie ferriprive",
        "symptomes": ["Fatigue intense", "Pâleur", "Dyspnée d'effort", "Palpitations", "Vertiges"],
        "score": 72.9, "urgence": "modérée",
        "motif": "Fatigue chronique et pâleur progressive"
    },
    {
        "maladie": "Appendicite aiguë",
        "symptomes": ["Douleur abdominale", "Fièvre", "Nausées", "Vomissements", "Douleur fosse iliaque droite"],
        "score": 91.3, "urgence": "critique",
        "motif": "Douleur abdominale intense en fosse iliaque droite depuis cette nuit"
    },
    {
        "maladie": "Brucellose",
        "symptomes": ["Fièvre ondulante", "Sueurs", "Arthralgie", "Myalgie", "Fatigue"],
        "score": 68.7, "urgence": "modérée",
        "motif": "Fièvres récurrentes et douleurs articulaires depuis 2 semaines"
    },
    {
        "maladie": "Tuberculose pulmonaire",
        "symptomes": ["Toux chronique", "Hémoptysie", "Amaigrissement", "Sueurs nocturnes", "Fièvre"],
        "score": 84.2, "urgence": "élevée",
        "motif": "Toux persistante depuis 3 semaines avec perte de poids"
    },
    {
        "maladie": "Asthme bronchique",
        "symptomes": ["Dyspnée", "Sibilants", "Toux nocturne", "Oppression thoracique"],
        "score": 78.5, "urgence": "élevée",
        "motif": "Difficultés respiratoires avec sifflements"
    },
    {
        "maladie": "Diarrhée infectieuse",
        "symptomes": ["Diarrhée aqueuse", "Crampes abdominales", "Nausées", "Déshydratation"],
        "score": 71.0, "urgence": "modérée",
        "motif": "Diarrhées importantes depuis 2 jours"
    },
    {
        "maladie": "Sinusite aiguë",
        "symptomes": ["Douleur faciale", "Rhinorrhée purulente", "Congestion nasale", "Céphalées", "Fièvre légère"],
        "score": 73.6, "urgence": "faible",
        "motif": "Douleurs du visage et nez bouché depuis 5 jours"
    },
    {
        "maladie": "Herpès génital (HSV-2)",
        "symptomes": ["Vésicules génitales", "Douleur génitale", "Fièvre légère", "Adénopathies inguinales"],
        "score": 82.4, "urgence": "modérée",
        "motif": "Lésions douloureuses au niveau génital"
    },
    {
        "maladie": "Migraine",
        "symptomes": ["Céphalées unilatérales", "Photophobie", "Phonophobie", "Nausées", "Vomissements"],
        "score": 80.1, "urgence": "modérée",
        "motif": "Maux de tête sévères avec nausées"
    },
    {
        "maladie": "Conjonctivite infectieuse",
        "symptomes": ["Rougeur oculaire", "Sécrétions purulentes", "Larmoiement", "Prurit oculaire"],
        "score": 76.8, "urgence": "faible",
        "motif": "Yeux rouges avec sécrétions depuis 2 jours"
    },
    {
        "maladie": "Otite moyenne aiguë",
        "symptomes": ["Otalgie", "Fièvre", "Hypoacousie", "Plénitude auriculaire"],
        "score": 79.2, "urgence": "modérée",
        "motif": "Douleur à l'oreille et fièvre chez l'enfant"
    },
    {
        "maladie": "Lombalgie aiguë",
        "symptomes": ["Douleur lombaire", "Limitation mouvements", "Contracture musculaire"],
        "score": 65.4, "urgence": "faible",
        "motif": "Douleur du bas du dos après effort"
    },
]

# ── 1. Insérer les patients ───────────────────────────────────────────────────
print("Insertion des patients...")
patient_ids = []

# Récupérer les patients existants pour ne pas dupliquer
cursor.execute("SELECT telephone FROM patients")
existing_phones = {r["telephone"] for r in cursor.fetchall()}

for i, (nom, prenom, sexe, dob, tel, blood) in enumerate(PATIENTS):
    if tel in existing_phones:
        cursor.execute("SELECT id FROM patients WHERE telephone=%s", (tel,))
        r = cursor.fetchone()
        if r:
            patient_ids.append(r["id"])
        continue

    now = datetime.now().isoformat()
    # Code patient
    seq = 200 + i
    code = f"PAT-{today.strftime('%Y%m%d')}-{seq:04d}"
    cursor.execute("""
        INSERT INTO patients (code_patient, nom, prenom, date_naissance, sexe,
            telephone, groupe_sanguin, created_at, updated_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (code, nom, prenom, dob, sexe, tel, blood, now, now))
    patient_ids.append(cursor.lastrowid)

conn.commit()
print(f"  {len(patient_ids)} patients disponibles")

# ── 2. Insérer les consultations sur les 14 derniers jours ───────────────────
print("Insertion des consultations et diagnostics...")
consultation_count = 0
feedback_count = 0

# On étale 35 consultations sur 14 jours (2-4/jour en semaine)
SCHEDULE = []
for day_back in range(14, 0, -1):
    d = today - timedelta(days=day_back)
    if d.weekday() < 5:  # lundi-vendredi
        n = random.choice([2, 3, 3, 4])
    else:
        n = random.choice([1, 2])
    for _ in range(n):
        SCHEDULE.append(d)

random.shuffle(SCHEDULE)
scenarios_cycle = SCENARIOS * 4  # assez de scénarios

used_patient_scenario = set()

for idx, consult_date in enumerate(SCHEDULE):
    if idx >= len(scenarios_cycle):
        break

    scenario = scenarios_cycle[idx]
    patient_id = random.choice(patient_ids)

    key = (patient_id, scenario["maladie"])
    if key in used_patient_scenario:
        # choisir un autre patient
        available = [p for p in patient_ids if (p, scenario["maladie"]) not in used_patient_scenario]
        if not available:
            continue
        patient_id = random.choice(available)
        key = (patient_id, scenario["maladie"])
    used_patient_scenario.add(key)

    # Heure aléatoire dans la journée
    h = random.randint(8, 17)
    m = random.randint(0, 59)
    dt_str = datetime.combine(consult_date, datetime.min.time()).replace(hour=h, minute=m).isoformat()

    maladie = scenario["maladie"]
    symptomes = scenario["symptomes"]
    score = round(scenario["score"] + random.uniform(-5, 5), 1)
    urgence = scenario["urgence"]
    motif = scenario["motif"]

    # Diagnostic results JSON
    diag_results = [
        {
            "maladie": maladie,
            "score": score,
            "urgence": urgence,
            "compatibilite_age": True,
            "compatibilite_sexe": True,
            "examens_recommandes": ["NFS", "CRP", "Radiographie"],
            "arguments": [f"Présence de {s.lower()}" for s in symptomes[:3]],
        }
    ]
    # Ajouter 2 hypothèses secondaires
    diag_results.append({
        "maladie": "Infection virale non spécifiée",
        "score": round(score * 0.65, 1),
        "urgence": "faible",
        "compatibilite_age": True,
        "compatibilite_sexe": True,
        "examens_recommandes": ["NFS"],
        "arguments": [],
    })

    # Insert consultation
    cursor.execute("""
        INSERT INTO consultations (patient_id, medecin_id, date_consultation,
            motif, symptomes, diagnostic, notes, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        patient_id, MEDECIN_ID, dt_str, motif,
        json.dumps(symptomes, ensure_ascii=False),
        maladie, "", dt_str,
    ))
    consult_id = cursor.lastrowid

    # Insert diagnostic
    cursor.execute("""
        INSERT INTO diagnostics (consultation_id, patient_id, symptomes,
            analyses, resultats, score, urgence, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        consult_id, patient_id,
        json.dumps(symptomes, ensure_ascii=False),
        json.dumps({}, ensure_ascii=False),
        json.dumps(diag_results, ensure_ascii=False),
        score, urgence, dt_str,
    ))

    # Insert feedback (90% validation)
    valide = 1 if random.random() < 0.90 else 0
    cursor.execute("""
        INSERT INTO diagnostic_feedback (consultation_id, patient_id, medecin_id,
            diagnostic_ia, score_ia, valide, diagnostic_final, score_final, commentaire, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        consult_id, patient_id, MEDECIN_ID,
        maladie, score, valide,
        maladie if valide else "Autre diagnostic",
        score if valide else None,
        "", dt_str,
    ))

    consultation_count += 1
    feedback_count += 1

conn.commit()
print(f"  {consultation_count} consultations insérées")
print(f"  {feedback_count} feedbacks insérés")

cursor.close()
conn.close()

print("\nSeed terminé avec succès !")
