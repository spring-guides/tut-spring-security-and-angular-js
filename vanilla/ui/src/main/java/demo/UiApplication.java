package demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;

@SpringBootApplication
@Controller
public class UiApplication {

  public static void main(String[] args) {
    SpringApplication.run(UiApplication.class, args);
  }

  @GetMapping(value = "/{path:[^\\.]*}")
  public String redirect() {
    return "forward:/";
  }

  @RequestMapping("/user")
  @ResponseBody
  public Principal user(Principal user) {
    return user;
  }

  @Configuration
  protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Override
    public void configure(WebSecurity web) throws Exception {
      web.ignoring().antMatchers("/*.bundle.*", "/favicon.ico");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
      http
        .formLogin()
        .loginPage("/login")
        .loginProcessingUrl("/api/login")
        .successForwardUrl("/user")
        .and()
        .logout()
        .addLogoutHandler(new CsrfLogoutHandler(CookieCsrfTokenRepository.withHttpOnlyFalse()))
        .logoutSuccessUrl("/home")
        .and()
        .authorizeRequests()
        .antMatchers("/index.html", "/", "/home", "/login").permitAll()
        .anyRequest().authenticated()
        .and()
        .csrf().ignoringAntMatchers("/index.html", "/", "/home", "/login")
        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
    }
  }
}
