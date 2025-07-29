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
@RequestMapping(value="/users")
@Transactional
public class UserController {

    @Autowired
    UserRepository userRepository;
    
    // 아이디 찾기 (아이디 반환 Policy를 통해 아이디를 넘겨줌)
    @GetMapping("/find-id")
    public ResponseEntity<?> findLoginIdByEmail(@RequestParam String email) {
        return userRepository.findByEmail(email)
            .map(user -> ResponseEntity.ok(user.getLoginId()))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("해당 이메일에 등록된 아이디가 없습니다."));
            //아이디 없으면 toast 처리하기위해 응답메시지를 보냄
    }
}
//>>> Clean Arch / Inbound Adaptor
