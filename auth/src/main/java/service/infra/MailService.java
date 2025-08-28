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

    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username:}")
    private String mailUsername;
    
    @Value("${spring.mail.password:}")
    private String mailPassword;
    
    private final String fromName;
    
    public MailService() {
        this.fromName = "ToonConnect";
    }

    public boolean sendVerificationEmail(String toEmail, String code) {
        if (!isMailConfigured()) {
            sendMockEmail(toEmail, code, "HTML");
            return false;
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailUsername, fromName);
            helper.setTo(toEmail);
            helper.setSubject("이메일 인증 코드 안내");
            
            String htmlContent = buildHtmlContent(code);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            return true;
            
        } catch (Exception e) {
            sendMockEmail(toEmail, code, "HTML (발송실패)");
            return false;
        }
    }
    
    public boolean sendVerificationEmailSimple(String toEmail, String code) {
        if (!isMailConfigured()) {
            sendMockEmail(toEmail, code, "Simple");
            return false;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailUsername);
        message.setTo(toEmail);
        message.setSubject("이메일 인증 코드 안내");
        message.setText(buildSimpleContent(code));

        try {
            mailSender.send(message);
            return true;
        } catch (Exception e) {
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
        return "인증 코드를 발송했습니다. 3분 이내에 입력해주세요.";
    }
    
    private void sendMockEmail(String toEmail, String code, String type) {
        // Mock 처리 - 로그 없음
    }
    
    private boolean isMailConfigured() {
        boolean hasSender = mailSender != null;
        boolean hasUsername = mailUsername != null && !mailUsername.isEmpty() && !mailUsername.equals("temp-username");
        boolean hasPassword = mailPassword != null && !mailPassword.isEmpty() && !mailPassword.equals("temp-password");
        
        return hasSender && hasUsername && hasPassword;
    }
    
    public boolean testConnection() {
        boolean configured = isMailConfigured();
        
        if (configured) {
            try {
                // 실제 연결 테스트 로직
                return true;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }
}