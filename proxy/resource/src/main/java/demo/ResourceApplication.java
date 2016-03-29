package demo;

import java.util.UUID;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.HeaderHttpSessionStrategy;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
@EnableRedisHttpSession
public class ResourceApplication {

	@RequestMapping("/")
	@CrossOrigin(origins = "*", maxAge = 3600)
	public Message home() {
		return new Message("Hello World");
	}

	@Bean
	HeaderHttpSessionStrategy sessionStrategy() {
		return new HeaderHttpSessionStrategy();
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
