package service.dto;

import lombok.Data;

@Data
public class UserRegisterRequest {
    private String loginId;
    private String email;
    private String nickname;
    private String password;
}
