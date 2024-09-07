import sqlite3

conn = sqlite3.connect('pods.db')
cursor = conn.cursor()

rows = cursor.execute('SELECT * FROM jamesbonding_episodes').fetchall()
for row in rows:
    new_title = row[0].replace('’', "'").replace('–', '-')
    cursor.execute('UPDATE jamesbonding_episodes SET title = ? WHERE title = ?', (new_title, row[0]))

# Commit the transaction and close the connection
conn.commit()
conn.close()