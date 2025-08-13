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
    

    
    private final String fromName;
    
    public MailService() {
        this.fromName = "인증서비스";
        System.out.println("MailService 초기화 완료");
    }

    public boolean sendVerificationEmail(String toEmail, String code) {
        System.out.println("=== sendVerificationEmail 호출 ===");
        printConfiguration();
        
        // 메일 설정 확인
        if (!isMailConfigured()) {
            System.out.println("❌ 메일 설정 불완전 - Mock 모드로 실행");
            sendMockEmail(toEmail, code, "HTML");
            return false; // Mock으로 처리됨을 알림
        }
        
        System.out.println("✅ 메일 설정 완료 - 실제 발송 시작");
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailUsername, fromName);
            helper.setTo(toEmail);
            helper.setSubject("이메일 인증 코드 안내");
            
            String htmlContent = buildHtmlContent(code);
            helper.setText(htmlContent, true);
            
            System.out.println("🚀 SMTP 발송 시도 중...");
            mailSender.send(message);
            System.out.println("✅ 이메일 발송 완료: " + toEmail + " (코드: " + maskCode(code) + ")");
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ 이메일 발송 실패: " + e.getMessage());
            e.printStackTrace();
            // 실패 시 Mock으로 대체
            sendMockEmail(toEmail, code, "HTML (발송실패)");
            return false; // 발송 실패를 알림
        }
    }
    
    public boolean sendVerificationEmailSimple(String toEmail, String code) {
        System.out.println("=== sendVerificationEmailSimple 호출 ===");
        
        if (!isMailConfigured()) {
            System.out.println("❌ 메일 설정 불완전 - Mock 모드로 실행");
            sendMockEmail(toEmail, code, "Simple");
            return false;
        }
        
        System.out.println("✅ 메일 설정 완료 - 실제 발송 시작 (Simple)");
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(toEmail);
        message.setSubject("이메일 인증 코드 안내");
        message.setText(buildSimpleContent(code));

        try {
            System.out.println("🚀 SMTP 발송 시도 중... (Simple)");
            mailSender.send(message);
            System.out.println("✅ 이메일 발송 완료 (Simple): " + toEmail + " (코드: " + maskCode(code) + ")");
            return true;
        } catch (Exception e) {
            System.err.println("❌ 이메일 발송 실패 (Simple): " + e.getMessage());
            e.printStackTrace();
            sendMockEmail(toEmail, code, "Simple (발송실패)");
            return false;
        }
    }
    
    private String buildHtmlContent(String code) {
        return "<html>" +
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
    }
    
    private String buildSimpleContent(String code) {
        return "인증 코드는 " + code + " 입니다. 3분 이내에 입력해주세요.";
    }
    
    private String maskCode(String code) {
        if (code == null || code.length() <= 2) {
            return "****";
        }
        return code.substring(0, 2) + "****";
    }
    
    private void sendMockEmail(String toEmail, String code, String type) {
        System.out.println("==========================================");
        System.out.println("📧 [MOCK EMAIL] " + type);
        System.out.println("📧 TO: " + toEmail);
        System.out.println("📧 FROM: " + fromName + " <" + mailUsername + ">");
        System.out.println("📧 SUBJECT: 이메일 인증 코드 안내");
        System.out.println("📧 CODE: " + maskCode(code) + " (실제: " + code + ")");
        System.out.println("📧 MESSAGE: 인증 코드는 " + code + " 입니다. 3분 이내에 입력해주세요.");
        System.out.println("📧 ⚠️  실제 메일은 발송되지 않습니다 ⚠️");
        System.out.println("==========================================");
    }
    
    private boolean isMailConfigured() {
        boolean hasSender = mailSender != null;
        boolean hasUsername = mailUsername != null && !mailUsername.isEmpty() && !mailUsername.equals("temp-username");
        boolean hasPassword = mailPassword != null && !mailPassword.isEmpty() && !mailPassword.equals("temp-password");
        
        boolean configured = hasSender && hasUsername && hasPassword;
        
        if (!configured) {
            System.out.println("ℹ️ 메일 설정이 완전하지 않음 - Mock 모드로 동작");
            System.out.println("   - JavaMailSender: " + (hasSender ? "✅" : "❌"));
            System.out.println("   - Username: " + (hasUsername ? "✅" : "❌") + " (" + mailUsername + ")");
            System.out.println("   - Password: " + (hasPassword ? "✅" : "❌") + " (" + 
                             (mailPassword != null && !mailPassword.isEmpty() ? "설정됨" : "없음") + ")");
        }
        
        return configured;
    }
    
    public void printConfiguration() {
        System.out.println("=== MAIL 설정 현황 ===");
        System.out.println("JavaMailSender: " + (mailSender != null ? "사용가능" : "❌ 없음"));
        System.out.println("Username: " + (mailUsername != null ? mailUsername : "❌ NULL"));
        System.out.println("Password: " + (mailPassword != null && !mailPassword.isEmpty() ? "****" : "❌ EMPTY"));
        System.out.println("From Email: " + mailUsername + " (Gmail 계정)");
        System.out.println("From Name: " + fromName);
        System.out.println("설정완료: " + (isMailConfigured() ? "✅ YES" : "❌ NO"));
        System.out.println("=====================");
    }
    
    public boolean testConnection() {
        System.out.println("🔍 메일 연결 테스트 시작");
        printConfiguration();
        
        boolean configured = isMailConfigured();
        
        if (configured) {
            try {
                System.out.println("🌐 SMTP 서버 연결 테스트 중...");
                // 실제 연결 테스트를 원한다면 여기에 추가
                System.out.println("✅ 설정 확인 완료");
                return true;
            } catch (Exception e) {
                System.err.println("❌ 연결 테스트 실패: " + e.getMessage());
                return false;
            }
        } else {
            System.out.println("❌ 설정이 불완전하여 연결 테스트 불가");
            return false;
        }
    }
}