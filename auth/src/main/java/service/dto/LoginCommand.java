package service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginCommand {
    @JsonProperty("loginId")
    private String loginId;
    
    @JsonProperty("password")
    private String password;
    
    // 기본 생성자 (Jackson용)
    public LoginCommand() {}
    
    // Jackson Creator 생성자
    @JsonCreator
    public LoginCommand(@JsonProperty("loginId") String loginId, 
                       @JsonProperty("password") String password) {
        this.loginId = loginId;
        this.password = password;
    }
    
    // Getter/Setter
    public String getLoginId() {
        return loginId;
    }
    
    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    @Override
    public String toString() {
        return "LoginCommand{loginId='" + loginId + "', password='[PROTECTED]'}";
    }
}