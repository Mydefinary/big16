package service.infra;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("인증 코드 안내");
        message.setText("인증 코드는 " + code + " 입니다. 10분 이내에 입력해주세요.");

        mailSender.send(message);
    }
}
