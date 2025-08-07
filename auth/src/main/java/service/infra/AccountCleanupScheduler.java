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
    
    // // 매일 새벽 2시에 실행
    // @Scheduled(cron = "0 0 2 * * *")

    // 1분마다 실행으로 변경
    @Scheduled(cron = "0 * * * * *")  // 매분 0초에 실행
    @Transactional
    public void cleanupUnverifiedAccounts() {
        try {
            // // 24시간 전 기준시간
            // Date cutoffTime = Date.from(
            //     LocalDateTime.now().minusHours(24)
            //         .atZone(ZoneId.systemDefault())
            //         .toInstant()
            // );
            // 3분 전 기준시간으로 변경
            Date cutoffTime = Date.from(
                LocalDateTime.now().minusMinutes(3)  // 24시간 → 3분으로 변경
                    .atZone(ZoneId.systemDefault())
                    .toInstant()
            );

            log.info("미인증 계정 정리 시작 - 기준시간: {}", cutoffTime);
            
            // 삭제할 계정들의 userId 수집
            List<Auth> unverifiedAccounts = authRepository
                .findByIsVerifiedFalseAndCreatedAtBefore(cutoffTime);
            
            if (unverifiedAccounts.isEmpty()) {
                log.info("정리할 미인증 계정 없음");
                return;
            }
            
            List<Long> userIds = unverifiedAccounts.stream()
                .map(Auth::getUserId)
                .collect(Collectors.toList());
            
            // Auth 데이터 삭제
            authRepository.deleteByIsVerifiedFalseAndCreatedAtBefore(cutoffTime);
            
            log.info("Auth 서비스에서 {}개 계정 삭제 완료", userIds.size());
            
            // 이벤트 발행 - User 서비스에 삭제 요청
            UnverifiedAccountsDeleted event = new UnverifiedAccountsDeleted(userIds);
            event.publishAfterCommit();
            
            log.info("사용자 삭제 이벤트 발행 완료: {}개 계정", userIds.size());
            
        } catch (Exception e) {
            log.error("미인증 계정 정리 중 오류 발생", e);
        }
    }
}