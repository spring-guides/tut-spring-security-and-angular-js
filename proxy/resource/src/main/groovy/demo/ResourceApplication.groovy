package demo

import javax.servlet.Filter;

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.session.SessionRepository;
import org.springframework.session.data.redis.RedisOperationsSessionRepository;
import org.springframework.session.web.http.SessionRepositoryFilter;
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Configuration
@ComponentScan
@EnableAutoConfiguration
@RestController
class ResourceApplication {

	@RequestMapping('/')
	def home() {
		[id: UUID.randomUUID().toString(), content: 'Hello World']
	}

	static void main(String[] args) {
		SpringApplication.run ResourceApplication, args
	}

	@Bean
	Filter sessionFilter(RedisConnectionFactory redisOperations) {
		SessionRepository sessionRepository = new RedisOperationsSessionRepository(
				redisOperations)
		new SessionRepositoryFilter(sessionRepository)
	}
}
