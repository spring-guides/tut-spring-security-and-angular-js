package demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@EnableWebSecurity
@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
	
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		// @formatter:off
		http
			.authorizeRequests()
			.anyRequest().authenticated()
			.and()
			.httpBasic();
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
