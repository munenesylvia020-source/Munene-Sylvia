import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Update CORS to allow both ports
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Body:', req.body);
    next();
});

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Backend is running!',
        port: PORT,
        time: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Allowed origins: http://localhost:3000, http://localhost:5174, http://localhost:5173, http://127.0.0.1:5173`);
});