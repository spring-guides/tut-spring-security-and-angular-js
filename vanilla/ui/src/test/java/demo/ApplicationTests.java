package demo;

import java.net.HttpCookie;
import java.net.URI;
import java.util.List;
import java.util.Map;

import org.junit.Test;
import org.junit.runner.RunWith;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class ApplicationTests {

    @Autowired
    private TestRestTemplate template = new TestRestTemplate();

    @Test
    public void homePageLoads() {
        ResponseEntity<String> response = template.getForEntity("/", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    public void userEndpointProtected() {
        ResponseEntity<String> response = template.getForEntity("/user", String.class);
        assertEquals(HttpStatus.FOUND, response.getStatusCode());
    }

    @Test
    public void loginSucceeds() {
        ResponseEntity<String> response = template.getForEntity("/resource",
                String.class);
        String csrf = getCsrf(response.getHeaders());
        MultiValueMap<String, String> form = new LinkedMultiValueMap<String, String>();
        form.set("username", "user");
        form.set("password", "password");
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-XSRF-TOKEN", csrf);
        headers.put("COOKIE", response.getHeaders().get("Set-Cookie"));
        RequestEntity<MultiValueMap<String, String>> request = new RequestEntity<MultiValueMap<String, String>>(
                form, headers, HttpMethod.POST, URI.create("/login"));
        ResponseEntity<Map<String, Object>> location = template.exchange(request,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });
        assertEquals("user", location.getBody().get("name"));
    }

    private String getCsrf(HttpHeaders headers) {
        for (String header : headers.get("Set-Cookie")) {
            List<HttpCookie> cookies = HttpCookie.parse(header);
            for (HttpCookie cookie : cookies) {
                if ("XSRF-TOKEN".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

}
