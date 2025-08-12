package service.dto;

import lombok.Data;

@Data
public class LoginCommand {
    private String loginId;
    private String password;
}