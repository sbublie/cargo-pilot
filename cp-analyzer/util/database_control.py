import psycopg2

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    host="localhost",
    database="cargo_database",
    user="pguser",
    password="pdb&3Xif"
)

cur = conn.cursor()

query = "CREATE TABLE clusters (cluster_id SERIAL PRIMARY KEY, cluster_name VARCHAR(30), center_lat FLOAT, center_long FLOAT);"
cur.execute(query)
conn.commit()

query = "CREATE TABLE locations (location_id SERIAL PRIMARY KEY, center_lat FLOAT, center_long FLOAT, cluster_id INT REFERENCES clusters(cluster_id));"
cur.execute(query)
conn.commit()

query = "CREATE TABLE trips (trip_id SERIAL PRIMARY KEY, load FLOAT, origin_location_id INT REFERENCES locations(location_id), destination_location_id INT REFERENCES locations(location_id), timestamp TIMESTAMP);"
cur.execute(query)
conn.commit()

query = "CREATE TABLE offerings (offering_id SERIAL PRIMARY KEY, load FLOAT, origin_location_id INT REFERENCES locations(location_id), destination_location_id INT REFERENCES locations(location_id), timestamp TIMESTAMP);"
cur.execute(query)
conn.commit()

query = "INSERT INTO clusters (cluster_name, center_lat, center_long) VALUES (%s, %s, %s)"
values = ("Friedrichshafen", 47.66052019738391, 9.481087350416333)
cur.execute(query, values)
conn.commit()

query = "INSERT INTO clusters (cluster_name, center_lat, center_long) VALUES (%s, %s, %s)"
values = ("München", 48.1457337368388, 11.558263062857051)
cur.execute(query, values)
conn.commit()

#Friedrichshafen
query = "INSERT INTO locations (center_lat, center_long, cluster_id) VALUES (%s, %s, %s)"
values = (47.66084635097843, 9.494785045240201, 1)
cur.execute(query, values)
conn.commit

#Friedrichshafen
query = "INSERT INTO locations (center_lat, center_long, cluster_id) VALUES (%s, %s, %s)"
values = (47.67160462680927, 9.424139380469398, 1)
cur.execute(query, values)
conn.commit

# München
query = "INSERT INTO locations (center_lat, center_long, cluster_id) VALUES (%s, %s, %s)"
values = (48.11813442127116, 11.570083498824712, 2)
cur.execute(query, values)
conn.commit
# München
query = "INSERT INTO locations (center_lat, center_long, cluster_id) VALUES (%s, %s, %s)"
values = (48.16579290140838, 11.580697043695302, 2)
cur.execute(query, values)
conn.commit()

query = "INSERT INTO trips (load, origin_location_id, destination_location_id, timestamp) VALUES (%s, %s, %s, to_timestamp(%s))"
values = (0.0, 1, 3, 1623251200)
cur.execute(query, values)
conn.commit()

query = "INSERT INTO offerings (load, origin_location_id, destination_location_id, timestamp) VALUES (%s, %s, %s, to_timestamp(%s))"
values = (20.0, 2, 4, 1687453200)
cur.execute(query, values)
conn.commit()

# Retrieve the data
""" cur.execute("SELECT * FROM clusters")
rows = cur.fetchall()
for row in rows:
    print(row) """

# Close the database connection
cur.close()
conn.close()