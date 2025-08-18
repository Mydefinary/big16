package service.domain;

import java.util.*;
import lombok.*;
import service.infra.AbstractEvent;

@Data
@ToString
public class UnverifiedAccountsDeleted extends AbstractEvent {
    
    private List<Long> userIds;
    private int deletedCount;
}