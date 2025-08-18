// AuthRepository.java
package service.domain;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import service.domain.*;
import java.util.Optional;
import java.util.List;
import java.util.Date;
import java.time.LocalDateTime;

//<<< PoEAA / Repository
@RepositoryRestResource(collectionResourceRel = "auths", path = "auths")
public interface AuthRepository
    extends PagingAndSortingRepository<Auth, Long> {
        Optional<Auth> findByUserId(Long userId);
        Optional<Auth> findByEmail(String email);
        Optional<Auth> findByLoginId(String loginId);

        // 기존 정리용 메서드들 (createdAt 기준) - 하위 호환성을 위해 유지
        List<Auth> findByIsVerifiedFalseAndCreatedAtBefore(Date cutoffTime);
        void deleteByIsVerifiedFalseAndCreatedAtBefore(Date cutoffTime);
        
        // 새로운 정리용 메서드들 (codeGeneratedAt 기준)
        List<Auth> findByIsVerifiedFalseAndCodeGeneratedAtBeforeAndPurpose(
            LocalDateTime cutoffTime, String purpose);
        void deleteByIsVerifiedFalseAndCodeGeneratedAtBeforeAndPurpose(
            LocalDateTime cutoffTime, String purpose);
        
        // 추가: 인증코드 생성 시간이 null인 경우도 고려한 메서드 (필요시 사용)
        List<Auth> findByIsVerifiedFalseAndCodeGeneratedAtIsNull();
    }