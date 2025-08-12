package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class EmailNotFound extends AbstractEvent {

    private Long id;

    public EmailNotFound(User aggregate) {
        super(aggregate);
    }

    public EmailNotFound() {
        super();
    }
}
//>>> DDD / Domain Event
