import sqlite3

con = sqlite3.connect('sqlite.db')
cur = con.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
for t in tables:
    c = cur.execute(f"SELECT count(*) FROM [{t}]").fetchone()[0]
    print(f"{t}: {c}")
