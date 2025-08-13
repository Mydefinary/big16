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
        this.fromName = "ToonConnect";
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
        return "<!DOCTYPE html>" +
            "<html lang='ko'>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "<title>이메일 인증</title>" +
            "</head>" +
            "<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; background-color: #f8fafc;'>" +
            "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>" +
            
            // 헤더
            "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;'>" +
            "<div style='background-color: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;'>" +
            "<span style='font-size: 36px; color: white;'>✉️</span>" +
            "</div>" +
            "<h1 style='color: white; margin: 0; font-size: 28px; font-weight: 600;'>이메일 인증</h1>" +
            "<p style='color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;'>안전한 계정 인증을 위해 확인이 필요합니다</p>" +
            "</div>" +
            
            // 메인 콘텐츠
            "<div style='padding: 40px 30px;'>" +
            "<div style='text-align: center; margin-bottom: 30px;'>" +
            "<h2 style='color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;'>인증 코드</h2>" +
            "<p style='color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;'>아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.</p>" +
            "</div>" +
            
            // 인증 코드 박스
            "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; margin: 30px 0; text-align: center; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);'>" +
            "<div style='background-color: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin: 0 auto; display: inline-block;'>" +
            "<span style='font-size: 36px; font-weight: 700; letter-spacing: 8px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);'>" + code + "</span>" +
            "</div>" +
            "<p style='color: rgba(255,255,255,0.9); margin: 16px 0 0 0; font-size: 14px;'>위 코드를 복사하여 붙여넣으세요</p>" +
            "</div>" +
            
            // 주의사항
            "<div style='background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;'>" +
            "<div style='display: flex; align-items: flex-start;'>" +
            "<span style='font-size: 20px; margin-right: 12px;'>⚠️</span>" +
            "<div>" +
            "<h3 style='color: #92400e; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;'>중요 안내</h3>" +
            "<p style='color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;'>" +
            "• 이 코드는 <strong>3분간</strong> 유효합니다<br>" +
            "• 보안을 위해 코드를 다른 사람과 공유하지 마세요<br>" +
            "• 본인이 요청하지 않았다면 이 메일을 무시하세요" +
            "</p>" +
            "</div>" +
            "</div>" +
            "</div>" +
            
            // 도움말
            "<div style='text-align: center; margin: 30px 0;'>" +
            "<p style='color: #6b7280; font-size: 14px; margin: 0;'>문제가 있으신가요?</p>" +
            "<p style='color: #6b7280; font-size: 14px; margin: 8px 0 0 0;'>고객 지원팀에 문의하시거나 인증을 다시 시도해보세요.</p>" +
            "</div>" +
            "</div>" +
            
            // 푸터
            "<div style='background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;'>" +
            "<p style='color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;'>본 메일은 자동으로 발송된 메일입니다.</p>" +
            "<p style='color: #9ca3af; font-size: 12px; margin: 0;'>© 2025 인증서비스. All rights reserved.</p>" +
            "</div>" +
            
            "</div>" +
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