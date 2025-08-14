// UserRegisterRequest.java
package service.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class UserRegisterRequest {
    @JsonProperty("loginId")
    private String loginId;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("nickname")
    private String nickname;
    
    @JsonProperty("password")
    private String password;
    
    @Override
    public String toString() {
        return "UserRegisterRequest{" +
                "loginId='" + loginId + '\'' +
                ", email='" + email + '\'' +
                ", nickname='" + nickname + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
