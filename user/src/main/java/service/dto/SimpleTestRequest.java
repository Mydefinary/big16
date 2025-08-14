package service.dto;

public class SimpleTestRequest {
    private String name;
    private String email;
    
    // 기본 생성자
    public SimpleTestRequest() {}
    
    // Getter/Setter
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    @Override
    public String toString() {
        return "SimpleTestRequest{name='" + name + "', email='" + email + "'}";
    }
}