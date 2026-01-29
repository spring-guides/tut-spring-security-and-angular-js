package demo;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@SpringBootApplication
@Controller
public class AdminApplication {

  @GetMapping(value = "/{path:[^\\.]*}")
  public String redirect() {
    return "forward:/";
  }

  @GetMapping("/user")
  @ResponseBody
  public Map<String, Object> user(Principal user) {
    Map<String, Object> map = new LinkedHashMap<String, Object>();
    map.put("name", user.getName());
    map.put("roles", AuthorityUtils.authorityListToSet(((Authentication) user).getAuthorities()));
    return map;
  }

  public static void main(String[] args) {
    SpringApplication.run(AdminApplication.class, args);
  }

  @Configuration
  protected static class SecurityConfiguration {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      http
        // No httpBasic - rely on shared session from Gateway
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.NEVER))
        .authorizeHttpRequests(authorize -> authorize
          .requestMatchers("/index.html", "/", "/*.js", "/*.css", "/*.ico", "/*.txt", "/*.json").permitAll()
          .anyRequest().hasRole("ADMIN"))
        .csrf(csrf -> csrf.disable());
      return http.build();
    }
  }

}
