package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class LoginFailed extends AbstractEvent {

    private Long id;

    public LoginFailed(Auth aggregate) {
        super(aggregate);
    }

    public LoginFailed() {
        super();
    }
}
//>>> DDD / Domain Event
