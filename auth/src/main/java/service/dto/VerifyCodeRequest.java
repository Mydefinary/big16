package service.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
    private String code;
}