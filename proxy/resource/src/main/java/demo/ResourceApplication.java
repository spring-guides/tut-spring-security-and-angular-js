package demo;

import java.util.UUID;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class ResourceApplication {

	@RequestMapping("/")
	public Message home() {
		return new Message("Hello World");
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http.httpBasic(httpBasic -> httpBasic.disable());
		http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.NEVER));
		http.authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated());
		return http.build();
	}

	public static void main(String[] args) {
		SpringApplication.run(ResourceApplication.class, args);
	}

}

class Message {
	private String id = UUID.randomUUID().toString();
	private String content;

	Message() {
	}

	public Message(String content) {
		this.content = content;
	}

	public String getId() {
		return id;
	}

	public String getContent() {
		return content;
	}
}
