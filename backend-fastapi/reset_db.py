"""Reset medidag database — drop all tables and recreate full schema"""
import mysql.connector
import pathlib

conn = mysql.connector.connect(
    host="localhost", port=3306,
    database="medidag", user="root", password="",
    charset="utf8mb4", use_unicode=True
)
cursor = conn.cursor()

# 1 — Drop everything
print("=== Step 1: Dropping all tables ===")
cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
cursor.execute("SHOW TABLES")
tables = [r[0] for r in cursor.fetchall()]
for t in tables:
    cursor.execute("DROP TABLE IF EXISTS `" + t + "`")
    print(f"  Dropped {t}")
cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
conn.commit()

# 2 — Re-read and execute schema_mysql.sql
print("\n=== Step 2: Creating tables from schema_mysql.sql ===")
schema_path = pathlib.Path(__file__).parent / "schema_mysql.sql"
sql_text = schema_path.read_text(encoding="utf-8")

# Split on ; and filter empty / comment-only / SET FK statements
raw_stmts = sql_text.split(";")
statements = []
for s in raw_stmts:
    s = s.strip()
    if not s:
        continue
    # Keep only real SQL (skip pure comment lines)
    lines = [l for l in s.splitlines() if not l.strip().startswith("--")]
    clean = "\n".join(lines).strip()
    if clean:
        statements.append(clean)

errors = 0
for stmt in statements:
    first_word = stmt.split()[0].upper() if stmt.split() else ""
    try:
        cursor.execute(stmt)
        conn.commit()
        if first_word in ("CREATE", "INSERT"):
            obj = stmt.split()[2] if len(stmt.split()) > 2 else ""
            print(f"  OK  {first_word} {obj}")
    except mysql.connector.Error as e:
        print(f"  ERR [{e.errno}] {e.msg[:80]}")
        errors += 1

cursor.close()
conn.close()

print(f"\n=== Done — {errors} error(s) ===")
if errors == 0:
    print("Database fully recreated!")
