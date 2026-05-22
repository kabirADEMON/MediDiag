import mysql.connector
conn = mysql.connector.connect(
    host="localhost", port=3306,
    database="medidag", user="root", password="",
    charset="utf8mb4"
)
cursor = conn.cursor()
cursor.execute("SHOW TABLES")
tables = [r[0] for r in cursor.fetchall()]
print(f"Tables ({len(tables)}):")
for t in tables:
    cursor.execute(f"SELECT COUNT(*) FROM `{t}`")
    n = cursor.fetchone()[0]
    print(f"  {t:<35} {n} lignes")
conn.close()
