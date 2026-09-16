import sqlite3, glob

files = glob.glob(".wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite")
target = [f for f in files if "metadata" not in f][0]

con = sqlite3.connect(target)
cur = con.cursor()

table_order = [
    "users",
    "agendas",
    "katalog_sanksi",
    "app_settings",
    "periode_penilaian",
    "reli_instrumen",
    "instrumen_etoser",
    "instrumen_fasil",
    "instrumen_peer",
    "profil_user",
    "portofolio",
    "reports",
    "report_answers",
    "attendance",
    "reli_assessments",
    "reli_consolidated",
    "sanksi_user",
    "catatan_admin",
    "post_test_questions",
    "post_test_attempts"
]

all_tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
ordered_tables = [t for t in table_order if t in all_tables] + [t for t in all_tables if t not in table_order and t not in ["_cf_METADATA", "sqlite_sequence", "d1_migrations"]]

with open("d1_full_seed.sql", "w", encoding="utf-8") as f:
    f.write("PRAGMA foreign_keys = OFF;\n")
    
    # Drop existing tables first
    for t in reversed(ordered_tables):
        f.write(f"DROP TABLE IF EXISTS [{t}];\n")
        
    for t in ordered_tables:
        create_sql = cur.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{t}'").fetchone()[0]
        f.write(f"\n-- Table: {t}\n")
        f.write(f"{create_sql};\n")
        
        rows = cur.execute(f"SELECT * FROM [{t}]").fetchall()
        col_names = [d[0] for d in cur.description]
        col_list = ", ".join([f"[{c}]" for c in col_names])
        
        for row in rows:
            val_strs = []
            for v in row:
                if v is None:
                    val_strs.append("NULL")
                elif isinstance(v, (int, float)):
                    val_strs.append(str(v))
                else:
                    escaped = str(v).replace("'", "''")
                    val_strs.append(f"'{escaped}'")
            vals = ", ".join(val_strs)
            f.write(f"INSERT INTO [{t}] ({col_list}) VALUES ({vals});\n")

print("Generated d1_full_seed.sql with DROP TABLE and exact CREATE TABLE statements!")
