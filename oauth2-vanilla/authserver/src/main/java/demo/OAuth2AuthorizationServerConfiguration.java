/*
 * Copyright 2016-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package demo;

import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.security.oauth2.OAuth2ClientProperties;
import org.springframework.boot.autoconfigure.security.oauth2.authserver.AuthorizationServerProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.config.annotation.builders.ClientDetailsServiceBuilder;
import org.springframework.security.oauth2.config.annotation.builders.InMemoryClientDetailsServiceBuilder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.provider.client.BaseClientDetails;

/**
 * @author Dave Syer
 *
 */
@Configuration
@EnableConfigurationProperties(AuthorizationServerProperties.class)
public class OAuth2AuthorizationServerConfiguration
		extends AuthorizationServerConfigurerAdapter {

	private final BaseClientDetails details;

	private final AuthenticationManager authenticationManager;

	public OAuth2AuthorizationServerConfiguration(BaseClientDetails details,
			AuthenticationManager authenticationManager) {
		this.details = details;
		this.authenticationManager = authenticationManager;
	}

	@Override
	public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
		ClientDetailsServiceBuilder<InMemoryClientDetailsServiceBuilder>.ClientBuilder builder = clients
				.inMemory().withClient(this.details.getClientId());
		builder.secret(this.details.getClientSecret())
				.resourceIds(this.details.getResourceIds().toArray(new String[0]))
				.authorizedGrantTypes(
						this.details.getAuthorizedGrantTypes().toArray(new String[0]))
				.authorities(
						AuthorityUtils.authorityListToSet(this.details.getAuthorities())
								.toArray(new String[0]))
				.scopes(this.details.getScope().toArray(new String[0]));

	}

	@Override
	public void configure(AuthorizationServerEndpointsConfigurer endpoints)
			throws Exception {
		if (this.details.getAuthorizedGrantTypes().contains("password")) {
			endpoints.authenticationManager(this.authenticationManager);
		}
		endpoints.prefix("/api");
	}

	@Configuration
	@ConditionalOnMissingBean(BaseClientDetails.class)
	protected static class BaseClientDetailsConfiguration {

		private final OAuth2ClientProperties client;

		protected BaseClientDetailsConfiguration(OAuth2ClientProperties client) {
			this.client = client;
		}

		@Bean
		@ConfigurationProperties(prefix = "security.oauth2.client")
		public BaseClientDetails oauth2ClientDetails() {
			BaseClientDetails details = new BaseClientDetails();
			if (this.client.getClientId() == null) {
				this.client.setClientId(UUID.randomUUID().toString());
			}
			details.setClientId(this.client.getClientId());
			details.setClientSecret(this.client.getClientSecret());
			details.setAuthorizedGrantTypes(Arrays.asList("authorization_code",
					"password", "client_credentials", "implicit", "refresh_token"));
			details.setAuthorities(
					AuthorityUtils.commaSeparatedStringToAuthorityList("ROLE_USER"));
			details.setRegisteredRedirectUri(Collections.<String>emptySet());
			return details;
		}

	}

}
