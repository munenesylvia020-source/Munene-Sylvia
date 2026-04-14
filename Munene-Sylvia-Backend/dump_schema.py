import sqlite3
import re

def dump_schema():
    con = sqlite3.connect('db.sqlite3')
    cursor = con.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = cursor.fetchall()
    
    with open('database_structure.sql', 'w') as f:
        f.write("-- Database Structure generated from sqlite3\n\n")
        f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
        for table in tables:
            sql = table[0]
            if sql:
                # Convert SQLite AUTOINCREMENT to MySQL AUTO_INCREMENT
                sql = re.sub(r'\bAUTOINCREMENT\b', 'AUTO_INCREMENT', sql, flags=re.IGNORECASE)
                # Convert integer primary key auto_increment to INT AUTO_INCREMENT
                sql = re.sub(r'integer NOT NULL PRIMARY KEY AUTO_INCREMENT', 'INT NOT NULL PRIMARY KEY AUTO_INCREMENT', sql, flags=re.IGNORECASE)
                # Sometimes SQLite uses quotes
                sql = sql.replace('"', '`')
                
                f.write(sql + ";\n\n")
        f.write("SET FOREIGN_KEY_CHECKS=1;\n")
        
    print("Schema dumped to database_structure.sql")

if __name__ == '__main__':
    dump_schema()
