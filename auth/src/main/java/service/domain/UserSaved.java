package service.domain;

import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

@Data
@ToString
public class UserSaved extends AbstractEvent {

    private Long userId;
    private String loginId;
    private String password;
    private String email;
    private Date createdAt;
    private String nickname;
    private String role;
}
