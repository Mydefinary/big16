package service.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String loginId;
    private String password;
}