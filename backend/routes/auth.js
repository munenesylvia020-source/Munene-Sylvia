import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Test route to verify the router is working
router.get('/test', (req, res) => {
    console.log('✅ Test route hit');
    res.json({ 
        success: true, 
        message: 'Auth router is working!',
        timestamp: new Date().toISOString()
    });
});

// SIGNUP ROUTE - Create this
router.post('/signup', async (req, res) => {
    console.log('📝 SIGNUP REQUEST RECEIVED');
    console.log('Request body:', req.body);
    
    try {
        const { fullName, email, password } = req.body;
        
        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
            [fullName, email, hashedPassword]
        );

        console.log('✅ User created with ID:', result.insertId);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: result.insertId, 
                email: email,
                fullName: fullName 
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        // Send success response
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token: token,
            user: {
                id: result.insertId,
                fullName: fullName,
                email: email
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Reload and try again',
            error: error.message
        });
    }
});

// LOGIN ROUTE - Create this too
router.post('/login', async (req, res) => {
    console.log('🔑 LOGIN REQUEST RECEIVED');
    console.log('Request body:', req.body);
    
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                fullName: user.full_name 
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

export default router;