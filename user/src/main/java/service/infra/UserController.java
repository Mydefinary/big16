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
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//<<< Clean Arch / Inbound Adaptor

@RestController
@RequestMapping(value="/users")
@Transactional
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegisterRequest request, HttpServletRequest httpRequest) {
        try {
            // 1) 중복 아이디/이메일 체크 (필요 시)
            if(userRepository.findByLoginId(request.getLoginId()).isPresent()) {
                logger.warn("중복 아이디 가입 시도 - LoginId: {}, IP: {}", request.getLoginId(), getClientIpAddress(httpRequest));
                return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 존재하는 로그인 아이디입니다.");
            }
            if(userRepository.findByEmail(request.getEmail()).isPresent()) {
                logger.warn("중복 이메일 가입 시도 - Email: {}, IP: {}", request.getEmail(), getClientIpAddress(httpRequest));
                return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 존재하는 이메일입니다.");
            }

            // 2) User 엔티티 생성 및 저장
            User user = new User();
            user.setLoginId(request.getLoginId());
            user.setEmail(request.getEmail());
            user.setNickname(request.getNickname());
            user.setStatus("TRY_TO_REGISTERED"); // 가입 후 이메일 인증 대기 상태
            user.setRole("user");
            user.setCreatedAt(new Date());
            userRepository.save(user);

            // 3) 비밀번호 저장 등 Auth BC와 연동 (이벤트 발행 또는 직접 호출)
            // User 저장이 완료된 후에 이벤트를 발행하여 Auth BC로 비밀번호 정보 전달
            UserSaved userSavedEvent = new UserSaved(user);
            // 비밀번호는 반드시 암호화된 상태로 포함시켜야 함
            userSavedEvent.setPassword(encryptPassword(request.getPassword())); 
            // 트랜잭션 커밋 후 이벤트 발행
            userSavedEvent.publishAfterCommit();

            logger.info("회원가입 성공 - LoginId: {}, IP: {}", request.getLoginId(), getClientIpAddress(httpRequest));

            // 4) 응답 반환
            return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다. 이메일 인증을 진행해 주세요");
            
        } catch (Exception e) {
            logger.error("회원가입 처리 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원가입 중 오류가 발생했습니다.");
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
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isPresent()) {
                logger.info("아이디 찾기 성공");
                return ResponseEntity.ok(userOpt.get().getLoginId());
            } else {
                logger.warn("아이디 찾기 실패 - 존재하지 않는 이메일");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("해당 이메일에 등록된 아이디가 없습니다.");
            }
            
        } catch (Exception e) {
            logger.error("아이디 찾기 처리 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("아이디 찾기 중 오류가 발생했습니다.");
        }
    }

    // 이메일 존재 여부 확인 → Event 발행
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailExistence(@RequestParam String email) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isPresent()) {
                userOpt.get().publishEmailExistsConfirmed(); // ← 이 메서드를 User 안에 정의
                logger.info("이메일 존재 확인 완료");
                return ResponseEntity.ok("이메일이 존재합니다.");
            } else {
                logger.warn("이메일 존재하지 않음");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("이메일을 찾을 수 없습니다.");
            }
            
        } catch (Exception e) {
            logger.error("이메일 존재 여부 확인 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("이메일 확인 중 오류가 발생했습니다.");
        }
    }

    @PatchMapping("/deactivate")
    public ResponseEntity<?> deactivateUser(@RequestHeader("X-User-Id") Long userId, HttpServletRequest request) {
        try {
            logger.info("회원탈퇴 요청 - 사용자 ID: {}, IP: {}", userId, getClientIpAddress(request));
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.warn("탈퇴 요청한 사용자를 찾을 수 없음 - 사용자 ID: {}, IP: {}", userId, getClientIpAddress(request));
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자를 찾을 수 없습니다.");
            }

            User user = userOpt.get();
            logger.info("사용자 탈퇴 처리 시작 - 사용자 ID: {}", userId);
            
            // 탈퇴 이벤트 발행 (삭제 전에 먼저 실행)
            user.Withdrawal();
            
            // 실제 사용자 데이터 삭제
            userRepository.delete(user);
            
            logger.info("회원탈퇴 완료 - 사용자 ID: {}", userId);
            return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
            
        } catch (Exception e) {
            logger.error("회원 탈퇴 처리 중 오류 발생 - 사용자 ID: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원 탈퇴 중 오류가 발생했습니다.");
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        try {
            logger.info("전체 사용자 목록 조회 요청");
            
            List<User> allUsers = userRepository.findAll();
            
            List<Map<String, Object>> userList = allUsers.stream()
                    .map(user -> {
                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("userId", user.getUserId());
                        userInfo.put("email", user.getEmail());
                        userInfo.put("nickname", user.getNickname());
                        userInfo.put("role", user.getRole());
                        userInfo.put("createdAt", user.getCreatedAt());
                        userInfo.put("company", user.getCompany());
                        return userInfo;
                    })
                    .collect(Collectors.toList());
            
            logger.info("전체 사용자 목록 조회 완료 - 사용자 수: {}", userList.size());
            
            return ResponseEntity.ok(userList);
            
        } catch (Exception e) {
            logger.error("사용자 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("사용자 목록 조회 중 오류가 발생했습니다.");
        }
    }

    // 클라이언트 IP 주소를 안전하게 가져오는 헬퍼 메서드
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
//>>> Clean Arch / Inbound Adaptor