package demo;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@SpringBootApplication
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
  protected static class SecurityConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
      return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
      InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
      manager.createUser(User.withUsername("user").password(encoder.encode("password")).roles("USER").build());
      manager.createUser(User.withUsername("admin").password(encoder.encode("admin")).roles("USER", "ADMIN", "READER", "WRITER").build());
      manager.createUser(User.withUsername("audit").password(encoder.encode("audit")).roles("USER", "ADMIN", "READER").build());
      return manager;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      http
        .httpBasic((basic) -> basic
          .securityContextRepository(new HttpSessionSecurityContextRepository())
        )
        .logout(Customizer.withDefaults())
        .authorizeHttpRequests(authorize -> authorize
          .requestMatchers("/index.html", "/", "/*.js", "/*.css", "/*.ico", "/*.txt", "/*.json").permitAll()
          .anyRequest().authenticated())
        .csrf(csrf -> csrf
          .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
          .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
        .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class);
      return http.build();
    }

  }

}

/**
 * Filter that eagerly loads the CSRF token, causing it to be written to the cookie.
 * Required for SPAs in Spring Security 6 where the token is lazily loaded by default.
 */
final class CsrfCookieFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
    if (csrfToken != null) {
      // Render the token value to a cookie by causing the deferred token to be loaded
      csrfToken.getToken();
    }
    filterChain.doFilter(request, response);
  }
}
