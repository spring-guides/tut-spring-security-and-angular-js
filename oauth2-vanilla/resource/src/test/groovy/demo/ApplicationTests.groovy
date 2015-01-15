package demo

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner
import org.springframework.web.client.RestTemplate;

@RunWith(SpringJUnit4ClassRunner)
@SpringApplicationConfiguration(classes = ResourceApplication)
@WebAppConfiguration
@IntegrationTest('server.port:0')
public class ApplicationTests {

	@Value('${local.server.port}')
	private int port;

	private RestTemplate template = new TestRestTemplate();

	@Test
	public void resourceLoads() {
		ResponseEntity<String> response = template.getForEntity("http://localhost:${port}/", String.class)
		assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode())
		String auth = response.getHeaders().getFirst("WWW-Authenticate")
		assertTrue("Wrong location: " + auth , auth.startsWith("Bearer"))
	}
}
