import psycopg2

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    host="localhost",
    database="cargo_database",
    user="pguser",
    password="pdb&3Xif"
)


cur = conn.cursor()


""" query = "CREATE TABLE clusters (cluster_id SERIAL PRIMARY KEY, cluster_name VARCHAR(30), center_lat FLOAT, center_long FLOAT);"
cur.execute(query)
conn.commit()

query = "CREATE TABLE trips (trip_id SERIAL PRIMARY KEY, load FLOAT, origin_lat FLOAT, origin_long FLOAT, destination_lat FLOAT, destination_long FLOAT, timestamp TIMESTAMP, cluster_ID INT REFERENCES clusters(cluster_id));"
cur.execute(query)
conn.commit() """

""" query = "INSERT INTO clusters (cluster_name, center_lat, center_long) VALUES (%s, %s, %s)"
values = ("Test Cluster", 49.0, 8.0)
cur.execute(query, values)
conn.commit()


query = "INSERT INTO trips (load, origin_lat, origin_long, destination_lat, destination_long, timestamp, cluster_ID) VALUES (%s, %s, %s, %s, %s,  to_timestamp(%s), %s)"
values = (100.0, 49.0, 9.0, 48.0, 9.0, 1623251200, 1)
cur.execute(query, values)
conn.commit() """

# Retrieve the data
cur.execute("SELECT * FROM clusters")
rows = cur.fetchall()
for row in rows:
    print(row)

# Close the database connection
cur.close()
conn.close()