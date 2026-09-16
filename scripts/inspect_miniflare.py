import sqlite3, glob

files = glob.glob(".wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite")
target = [f for f in files if "metadata" not in f][0]
print("Target DB:", target)

con = sqlite3.connect(target)
cur = con.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
for t in tables:
    c = cur.execute(f"SELECT count(*) FROM [{t}]").fetchone()[0]
    print(f"{t}: {c}")
