package demo;

import javax.servlet.Filter;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.session.SessionRepository;
import org.springframework.session.data.redis.RedisOperationsSessionRepository;
import org.springframework.session.web.SessionRepositoryFilter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Configuration
@ComponentScan
@EnableAutoConfiguration
@Controller
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Configuration
	@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
	protected static class SecurityConfiguration extends
			WebSecurityConfigurerAdapter {

	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	@Bean
	Filter sessionFilter(
			@Qualifier("redisTemplate") RedisOperations redisOperations) {
		SessionRepository sessionRepository = new RedisOperationsSessionRepository(
				redisOperations);
		SessionRepositoryFilter filter = new SessionRepositoryFilter(
				sessionRepository);
		return filter;
	}

	@RequestMapping("/token")
	@ResponseBody
	public String token(HttpSession session) {
		return session.getId();
	}

}
