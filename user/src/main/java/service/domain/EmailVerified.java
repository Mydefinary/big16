package service.domain;

import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

@Data
@ToString
public class EmailVerified extends AbstractEvent {

    private Long id;
}
