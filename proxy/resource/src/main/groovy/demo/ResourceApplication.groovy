package demo

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
@RestController
@EnableRedisHttpSession
class ResourceApplication {

	@RequestMapping('/')
	def home() {
		[id: UUID.randomUUID().toString(), content: 'Hello World']
	}

	static void main(String[] args) {
		SpringApplication.run ResourceApplication, args
	}

}
