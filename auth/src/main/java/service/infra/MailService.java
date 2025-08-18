package service.infra;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

import javax.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

@Service
public class MailService {

    @Autowired(required = false)  // JavaMailSender가 없어도 서비스 생성 가능
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username:}")
    private String mailUsername;
    
    @Value("${spring.mail.password:}")
    private String mailPassword;
    
    private final String fromEmail;
    private final String fromName;
    
    public MailService() {
        // 환경변수에서 직접 읽기 (Azure 환경 호환)
        String tempFromEmail = System.getenv("MAIL_FROM_ADDRESS");
        String tempFromName = System.getenv("MAIL_FROM_NAME");
        
        // 기본값 설정
        if (tempFromEmail == null || tempFromEmail.isEmpty()) {
            tempFromEmail = "noreply@toonconnect.com";
        }
        if (tempFromName == null || tempFromName.isEmpty()) {
            tempFromName = "ToonConnect 인증서비스";
        }
        
        this.fromEmail = tempFromEmail;
        this.fromName = tempFromName;
        
        System.out.println("MailService 초기화 완료 - FROM: " + tempFromEmail);
    }

    public void sendVerificationEmail(String toEmail, String code) {
        // 현재 메일 설정이 불완전하므로 항상 Mock으로 처리
        System.out.println("🔧 이메일 발송 요청 수신 - Mock 모드로 처리");
        sendMockEmail(toEmail, code, "HTML-Mock");
        return;
        
        // 실제 메일 발송은 나중에 활성화 예정
        /*
        // 메일 설정 확인
        if (!isMailConfigured()) {
            sendMockEmail(toEmail, code, "HTML");
            return;
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("이메일 인증 코드 안내");
            
            // HTML 형식으로 변경 (Java 8 호환)
            String htmlContent = "<html>" +
                "<body>" +
                "<h2>이메일 인증 코드</h2>" +
                "<p>안녕하세요!</p>" +
                "<p>요청하신 이메일 인증 코드는 다음과 같습니다:</p>" +
                "<h3 style=\"color: #007bff; font-size: 24px; letter-spacing: 2px;\">" + code + "</h3>" +
                "<p>이 코드는 <strong>3분</strong> 내에 입력해주세요.</p>" +
                "<p>미입력 시 계정이 만료됩니다</p>" + 
                "<hr>" +
                "<p style=\"font-size: 12px; color: #666;\">본 메일은 자동 발송되는 메일입니다.</p>" +
                "</body>" +
                "</html>";
            
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            System.out.println("✅ 이메일 발송 완료: " + toEmail + " (코드: " + code + ")");
            
        } catch (Exception e) {
            System.err.println("❌ 이메일 발송 실패: " + e.getMessage());
            e.printStackTrace();
            // 실패 시 Mock으로 대체
            sendMockEmail(toEmail, code, "HTML (발송실패)");
        }
        */
    }
    
    // 간단한 버전
    public void sendVerificationEmailSimple(String toEmail, String code) {
        System.out.println("🔧 Simple 이메일 발송 요청 - Mock 모드로 처리");
        sendMockEmail(toEmail, code, "Simple-Mock");
        return;
        
        // 실제 메일 발송은 나중에 활성화 예정
        /*
        if (!isMailConfigured()) {
            sendMockEmail(toEmail, code, "Simple");
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("이메일 인증 코드 안내");
        message.setText("인증 코드는 " + code + " 입니다. 10분 이내에 입력해주세요.");

        try {
            mailSender.send(message);
            System.out.println("✅ 이메일 발송 완료 (Simple): " + toEmail + " (코드: " + code + ")");
        } catch (Exception e) {
            System.err.println("❌ 이메일 발송 실패 (Simple): " + e.getMessage());
            e.printStackTrace();
            sendMockEmail(toEmail, code, "Simple (발송실패)");
        }
        */
    }
    
    // Mock 이메일 (실제 발송 안함)
    private void sendMockEmail(String toEmail, String code, String type) {
        System.out.println("==========================================");
        System.out.println("📧 [MOCK EMAIL] " + type);
        System.out.println("📧 TO: " + toEmail);
        System.out.println("📧 FROM: " + fromName + " <" + fromEmail + ">");
        System.out.println("📧 SUBJECT: 이메일 인증 코드 안내");
        System.out.println("📧 CODE: " + code);
        System.out.println("📧 MESSAGE: 인증 코드는 " + code + " 입니다. 10분 이내에 입력해주세요.");
        System.out.println("📧 실제 메일은 발송되지 않습니다");
        System.out.println("==========================================");
    }
    
    // 메일 설정 확인
    private boolean isMailConfigured() {
        boolean configured = mailSender != null && 
                           mailUsername != null && !mailUsername.isEmpty() && 
                           !mailUsername.equals("temp-username") &&
                           mailPassword != null && !mailPassword.isEmpty() && 
                           !mailPassword.equals("temp-password");
        
        if (!configured) {
            System.out.println("ℹ️ 메일 설정이 완전하지 않음 - Mock 모드로 동작");
            System.out.println("   Username: " + mailUsername + " / Password: " + 
                             (mailPassword != null && !mailPassword.isEmpty() ? "설정됨" : "없음"));
        }
        
        return configured;
    }
    
    // 설정 상태 확인
    public void printConfiguration() {
        System.out.println("=== MAIL 설정 현황 ===");
        System.out.println("JavaMailSender: " + (mailSender != null ? "사용가능" : "없음"));
        System.out.println("Username: " + mailUsername);
        System.out.println("Password: " + (mailPassword != null && !mailPassword.isEmpty() ? "****" : "EMPTY"));
        System.out.println("From Email: " + fromEmail);
        System.out.println("From Name: " + fromName);
        System.out.println("설정완료: " + isMailConfigured());
        System.out.println("=====================");
    }
    
    // 연결 테스트
    public boolean testConnection() {
        printConfiguration();
        return isMailConfigured();
    }
}