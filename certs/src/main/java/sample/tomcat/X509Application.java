/*
 * Copyright 2012-2014 the original author or authors.
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

package sample.tomcat;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sample Application to show Tomcat connector customization
 *
 * @author Dave Syer
 * @author Brock Mills
 */
@Configuration
@EnableAutoConfiguration
@ComponentScan
@RestController
public class X509Application {

	@Autowired
	private ServerProperties server;

	@RequestMapping("/hello")
	public String helloWorld() {
		return "hello";
	}

	@Configuration
	@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
	protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {

		@Override
		protected void configure(HttpSecurity http) throws Exception {
			UserDetailsService userDetails = new InMemoryUserDetailsManager(
					Arrays.<UserDetails> asList(new User("rod", "N/A", AuthorityUtils
							.commaSeparatedStringToAuthorityList("ROLE_USER"))));
			http.authorizeRequests().anyRequest().authenticated().and().x509()
					.userDetailsService(userDetails).and().sessionManagement()
					.sessionCreationPolicy(SessionCreationPolicy.NEVER).and().csrf()
					.disable();
		}

	}

	public static void main(String[] args) throws Exception {
		SpringApplication.run(X509Application.class, args);
	}

}
