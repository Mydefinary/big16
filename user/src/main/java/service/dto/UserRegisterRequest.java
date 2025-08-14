// UserRegisterRequest.java
package service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserRegisterRequest {
    @JsonProperty("loginId")
    private String loginId;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("nickname")
    private String nickname;
    
    @JsonProperty("password")
    private String password;
    
    // 기본 생성자
    public UserRegisterRequest() {}
    
    // Getter/Setter
    public String getLoginId() {
        return loginId;
    }
    
    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
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
