package demo;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class ApplicationTests {

    @Autowired
    private TestRestTemplate template;

    @Test
    public void homePageLoads() {
        ResponseEntity<String> response = template.getForEntity("/", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    public void userEndpointProtected() {
        ResponseEntity<String> response = template.getForEntity("/user", String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    public void resourceEndpointProtected() {
        ResponseEntity<String> response = template.getForEntity("/resource",
                String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    public void loginSucceeds() {
        TestRestTemplate template = this.template.withBasicAuth("user", "password");
        ResponseEntity<String> response = template.getForEntity("/user", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

}
