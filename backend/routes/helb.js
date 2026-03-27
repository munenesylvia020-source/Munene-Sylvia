import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Save HELB amount (pending)
router.post('/amount', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid amount is required' 
            });
        }

        // Check if user already has a pending amount
        const [existing] = await pool.query(
            'SELECT * FROM helb_amounts WHERE user_id = ? AND status = "pending"',
            [userId]
        );

        if (existing.length > 0) {
            // Update existing pending amount
            await pool.query(
                'UPDATE helb_amounts SET amount = ? WHERE user_id = ? AND status = "pending"',
                [amount, userId]
            );
        } else {
            // Insert new amount
            await pool.query(
                'INSERT INTO helb_amounts (user_id, amount, status) VALUES (?, ?, "pending")',
                [userId, amount]
            );
        }

        res.json({ 
            success: true, 
            message: 'HELB amount saved successfully',
            amount: amount
        });

    } catch (error) {
        console.error('Error saving HELB amount:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// Get user's HELB amount
router.get('/amount', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.query(
            'SELECT * FROM helb_amounts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return res.json({ 
                success: true, 
                hasAmount: false,
                message: 'No HELB amount found' 
            });
        }

        res.json({ 
            success: true, 
            hasAmount: true,
            amount: rows[0],
            isConfirmed: rows[0].status === 'confirmed'
        });

    } catch (error) {
        console.error('Error fetching HELB amount:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// Confirm budget and create budget record
router.post('/confirm-budget', authenticateToken, async (req, res) => {
    try {
        const { totalAmount, categories } = req.body;
        const userId = req.user.id;

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update HELB amount status to confirmed
            await connection.query(
                'UPDATE helb_amounts SET status = "confirmed", confirmed_at = NOW() WHERE user_id = ? AND status = "pending"',
                [userId]
            );

            // Create budget record
            await connection.query(
                'INSERT INTO budgets (user_id, total_amount, categories, confirmed_at) VALUES (?, ?, ?, NOW())',
                [userId, totalAmount, JSON.stringify(categories)]
            );

            // Create initial transaction for the HELB disbursement
            await connection.query(
                `INSERT INTO transactions (user_id, amount, type, category, description, transaction_date) 
                 VALUES (?, ?, 'income', 'HELB Disbursement', 'HELB loan disbursement for the semester', NOW())`,
                [userId, totalAmount]
            );

            await connection.commit();
            connection.release();

            res.json({ 
                success: true, 
                message: 'Budget confirmed successfully' 
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error confirming budget:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// Get user's budget status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user has confirmed budget
        const [budgets] = await pool.query(
            'SELECT * FROM budgets WHERE user_id = ? AND is_active = true ORDER BY confirmed_at DESC LIMIT 1',
            [userId]
        );

        // Check if user has pending HELB amount
        const [pendingAmount] = await pool.query(
            'SELECT * FROM helb_amounts WHERE user_id = ? AND status = "pending" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        res.json({
            success: true,
            hasBudget: budgets.length > 0,
            hasPendingAmount: pendingAmount.length > 0,
            budget: budgets[0] || null,
            pendingAmount: pendingAmount[0] || null
        });

    } catch (error) {
        console.error('Error fetching budget status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// Get user's transactions
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [transactions] = await pool.query(
            `SELECT * FROM transactions 
             WHERE user_id = ? 
             ORDER BY transaction_date DESC 
             LIMIT 50`,
            [userId]
        );

        res.json({
            success: true,
            transactions: transactions
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

export default router;