const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

// 데이터베이스 연결 설정
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'big16_auth',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// JWT 시크릿
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// 미들웨어: JWT 토큰 검증
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '액세스 토큰이 필요합니다.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
        }
        req.user = user;
        next();
    });
};

// 회원가입 엔드포인트
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: '이름, 이메일, 비밀번호를 모두 입력해주세요.' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: '올바른 이메일 형식을 입력해주세요.' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: '비밀번호는 최소 6자 이상이어야 합니다.' 
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                message: '이미 등록된 이메일입니다.' 
            });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, created_at',
            [name, email, hashedPassword]
        );

        const user = newUser.rows[0];

        res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ 
            message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
    }
});

// 로그인 엔드포인트
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: '이메일과 비밀번호를 모두 입력해주세요.' 
            });
        }

        const userResult = await pool.query(
            'SELECT id, name, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        const user = userResult.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: '이메일 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        res.json({
            message: '로그인 성공',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ 
            message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
        });
    }
});

// 토큰 검증 엔드포인트
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, name, email, created_at, last_login FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                message: '사용자를 찾을 수 없습니다.' 
            });
        }

        const user = userResult.rows[0];

        res.json({
            message: '토큰이 유효합니다.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });

    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(500).json({ 
            message: '서버 오류가 발생했습니다.' 
        });
    }
});

module.exports = router;