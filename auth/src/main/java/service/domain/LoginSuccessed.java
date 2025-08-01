package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class LoginSuccessed extends AbstractEvent {

    private Long authId;
    private String accessToken;

    public LoginSuccessed(Auth aggregate, String accessToken) {
        super(aggregate);
        this.accessToken = accessToken;
    }

    public LoginSuccessed(Auth aggregate) {
        super(aggregate);
    }

    public LoginSuccessed() {
        super();
    }
}
//>>> DDD / Domain Event
