package service.dto;

import lombok.Data;

@Data
public class VerifyCodeRequest {
    private String email;
    private String code;
}