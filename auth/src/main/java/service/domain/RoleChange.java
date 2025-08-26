package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class RoleChange extends AbstractEvent {

    private Long userId;
    private String role;

    public RoleChange(Auth aggregate) {
        super(aggregate);
    }

    public RoleChange() {
        super();
    }
}
//>>> DDD / Domain Event
