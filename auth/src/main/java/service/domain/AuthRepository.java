package service.domain;

import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import service.domain.*;

//<<< PoEAA / Repository
@RepositoryRestResource(collectionResourceRel = "auths", path = "auths")
public interface AuthRepository
    extends PagingAndSortingRepository<Auth, Long> {}
