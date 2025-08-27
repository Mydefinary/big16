package service.domain;

import java.util.*;
import lombok.*;
import service.domain.*;
import service.infra.AbstractEvent;

@Data
@ToString
public class RegisterCompany extends AbstractEvent {

    private Long userId;
    private String company;
}
