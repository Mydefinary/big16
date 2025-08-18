package service.domain;

import java.util.*;
import lombok.*;
import service.infra.AbstractEvent;

@Data
@ToString
public class UnverifiedAccountsDeleted extends AbstractEvent {
    
    private List<Long> userIds;
    private int deletedCount;
    
    public UnverifiedAccountsDeleted(List<Long> userIds) {
        super();
        this.userIds = userIds;
        this.deletedCount = userIds != null ? userIds.size() : 0;
    }
    
    public UnverifiedAccountsDeleted() {
        super();
    }
}