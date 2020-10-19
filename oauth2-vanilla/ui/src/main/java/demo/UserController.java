package demo;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
public class UserController {

    private final WebClient webClient;

    public UserController(WebClient webClient) {
        this.webClient = webClient;
    }

    @RequestMapping("/user")
    public Authentication user(Authentication user) {
        return user;
    }

    @RequestMapping("/resource")
    public Object resource() {
        return this.webClient.get()
            .uri("http://localhost:9000")
            .retrieve()
            .bodyToMono(Object.class)
            .block();
    }
}
