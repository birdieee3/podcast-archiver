import csv
import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('pods.db')
cursor = conn.cursor()

# Open the CSV file
with open('james_bonding_episodes_original_dates.csv', newline='', encoding='latin1') as csvfile:
    reader = csv.DictReader(csvfile, delimiter='|')
    
    for row in reader:
        # Extract specific columns
        title = row['jb_title']
        desc = 'n/a'
        date_y = row['release_year']
        date_m = row['release_month']
        date_d = row['release_day']
        duration = 'n/a'
        link = 'https://podcasts.apple.com/us/podcast/james-bonding/id695880236'
        icon = 'https://m.media-amazon.com/images/M/MV5BZDJkMmE3ZDMtY2IyMy00OGIxLTkwZWQtZmIwNTdkZDk5OTFlXkEyXkFqcGdeQXVyMTYzNTEyMzU5._V1_FMjpg_UX1000_.jpg'
        
        # Insert data into the SQL table
        cursor.execute('''
            INSERT INTO jamesbonding_episodes (title, desc, date_y, date_m, date_d, duration, link, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (title, desc, date_y, date_m, date_d, duration, link, icon))

cursor.execute('''
    INSERT INTO jamesbonding_feeddata (title, url, icon)
    VALUES (?, ?, ?)
''', ('James Bonding (legacy dates)', 'pods.db/jamesbonding', 'https://m.media-amazon.com/images/M/MV5BZDJkMmE3ZDMtY2IyMy00OGIxLTkwZWQtZmIwNTdkZDk5OTFlXkEyXkFqcGdeQXVyMTYzNTEyMzU5._V1_FMjpg_UX1000_.jpg'))
# Commit the transaction and close the connection
conn.commit()
conn.close()