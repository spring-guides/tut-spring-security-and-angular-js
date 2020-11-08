package demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpHeaders;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)
public class ApplicationTests {

	@org.springframework.boot.web.server.LocalServerPort
	private int port;

	@Autowired
	private TestRestTemplate template;

	@Test
	public void homePageProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/uaa/", String.class);
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
		String auth = response.getHeaders().getFirst("WWW-Authenticate");
		assertTrue("Wrong header: " + auth, auth.startsWith("Bearer realm=\""));
	}

	@Test
	public void userEndpointProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/uaa/user", String.class);
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
		String auth = response.getHeaders().getFirst("WWW-Authenticate");
		assertTrue("Wrong header: " + auth, auth.startsWith("Bearer realm=\""));
	}

	@Test
	public void authorizationRedirects() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/uaa/oauth/authorize", String.class);
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
		String auth = response.getHeaders().getFirst("WWW-Authenticate");
		assertTrue("Wrong header: " + auth, auth.startsWith("Basic realm=\""));
	}
}
