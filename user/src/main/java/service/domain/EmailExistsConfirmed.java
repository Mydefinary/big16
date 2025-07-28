package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class EmailExistsConfirmed extends AbstractEvent {

    private Long userId;
    private String email;

    public EmailExistsConfirmed(User aggregate) {
        super(aggregate);
    }

    public EmailExistsConfirmed() {
        super();
    }
}
//>>> DDD / Domain Event
