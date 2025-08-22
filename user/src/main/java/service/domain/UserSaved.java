package service.domain;

import java.time.LocalDate;
import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

//<<< DDD / Domain Event
@Data
@ToString
public class UserSaved extends AbstractEvent {

    private Long userId;
    private String loginId;
    private String password;
    private String email;
    private Date createdAt;
    private String nickname;
    
    public UserSaved(User aggregate) {
        super(aggregate);
    }

    public UserSaved() {
        super();
    }
}
//>>> DDD / Domain Event
