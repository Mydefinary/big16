package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class UserDeleted extends AbstractEvent {

    private Long id;

    public UserDeleted(User aggregate) {
        super(aggregate);
    }

    public UserDeleted() {
        super();
    }
}
//>>> DDD / Domain Event
