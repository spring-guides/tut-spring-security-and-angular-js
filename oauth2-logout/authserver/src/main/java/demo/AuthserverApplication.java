package demo;

import java.io.IOException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Principal;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.util.UriComponentsBuilder;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

@SpringBootApplication
@RestController
public class AuthserverApplication {

	@RequestMapping("/user")
	public Principal user(Principal user) {
		return user;
	}

	public static void main(String[] args) {
		SpringApplication.run(AuthserverApplication.class, args);
	}

	@Configuration
	public static class SecurityConfig {

		@Bean
		@Order(1)
		public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
			OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
			http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
				.oidc(Customizer.withDefaults())
			// uncomment to invalidate session after issuing authorization code
			/*
				.authorizationEndpoint((authorize) -> authorize
					.authorizationResponseHandler(new SessionInvalidatingSuccessHandler())
				)
			*/;
			http.formLogin(Customizer.withDefaults());
			return http.build();
		}

		@Bean
		@Order(2)
		public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
			http
				.cors(cors -> cors.configurationSource(configurationSource()))
				.authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated())
				.formLogin(Customizer.withDefaults())
				.oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults()))
				.csrf((csrf) -> csrf.ignoringRequestMatchers("/logout/**"));
			return http.build();
		}

		private CorsConfigurationSource configurationSource() {
			UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
			CorsConfiguration config = new CorsConfiguration();
			config.addAllowedOrigin("*");
			config.addAllowedHeader("X-Requested-With");
			config.addAllowedHeader("Content-Type");
			config.addAllowedMethod(HttpMethod.POST);
			source.registerCorsConfiguration("/logout", config);
			return source;
		}

		@Bean
		public PasswordEncoder passwordEncoder() {
			return PasswordEncoderFactories.createDelegatingPasswordEncoder();
		}

		@Bean
		public UserDetailsService userDetailsService(PasswordEncoder encoder) {
			return new InMemoryUserDetailsManager(
				User.withUsername("user").password(encoder.encode("password")).roles("USER").build()
			);
		}

		@Bean
		public RegisteredClientRepository registeredClientRepository(PasswordEncoder encoder) {
			RegisteredClient client = RegisteredClient.withId(UUID.randomUUID().toString())
				.clientId("acme")
				.clientSecret(encoder.encode("acmesecret"))
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
				.redirectUri("http://localhost:8080/login/oauth2/code/acme")
				.scope("openid")
				.build();
			return new InMemoryRegisteredClientRepository(client);
		}

		@Bean
		public JWKSource<SecurityContext> jwkSource() {
			KeyPair keyPair = generateRsaKey();
			RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
			RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
			RSAKey rsaKey = new RSAKey.Builder(publicKey)
				.privateKey(privateKey)
				.keyID(UUID.randomUUID().toString())
				.build();
			JWKSet jwkSet = new JWKSet(rsaKey);
			return new ImmutableJWKSet<>(jwkSet);
		}

		private static KeyPair generateRsaKey() {
			try {
				KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
				keyPairGenerator.initialize(2048);
				return keyPairGenerator.generateKeyPair();
			} catch (Exception ex) {
				throw new IllegalStateException(ex);
			}
		}

		@Bean
		public AuthorizationServerSettings authorizationServerSettings() {
			return AuthorizationServerSettings.builder().build();
		}
	}

	// uncomment to invalidate session after issuing authorization code
	/*
	private static class SessionInvalidatingSuccessHandler implements AuthenticationSuccessHandler {
		@Override
		public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
											Authentication authentication) throws IOException, ServletException {
			OAuth2AuthorizationCodeRequestAuthenticationToken authCodeRequestAuth =
					(OAuth2AuthorizationCodeRequestAuthenticationToken) authentication;

			// Build the redirect URI with the authorization code
			UriComponentsBuilder uriBuilder = UriComponentsBuilder
					.fromUriString(authCodeRequestAuth.getRedirectUri())
					.queryParam("code", authCodeRequestAuth.getAuthorizationCode().getTokenValue());
			if (authCodeRequestAuth.getState() != null) {
				uriBuilder.queryParam("state", authCodeRequestAuth.getState());
			}
			String redirectUri = uriBuilder.build().toUriString();

			// Send the redirect
			response.sendRedirect(redirectUri);

			// Invalidate the session after the redirect is sent
			HttpSession session = request.getSession(false);
			if (session != null) {
				session.invalidate();
			}
		}
	}
	*/
}
