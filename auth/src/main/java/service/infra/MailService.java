package service.infra;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import io.github.cdimascio.dotenv.Dotenv;

import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;
    
    private static final Dotenv dotenv = Dotenv.load();
    private static final String FROM_EMAIL = dotenv.get("MAIL_FROM_ADDRESS", "noreply@yourapp.com");
    private static final String FROM_NAME = dotenv.get("MAIL_FROM_NAME", "인증서비스");

    public void sendVerificationEmail(String toEmail, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(FROM_EMAIL, FROM_NAME);
            helper.setTo(toEmail);
            helper.setSubject("이메일 인증 코드 안내");
            helper.setText("인증 코드는 " + code + " 입니다. 10분 이내에 입력해주세요.");
            
            mailSender.send(message);
            System.out.println("이메일 발송 완료: " + toEmail + " (코드: " + code + ")");
            
        } catch (Exception e) {
            System.err.println("이메일 발송 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // 간단한 버전 (한글 이름 문제 시 사용)
    public void sendVerificationEmailSimple(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(FROM_EMAIL);
        message.setTo(toEmail);
        message.setSubject("이메일 인증 코드 안내");
        message.setText("인증 코드는 " + code + " 입니다. 10분 이내에 입력해주세요.");

        try {
            mailSender.send(message);
            System.out.println("이메일 발송 완료: " + toEmail + " (코드: " + code + ")");
        } catch (Exception e) {
            System.err.println("이메일 발송 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}