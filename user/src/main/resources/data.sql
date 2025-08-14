-- User Service 데이터베이스 초기화 스크립트
-- AUTO_INCREMENT 설정을 강제로 적용

-- 기존 테이블이 잘못 생성되어 있으면 제거하고 재생성
DROP TABLE IF EXISTS User_table;

-- 올바른 AUTO_INCREMENT 설정으로 테이블 재생성
CREATE TABLE User_table (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'USER',
    status VARCHAR(50) DEFAULT 'TRY_TO_REGISTERED',
    company VARCHAR(100),
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AUTO_INCREMENT 시작값 설정
ALTER TABLE User_table AUTO_INCREMENT = 1;

-- 인덱스 생성
CREATE INDEX idx_user_table_email ON User_table(email);
CREATE INDEX idx_user_table_login_id ON User_table(login_id);