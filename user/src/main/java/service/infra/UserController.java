package service.infra;

import service.dto.UserRegisterRequest;

import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.domain.*;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Date;


//<<< Clean Arch / Inbound Adaptor

@RestController
@RequestMapping(value="/users")
@Transactional
public class UserController {

    @Autowired
    UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegisterRequest request) {
        // 1) 중복 아이디/이메일 체크 (필요 시)
        if(userRepository.findByLoginId(request.getLoginId()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 존재하는 로그인 아이디입니다.");
        }
        if(userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 존재하는 이메일입니다.");
        }

        // 2) User 엔티티 생성 및 저장
        User user = new User();
        user.setLoginId(request.getLoginId());
        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());
        user.setStatus("TRY_TO_REGISTERED"); // 가입 후 이메일 인증 대기 상태
        user.setCreatedAt(new Date());
        userRepository.save(user);

        // 3) 비밀번호 저장 등 Auth BC와 연동 (이벤트 발행 또는 직접 호출)
        // User 저장이 완료된 후에 이벤트를 발행하여 Auth BC로 비밀번호 정보 전달
        UserSaved userSavedEvent = new UserSaved(user);
        // 비밀번호는 반드시 암호화된 상태로 포함시켜야 함
        userSavedEvent.setPassword(encryptPassword(request.getPassword())); 
        // 트랜잭션 커밋 후 이벤트 발행
        userSavedEvent.publishAfterCommit();

        // 4) 응답 반환
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다. 이메일 인증을 진행해 주세요");
    }

    // 비밀번호 암호화 예시 메서드 (구현 필요)
    private String encryptPassword(String rawPassword) {
        // BCrypt, Argon2 등 암호화 라이브러리를 사용하세요
        return BCrypt.hashpw(rawPassword, BCrypt.gensalt());
    }

    
    // 아이디 찾기 (아이디 반환 Policy를 통해 아이디를 넘겨줌)
    @GetMapping("/find-id")
    public ResponseEntity<?> findLoginIdByEmail(@RequestParam String email) {
        return userRepository.findByEmail(email)
            .map(user -> ResponseEntity.ok(user.getLoginId()))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("해당 이메일에 등록된 아이디가 없습니다."));
            //아이디 없으면 toast 처리하기위해 응답메시지를 보냄
    }

    // 이메일 존재 여부 확인 → Event 발행
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailExistence(@RequestParam String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            // User user = userOpt.get();
            // EmailExistsConfirmed event = new EmailExistsConfirmed();
            // event.setUserId(user.getUserId());
            // event.setEmail(user.getEmail());
            // // publishAfterCommit()을 하지 않는 이유
            // // 어차피 DB 저장같이 트랜젝션이 필요한 작업이 아니라
            // // 바로 이벤트를 발행해도 됨!
            // event.publish();
            userOpt.get().publishEmailExistsConfirmed(); // ← 이 메서드를 User 안에 정의
            return ResponseEntity.ok("이메일이 존재합니다.");
        } else {
            // EmailNotFound 이벤트는 User에서 따로 처리할
            // 작업이 없어서 그냥 명시만 하는 느낌으로 사용
            // 아래의 주석을 풀든 안풀든 상관 없을 듯
            // EmailNotFound event = new EmailNotFound();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("이메일을 찾을 수 없습니다.");
        }
    }

    // 회원탈퇴 로직 아직 JWT 토큰 관련 수정을 진행하지 않아서 사용x
    @PatchMapping("/deactivate")
    public ResponseEntity<?> deactivateUser(@RequestHeader("X-User-Id") Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("사용자를 찾을 수 없습니다.");
        }

        User user = userOpt.get();
        user.setStatus("DELETED");
        userRepository.save(user);

        user.Withdrawal();

        return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
    }
}
//>>> Clean Arch / Inbound Adaptor
