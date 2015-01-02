package demo

import javax.servlet.Filter

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.context.embedded.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.core.RedisOperations
import org.springframework.session.Session
import org.springframework.session.SessionRepository
import org.springframework.session.data.redis.RedisOperationsSessionRepository
import org.springframework.session.web.http.HeaderHttpSessionStrategy;
import org.springframework.session.web.http.SessionRepositoryFilter
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
	
	@Bean
	FilterRegistrationBean sessionFilterRegistration(RedisConnectionFactory connectionFactory) {
		FilterRegistrationBean registration = new FilterRegistrationBean()
		registration.setFilter(sessionFilter(connectionFactory))
		registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 1)
		registration
	}

	Filter sessionFilter(RedisConnectionFactory connectionFactory) {
		SessionRepository sessionRepository = new RedisOperationsSessionRepository(connectionFactory)
		SessionRepositoryFilter<Session> filter = new SessionRepositoryFilter<Session>(sessionRepository)
		HeaderHttpSessionStrategy httpSessionStrategy = new HeaderHttpSessionStrategy();
		httpSessionStrategy.setHeaderName("X-Session");
		filter.setHttpSessionStrategy(httpSessionStrategy);
		filter
	}

	static void main(String[] args) {
		SpringApplication.run ResourceApplication, args
	}
}
