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
    private String email;
    // 이메일 인증을 위한 필드
    private String emailVerificationCode;
    private String purpose;

    public EmailVerificationRequested(Auth aggregate) {
        super(aggregate);
    }

    public EmailVerificationRequested() {
        super();
    }
}
//>>> DDD / Domain Event
