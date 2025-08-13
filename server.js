const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors({
    origin: ['http://20.249.154.2', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 대시보드 페이지 라우트
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 404 에러 핸들링
app.use((req, res) => {
    res.status(404).json({ message: '페이지를 찾을 수 없습니다.' });
});

// 전역 에러 핸들링
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://20.249.154.2:${PORT}에서 접속 가능합니다.`);
});

module.exports = app;