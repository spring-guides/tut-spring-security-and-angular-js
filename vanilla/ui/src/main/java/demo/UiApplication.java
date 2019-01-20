package demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
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
    private MyUserDetailsService userDetailsService = new MyUserDetailsService();

    @Bean
    public UserDetailsService userDetailsService() {
      return new MyUserDetailsService();
    };

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
      return new BCryptPasswordEncoder();
    };

    @Override
    public void configure(WebSecurity web) throws Exception {
      web.ignoring().antMatchers("/*.js", "/*.css", "/*.html", "/favicon.ico");
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
      auth.userDetailsService(userDetailsService()).passwordEncoder(passwordEncoder());
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
      http
        // gestion des CSRF, il faut le toker pour ces pages et appels de service sinon ça ne marche pas
        .csrf().ignoringAntMatchers("/index.html", "/", "/home", "/login", "/api/login", "/api/logout")
        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        .and()
        // LOGIN: la page pour la redirection, l'url du service de login et l'url de redirect en cas de succès
        .formLogin()
        .loginPage("/login")
        .loginProcessingUrl("/api/login")
        .successForwardUrl("/user")
        .and()
        // LOGOUT: l'url du service de logout, le handler pour récupérer le token csrf d'une fois à l'autre, et le
        //         successHandler qui évite la redirection puisqu'on appelle un service de logout ==> pas de HTML
        .logout()
        .logoutUrl("/api/logout")
        .addLogoutHandler(new CsrfLogoutHandler(CookieCsrfTokenRepository.withHttpOnlyFalse()))
        .addLogoutHandler(myLogoutHandler())
        .logoutSuccessHandler((new HttpStatusReturningLogoutSuccessHandler(HttpStatus.OK)))
        .and()
        // GLOBAL SETTINGS: on doit être authentifié pour tout sauf pour certaines pages et services
        .authorizeRequests()
        .antMatchers("/index.html", "/", "/home", "/login").permitAll()
        .anyRequest().authenticated()
      ;
    }

    private LogoutHandler myLogoutHandler() {
      return new LogoutHandler() {

        @Override
        public void logout(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse,
                           Authentication authentication) {
          System.out.println("myLogoutHandler called");
        }
      };
    }
  }
}
