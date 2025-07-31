package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class EmailVerified extends AbstractEvent {

    private Long id;

    private Long userId;

    Private String purpose;

    public EmailVerified(Auth aggregate) {
        super(aggregate);
    }

    public EmailVerified() {
        super();
    }
}
//>>> DDD / Domain Event
