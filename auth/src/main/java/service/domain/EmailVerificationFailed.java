package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class EmailVerificationFailed extends AbstractEvent {

    private Long id;

    public EmailVerificationFailed(Auth aggregate) {
        super(aggregate);
    }

    public EmailVerificationFailed() {
        super();
    }
}
//>>> DDD / Domain Event
