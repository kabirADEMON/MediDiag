import mysql.connector

conn = mysql.connector.connect(
    host="localhost", port=3306,
    database="medidag", user="root", password="",
    charset="utf8mb4"
)
cursor = conn.cursor()

tables = [
    "users", "patients", "consultations", "diagnostics",
    "vitals", "diagnostic_feedback",
    "medecins", "infirmiers", "administrateurs",
    "dossiers_medicaux", "rapports_medicaux",
    "analyses", "resultats_analyses", "symptomes", "diagnostic_resultats"
]

for t in tables:
    cursor.execute(f"DESCRIBE `{t}`")
    cols = cursor.fetchall()
    print(f"\n=== {t} ===")
    for c in cols:
        null = "NULL" if c[2] == "YES" else "NOT NULL"
        default = f"  default={c[4]}" if c[4] is not None else ""
        print(f"  {c[0]:<35} {str(c[1]):<30} {null}{default}")

conn.close()
