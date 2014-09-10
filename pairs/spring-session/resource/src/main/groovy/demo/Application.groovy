package demo

import javax.servlet.Filter

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.context.embedded.FilterRegistrationBean;
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.data.redis.core.RedisOperations
import org.springframework.session.Session
import org.springframework.session.SessionRepository
import org.springframework.session.data.redis.RedisOperationsSessionRepository
import org.springframework.session.web.HeaderHttpSessionStrategy
import org.springframework.session.web.SessionRepositoryFilter
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Configuration
@ComponentScan
@EnableAutoConfiguration
@RestController
class Application {

	@RequestMapping('/')
	def home() {
		[id: UUID.randomUUID().toString(), content: 'Hello World']
	}
	
	@Bean
	FilterRegistrationBean sessionFilterRegistration(@Qualifier("redisTemplate") RedisOperations redisOperations) {
		FilterRegistrationBean registration = new FilterRegistrationBean()
		registration.setFilter(sessionFilter(redisOperations))
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE)
		registration
	}

	Filter sessionFilter(RedisOperations redisOperations) {
		SessionRepository sessionRepository = new RedisOperationsSessionRepository(redisOperations)
		SessionRepositoryFilter<Session> filter = new SessionRepositoryFilter<Session>(sessionRepository)
		HeaderHttpSessionStrategy strategy = new HeaderHttpSessionStrategy();
		strategy.setHeaderName("X-Token");
		filter.setHttpSessionStrategy(strategy);
		filter
	}

	static void main(String[] args) {
		SpringApplication.run Application, args
	}
}
