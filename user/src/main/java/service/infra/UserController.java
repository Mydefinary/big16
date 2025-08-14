// UserController.java

package service.infra;

import service.dto.UserRegisterRequest;
import service.dto.SimpleTestRequest;

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
import java.util.HashMap;
import java.util.Map;
import java.time.Instant;


//<<< Clean Arch / Inbound Adaptor

@RestController
@RequestMapping(value="/users")
@Transactional
public class UserController {

    @Autowired
    UserRepository userRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "user-service");
        status.put("timestamp", Instant.now().toString());
        
        // 데이터베이스 연결 확인
        try {
            long userCount = userRepository.count();
            status.put("database", "CONNECTED");
            status.put("userCount", String.valueOf(userCount));
        } catch (Exception e) {
            status.put("database", "ERROR: " + e.getMessage());
        }
        
        return ResponseEntity.ok(status);
    }

    @PostMapping("/test-json")
    public ResponseEntity<?> testJson(@RequestBody(required = false) SimpleTestRequest request) {
        System.out.println("=== 간단한 JSON 테스트 ===");
        System.out.println("Request Object: " + request);
        if (request != null) {
            System.out.println("Name: " + request.getName());
            System.out.println("Email: " + request.getEmail());
        }
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "JSON parsing test completed",
            "received", request != null ? request.toString() : "null"
        ));
    }
    
    @PostMapping("/test-complex")
    public ResponseEntity<?> testComplexJson(@RequestBody(required = false) UserRegisterRequest request) {
        System.out.println("=== 복잡한 JSON 테스트 ===");
        System.out.println("Request Object: " + request);
        if (request != null) {
            System.out.println("LoginId: " + request.getLoginId());
            System.out.println("Email: " + request.getEmail());
            System.out.println("Nickname: " + request.getNickname());
            System.out.println("Password: " + (request.getPassword() != null ? "[SET]" : "[NULL]"));
        }
        return ResponseEntity.ok(Map.of(
            "status", "success", 
            "message", "Complex JSON parsing test completed",
            "received", request != null ? request.toString() : "null"
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody(required = false) UserRegisterRequest request, 
                                         HttpServletRequest httpRequest) {
        System.out.println("=== 회원가입 요청 시작 ===");
        System.out.println("Request Method: " + httpRequest.getMethod());
        System.out.println("Request URL: " + httpRequest.getRequestURL());
        System.out.println("Content Type: " + httpRequest.getContentType());
        System.out.println("Content Length: " + httpRequest.getContentLength());
        
        // 헤더 정보 상세 확인
        System.out.println("Accept Header: " + httpRequest.getHeader("Accept"));
        System.out.println("User-Agent: " + httpRequest.getHeader("User-Agent"));
        System.out.println("Origin: " + httpRequest.getHeader("Origin"));
        
        System.out.println("Request Body Object: " + request);
        System.out.println("Request Object Class: " + (request != null ? request.getClass().getName() : "null"));
        
        try {
            // 1) 입력 값 검증
            if (request == null) {
                System.out.println("ERROR: request is null - RequestBody parsing failed");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 데이터가 없습니다. JSON 형식을 확인해주세요.");
            }
            
            if (request.getLoginId() == null || request.getLoginId().trim().isEmpty()) {
                System.out.println("ERROR: loginId is empty");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("로그인 아이디를 입력해주세요.");
            }
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("이메일을 입력해주세요.");
            }
            if (request.getNickname() == null || request.getNickname().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("닉네임을 입력해주세요.");
            }
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("비밀번호를 입력해주세요.");
            }

            // 2) 중복 아이디/이메일 체크 (필요 시)
            if(userRepository.findByLoginId(request.getLoginId()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 존재하는 로그인 아이디입니다.");
            }
            if(userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 존재하는 이메일입니다.");
            }

            // 3) User 엔티티 생성 및 저장
            User user = new User();
            user.setLoginId(request.getLoginId().trim());
            user.setEmail(request.getEmail().trim());
            user.setNickname(request.getNickname().trim());
            user.setStatus("TRY_TO_REGISTERED"); // 가입 후 이메일 인증 대기 상태
            user.setCreatedAt(new Date());
            userRepository.save(user);

            // 4) 비밀번호 저장 등 Auth BC와 연동 (이벤트 발행 또는 직접 호출)
            // User 저장이 완료된 후에 이벤트를 발행하여 Auth BC로 비밀번호 정보 전달
            UserSaved userSavedEvent = new UserSaved(user);
            // 비밀번호는 반드시 암호화된 상태로 포함시켜야 함
            userSavedEvent.setPassword(encryptPassword(request.getPassword())); 
            // 트랜잭션 커밋 후 이벤트 발행
            userSavedEvent.publishAfterCommit();

            // 5) 응답 반환
            return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다. 이메일 인증을 진행해 주세요");
        } catch (Exception e) {
            // 상세한 로그 출력
            System.err.println("=== 회원가입 처리 중 오류 발생 ===");
            System.err.println("오류 메시지: " + e.getMessage());
            System.err.println("오류 클래스: " + e.getClass().getName());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원가입 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
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
