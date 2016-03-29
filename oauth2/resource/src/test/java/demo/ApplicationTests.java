package demo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.boot.test.WebIntegrationTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.web.client.RestTemplate;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = ResourceApplication.class)
@WebIntegrationTest(randomPort=true)
public class ApplicationTests {

	@Value("${local.server.port}")
	private int port;

	private RestTemplate template = new TestRestTemplate();

	@Test
	public void resourceLoads() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:{port}/resource/", String.class, port);
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
		String auth = response.getHeaders().getFirst("WWW-Authenticate");
		assertTrue("Wrong header: " + auth , auth.startsWith("Bearer"));
	}
}
