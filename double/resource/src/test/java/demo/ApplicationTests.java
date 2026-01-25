package demo;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;


@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)
public class ApplicationTests {

	@LocalServerPort
	private int port;

	private TestRestTemplate template = new TestRestTemplate();

	@Test
	public void resourceProtected() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:{port}/", String.class, port);
		// N.B. better if it was UNAUTHORIZED but that means we have to add a custom authentication entry point
		assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
	}

}
