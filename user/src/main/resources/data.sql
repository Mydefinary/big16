-- User Service 데이터베이스 AUTO_INCREMENT 보장 스크립트
-- 테이블 삭제 대신 ALTER로 AUTO_INCREMENT 설정만 수정

-- 기존 테이블이 있는지 확인하고 AUTO_INCREMENT 설정
ALTER TABLE User_table MODIFY user_id BIGINT AUTO_INCREMENT;

-- 혹시 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS User_table (
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

-- 인덱스 생성 (이미 있으면 무시)
CREATE INDEX IF NOT EXISTS idx_user_table_email ON User_table(email);
CREATE INDEX IF NOT EXISTS idx_user_table_login_id ON User_table(login_id);