package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class EmailVerificationRequested extends AbstractEvent {

    private Long id;

    public EmailVerificationRequested(Auth aggregate) {
        super(aggregate);
    }

    public EmailVerificationRequested() {
        super();
    }
}
//>>> DDD / Domain Event
