import pymysql

def create_db():
    connection = pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='Artello145',
        port=3306
    )
    with connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS pennyprof CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    connection.commit()
    connection.close()
    print("Database 'pennyprof' created successfully.")

if __name__ == "__main__":
    create_db()
