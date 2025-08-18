-- Big16 인증 시스템 데이터베이스 스키마 (Azure MySQL용)

-- Azure MySQL kt16sql 데이터베이스 사용
-- 데이터베이스는 이미 생성되어 있음: kt16sql.mysql.database.azure.com:3306/kt16sql
-- USE kt16sql;

-- 사용자 테이블 생성 (User.java 엔티티와 일치하도록 수정)
CREATE TABLE IF NOT EXISTS User_table (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'USER',
    status VARCHAR(50) DEFAULT 'TRY_TO_REGISTERED',
    company VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 이메일과 로그인 아이디 인덱스 생성 (로그인 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_table_email ON User_table(email);
CREATE INDEX IF NOT EXISTS idx_user_table_login_id ON User_table(login_id);

-- MySQL에서는 FUNCTION/TRIGGER 대신 ON UPDATE CURRENT_TIMESTAMP 사용
-- User_table의 created_at은 생성시에만 설정되므로 자동 갱신 불필요

-- 세션 테이블 생성 (옵션: 세션 관리가 필요한 경우)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES User_table(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 세션 토큰 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- MySQL에서는 STORED PROCEDURE 사용 (만료된 세션 정리용)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_expired_sessions()
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP OR is_active = FALSE;
    SELECT ROW_COUNT() as deleted_count;
END //
DELIMITER ;

-- 테스트 데이터 삽입 (개발용 - 프로덕션에서는 제거)
-- INSERT INTO User_table (login_id, email, nickname) VALUES 
-- ('testuser', 'test@example.com', '테스트 사용자');

-- 사용자 통계 뷰 생성
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'EMAIL_VERIFIED' THEN 1 END) as verified_users,
    COUNT(CASE WHEN created_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY) THEN 1 END) as new_users_7d
FROM User_table;