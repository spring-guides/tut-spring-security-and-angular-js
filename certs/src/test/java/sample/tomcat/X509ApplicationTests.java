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

import java.io.IOException;
import java.io.InputStream;
import java.security.KeyStore;

import javax.net.ssl.SSLContext;

import org.apache.http.client.HttpClient;
import org.apache.http.conn.ssl.AllowAllHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContextBuilder;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.junit.Assert.assertEquals;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = X509Application.class)
@WebAppConfiguration
@IntegrationTest("server.port=0")
public class X509ApplicationTests {

	@Value("${local.server.port}")
	private String port;

	private SSLContext defaultContext;

	@Before
	public void setUp() throws Exception {
		this.defaultContext = SSLContext.getDefault();
	}

	@After
	public void reset() throws Exception {
		SSLContext.setDefault(this.defaultContext);
	}

	@Test(expected = ResourceAccessException.class)
	public void testUnauthenticatedHello() throws Exception {
		RestTemplate template = new TestRestTemplate();
		ResponseEntity<String> httpsEntity = template.getForEntity("https://localhost:"
				+ this.port + "/hello", String.class);
		assertEquals(HttpStatus.OK, httpsEntity.getStatusCode());
		assertEquals("hello", httpsEntity.getBody());
	}

	@Test
	public void testAuthenticatedHello() throws Exception {
		RestTemplate template = new TestRestTemplate();
		final HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(
				httpClient());
		template.setRequestFactory(factory);

		ResponseEntity<String> httpsEntity = template.getForEntity("https://localhost:"
				+ this.port + "/hello", String.class);
		assertEquals(HttpStatus.OK, httpsEntity.getStatusCode());
		assertEquals("hello", httpsEntity.getBody());
	}

	private HttpClient httpClient() throws Exception {
		CloseableHttpClient httpclient = HttpClients.custom()
				.setSSLSocketFactory(socketFactory()).build();
		return httpclient;
	}

	private SSLConnectionSocketFactory socketFactory() throws Exception {
		char[] password = "password".toCharArray();
		KeyStore truststore = KeyStore.getInstance("PKCS12");
		truststore.load(getKeyStoreFile(), password);
		SSLContextBuilder builder = new SSLContextBuilder();
		builder.loadKeyMaterial(truststore, password);
		builder.loadTrustMaterial(truststore, new TrustSelfSignedStrategy());
		return new SSLConnectionSocketFactory(builder.build(),
				new AllowAllHostnameVerifier());
	}

	private static InputStream getKeyStoreFile() throws IOException {
		ClassPathResource resource = new ClassPathResource("rod.p12");
		return resource.getInputStream();
	}

}
