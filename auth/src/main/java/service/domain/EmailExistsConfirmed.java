package service.domain;

import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

@Data
@ToString
public class EmailExistsConfirmed extends AbstractEvent {

    private Long userId;
    private String email;
}
