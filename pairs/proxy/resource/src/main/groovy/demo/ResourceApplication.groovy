package demo

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
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

}
