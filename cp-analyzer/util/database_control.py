import psycopg2

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    host="localhost",
    database="cargo",
    user="postgres",
    password="postgres"
)

# Create a table
cur = conn.cursor()

#query = "INSERT INTO trips (orig_lat, orig_long, dest_lat, dest_long, load) VALUES (%s, %s, %s, %s, %s)"
#values = (37.7749, -122.4194, 37.3363, -121.8904, 100.0)
#cur.execute(query, values)
#conn.commit()

# Retrieve the data
cur.execute("SELECT * FROM trips")
rows = cur.fetchall()
for row in rows:
    print(type(row[1]))

# Close the database connection
cur.close()
conn.close()