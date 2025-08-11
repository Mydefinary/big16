package service.infra;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import service.domain.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.stream.Collectors;

@Component
@Slf4j
public class AccountCleanupScheduler {
    
    @Autowired
    private AuthRepository authRepository;
    
    // 1분마다 실행
    @Scheduled(cron = "0 * * * * *")  // 매분 0초에 실행
    @Transactional
    public void cleanupUnverifiedAccounts() {
        try {
            // 3분 전 기준시간 (인증메일 발송 시점 기준)
            LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(3);

            log.info("미인증 계정 정리 시작 - 기준시간: {}", cutoffTime);
            
            // 삭제할 계정들 조건:
            // 1. 이메일 인증이 완료되지 않았고 (isVerified = false)
            // 2. 인증 코드 생성 시간이 3분 이전이고
            // 3. 회원가입 인증 목적인 계정들만 (비밀번호 재설정은 제외)
            List<Auth> unverifiedAccounts = authRepository
                .findByIsVerifiedFalseAndCodeGeneratedAtBeforeAndPurpose(
                    cutoffTime, "SIGN_UP_VERIFICATION");
            
            if (unverifiedAccounts.isEmpty()) {
                log.info("정리할 미인증 계정 없음");
                return;
            }
            
            List<Long> userIds = unverifiedAccounts.stream()
                .map(Auth::getUserId)
                .collect(Collectors.toList());
            
            log.info("삭제 예정 계정들: {}", userIds);
            
            // Auth 데이터 삭제 (인증메일 발송 시점 기준)
            authRepository.deleteByIsVerifiedFalseAndCodeGeneratedAtBeforeAndPurpose(
                cutoffTime, "SIGN_UP_VERIFICATION");
            
            log.info("Auth 서비스에서 {}개 계정 삭제 완료 (인증메일 발송 후 3분 경과)", userIds.size());
            
            // 이벤트 발행 - User 서비스에 삭제 요청
            UnverifiedAccountsDeleted event = new UnverifiedAccountsDeleted(userIds);
            event.publishAfterCommit();
            
            log.info("사용자 삭제 이벤트 발행 완료: {}개 계정", userIds.size());
            
        } catch (Exception e) {
            log.error("미인증 계정 정리 중 오류 발생", e);
        }
    }
}