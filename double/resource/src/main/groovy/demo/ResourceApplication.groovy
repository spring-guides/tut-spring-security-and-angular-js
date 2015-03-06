package demo

import java.security.Principal

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RestController

@Configuration
@ComponentScan
@EnableAutoConfiguration
@RestController
@EnableRedisHttpSession
class ResourceApplication extends WebSecurityConfigurerAdapter {
	
	String message = 'Hello World'
	def changes = []

	@RequestMapping(value='/', method=RequestMethod.GET)
	def home() {
		[id: UUID.randomUUID().toString(), content: message]
	}

	@RequestMapping(value='/changes', method=RequestMethod.GET)
	def changes() {
		changes
	}

	@RequestMapping(value='/', method=RequestMethod.POST)
	def update(@RequestBody Map<String,String> map, Principal principal) {
		if (map.content) {
			message = map.content
			changes << [timestamp: new Date(), user: principal.name, content: message]
			if (changes.size()>10) {
				changes = changes[0..9]
			}
		}
		[id: UUID.randomUUID().toString(), content: message]
	}

	static void main(String[] args) {
		SpringApplication.run ResourceApplication, args
	}

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		// We need this to prevent the browser from popping up a dialog on a 401
		http.httpBasic().disable()
		http.authorizeRequests().antMatchers(HttpMethod.POST, "/**").hasRole("WRITER").anyRequest().authenticated()
	}
}
