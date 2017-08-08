package demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;

import org.junit.Test;
import org.junit.runner.RunWith;
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

	private TestRestTemplate template = new TestRestTemplate();

	@Test
	public void homePageLoads() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/", String.class);
		assertEquals(HttpStatus.OK, response.getStatusCode());
	}

	@Test
	public void jsPageLoads() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/js/hello.js", String.class);
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertThat(response.getBody()).contains("$routeProvider");
	}

	@Test
	public void userEndpointProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/user", String.class);
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
	}

	@Test
	public void resourceEndpointProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:"
				+ port + "/resource", String.class);
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
	}

	@Test
	public void loginSucceeds() {
		TestRestTemplate template = new TestRestTemplate("user", "password");
		ResponseEntity<String> response = template.getForEntity("http://localhost:" + port
				+ "/user", String.class);
		assertEquals(HttpStatus.OK, response.getStatusCode());
	}

	@Test
	public void redirectHome() {
		TestRestTemplate template = new TestRestTemplate("user", "password");
		ResponseEntity<String> response = template.getForEntity("http://localhost:" + port
				+ "/home", String.class);
		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertThat(response.getBody()).contains("<html>");
	}

}
