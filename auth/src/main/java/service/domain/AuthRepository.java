package service.domain;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import service.domain.*;
import java.util.Optional;
import java.util.List;
import java.util.Date; 

//<<< PoEAA / Repository
@RepositoryRestResource(collectionResourceRel = "auths", path = "auths")
public interface AuthRepository
    extends PagingAndSortingRepository<Auth, Long> {
        Optional<Auth> findByUserId(Long userId);
        Optional<Auth> findByEmail(String email);
        Optional<Auth> findByLoginId(String loginId);

        // 정리용 메서드들 (JPA 네이밍 규칙 사용)
        List<Auth> findByIsVerifiedFalseAndCreatedAtBefore(Date cutoffTime);
        void deleteByIsVerifiedFalseAndCreatedAtBefore(Date cutoffTime);
    }
