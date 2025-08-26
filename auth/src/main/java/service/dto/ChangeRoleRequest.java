package service.dto;

import lombok.Data;

@Data
public class ChangeRoleRequest {
    private Long targetUserId;
    private String newRole;
}