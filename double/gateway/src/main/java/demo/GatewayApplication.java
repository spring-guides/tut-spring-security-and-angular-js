package demo;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@SpringBootApplication
@EnableZuulProxy
@Controller
public class GatewayApplication {

	@RequestMapping("/user")
	@ResponseBody
	public Map<String, Object> user(Principal user) {
		Map<String, Object> map = new LinkedHashMap<String, Object>();
		map.put("name", user.getName());
		map.put("roles", AuthorityUtils.authorityListToSet(((Authentication) user).getAuthorities()));
		return map;
	}

	public static void main(String[] args) {
		SpringApplication.run(GatewayApplication.class, args);
	}

	@Configuration
	protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {

		@Override
		public void configure(WebSecurity web) throws Exception {
			web.ignoring().antMatchers("/*.bundle.*", "/favicon.ico");
		}

		@Override
		protected void configure(HttpSecurity http) throws Exception {
			// @formatter:off
			http
				.httpBasic().and()
				.logout().and()
				.authorizeRequests()
					.antMatchers("/index.html", "/").permitAll()
					.anyRequest().authenticated()
					.and().csrf()
					.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
			http.sessionManagement().sessionCreationPolicy(SessionCreationPolicy.ALWAYS);
			
			// @formatter:on
		}
		
	    @Bean
	    @Override
	    public UserDetailsService userDetailsService() {
	        UserDetails user = User
	                .withUsername("user")
	                .password(passwordEncoder().encode("password"))
	                .roles("USER")
	                .build();

	            UserDetails admin = User
	                .withUsername("admin")
	                .password(passwordEncoder().encode("admin"))
	                .roles("USER", "ADMIN", "READER", "WRITER")
	                .build();
	            
	            UserDetails audit = User
	                    .withUsername("audit")
	                    .password(passwordEncoder().encode("audit"))
	                    .roles("USER", "ADMIN", "READER")
	                    .build();

	        return new InMemoryUserDetailsManager(user, admin, audit);
	    }
	    
	    @Bean
	    public PasswordEncoder passwordEncoder() {
	    	return new BCryptPasswordEncoder();
	    }	    
	    
	}

}
