package demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.embedded.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)
public class ApplicationTests {

	@LocalServerPort
	private int port;

	@Value("${security.oauth2.client.userAuthorizationUri}")
	private String authorizeUri;

	private TestRestTemplate template = new TestRestTemplate();

	@Test
	public void homePageLoads() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/", String.class);
		assertEquals(HttpStatus.OK, response.getStatusCode());
	}

	@Test
	public void userEndpointProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/user", String.class);
		assertEquals(HttpStatus.FOUND, response.getStatusCode());
		assertEquals("http://localhost:" + port + "/login", response.getHeaders()
				.getLocation().toString());
	}

	@Test
	public void resourceEndpointProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/resource", String.class);
		assertEquals(HttpStatus.FOUND, response.getStatusCode());
		assertEquals("http://localhost:" + port + "/login", response.getHeaders()
				.getLocation().toString());
	}

	@Test
	public void loginRedirects() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/login", String.class);
		assertEquals(HttpStatus.FOUND, response.getStatusCode());
		String location = response.getHeaders().getFirst("Location");
		assertTrue("Wrong location: " + location, location.startsWith(authorizeUri));
	}

}
