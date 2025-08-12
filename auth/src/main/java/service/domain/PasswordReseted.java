package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class PasswordReseted extends AbstractEvent {

    private Long id;

    public PasswordReseted(Auth aggregate) {
        super(aggregate);
    }

    public PasswordReseted() {
        super();
    }
}
//>>> DDD / Domain Event
