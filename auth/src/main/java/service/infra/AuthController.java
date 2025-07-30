package service.infra;

import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.domain.*;

//<<< Clean Arch / Inbound Adaptor

@RestController
@RequestMapping(value="/auths")
@Transactional
public class AuthController {

    @Autowired
    AuthRepository authRepository;

    @PatchMapping("/user/password-change")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getId();

        Auth auth = authRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!BCrypt.checkpw(request.getCurrentPassword(), auth.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Current password incorrect");
        }

        auth.setPasswordHash(BCrypt.hashpw(request.getNewPassword(), BCrypt.gensalt()));
        authRepository.save(auth);

        return ResponseEntity.ok("Password changed successfully");
    }
}
//>>> Clean Arch / Inbound Adaptor
