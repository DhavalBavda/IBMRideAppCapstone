import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_NAME = "Ride_hailing_app"
DB_USER = "postgres"
DB_PASS = "admin"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    # Connect to postgres default database
    con = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        host=DB_HOST,
        password=DB_PASS,
        port=DB_PORT
    )
    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()

    # Check if database exists
    cur.execute(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'")
    exists = cur.fetchone()
    if not exists:
        cur.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"✅ Database {DB_NAME} created successfully!")
    else:
        print(f"ℹ️ Database {DB_NAME} already exists.")

    cur.close()
    con.close()

except Exception as e:
    print(f"❌ Error: {e}")
