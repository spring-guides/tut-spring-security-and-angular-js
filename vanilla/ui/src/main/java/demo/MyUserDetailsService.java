package demo;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class MyUserDetailsService implements UserDetailsService {

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

    User user = findUserbyUername(username);

    org.springframework.security.core.userdetails.User.UserBuilder builder = null;
    if (user != null) {
      builder = org.springframework.security.core.userdetails.User.withUsername(username);
      builder.password(new BCryptPasswordEncoder().encode(user.getPassword()));
      builder.roles(user.getRoles());
    } else {
      throw new UsernameNotFoundException("User not found.");
    }

    return builder.build();
  }

  private User findUserbyUername(String username) {
    if (username.equalsIgnoreCase("user")) {
      return new User(username, "p", "perm1", "perm2");
    } else if (username.equalsIgnoreCase("loic")) {
      return new User(username, "p", "perm1", "perm2", "perm3");
    }
    return null;
  }

  public class User {
    private String username;
    private String password;
    private String[] roles;

    public User(String username, String password, String... roles) {
      this.username = username;
      this.password = password;
      this.roles = roles;
    }

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }

    public String[] getRoles() {
      return roles;
    }

    public void setRoles(String[] roles) {
      this.roles = roles;
    }
  }
};
