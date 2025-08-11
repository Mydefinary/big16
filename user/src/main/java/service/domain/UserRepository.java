package service.domain;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.jpa.repository.JpaRepository;

import service.domain.*;
import java.util.Optional;
import java.util.List;

//<<< PoEAA / Repository
@RepositoryRestResource(collectionResourceRel = "users", path = "users")
public interface UserRepository
    extends JpaRepository<User, Long> {
        Optional<User> findByLoginId(String loginId);  
        Optional<User> findByEmail(String email);      
    }
