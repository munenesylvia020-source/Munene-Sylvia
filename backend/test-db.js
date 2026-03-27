import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'workbench_user',
            password: '8765victor',
            database: 'helb_budget_db'
        });
        
        console.log('✅ Successfully connected to MariaDB on Arch!');
        
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('✅ Query successful:', rows[0].result === 2 ? '2' : 'error');
        
        await connection.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();