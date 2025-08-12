package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class PasswordEdited extends AbstractEvent {

    private Long id;

    public PasswordEdited(Auth aggregate) {
        super(aggregate);
    }

    public PasswordEdited() {
        super();
    }
}
//>>> DDD / Domain Event
