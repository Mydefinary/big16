package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class RegisterCompany extends AbstractEvent {

    private Long userId;
    private String company;

    public RegisterCompany(Auth aggregate, String company) {
        super(aggregate);
        this.company=company;
    }

    public RegisterCompany(Auth aggregate) {
        super(aggregate);
    }

    public RegisterCompany() {
        super();
    }
}
//>>> DDD / Domain Event
