package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class PasswordSaved extends AbstractEvent {

    private Long id;

    public PasswordSaved(Auth aggregate) {
        super(aggregate);
    }

    public PasswordSaved() {
        super();
    }
}
//>>> DDD / Domain Event
