package demo;

import java.security.KeyPair;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.store.KeyStoreKeyFactory;

@Configuration
public class CustomAuthorizationServerConfigurer extends AuthorizationServerConfigurerAdapter {
	
	AuthenticationManager authenticationManager;

	public CustomAuthorizationServerConfigurer(AuthenticationConfiguration authenticationConfiguration)
			throws Exception {
		this.authenticationManager = authenticationConfiguration.getAuthenticationManager();
	}

	@Override
	public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
		clients
			.inMemory()
			.withClient("acme")
			.authorizedGrantTypes("authorization_code","refresh_token","password")
			.secret(passwordEncoder().encode("acmesecret"))
			.scopes("openid")
			.redirectUris("http://localhost:8080/login");
	}
	
    @Bean
    public PasswordEncoder passwordEncoder() {
    	return new BCryptPasswordEncoder();
    }

	@Override
	public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
		endpoints.authenticationManager(authenticationManager).accessTokenConverter(jwtAccessTokenConverter());
		
	}
	
	@Bean
	public JwtAccessTokenConverter jwtAccessTokenConverter() {
		JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
		KeyPair keyPair = new KeyStoreKeyFactory(
				new ClassPathResource("keystore.jks"), "foobar".toCharArray()).getKeyPair("test");
		converter.setKeyPair(keyPair);
		return converter;
	}
	
	@Override
	public void configure(AuthorizationServerSecurityConfigurer oauthServer)
			throws Exception {
		oauthServer.tokenKeyAccess("permitAll()")
				.checkTokenAccess("isAuthenticated()");
	}
}
