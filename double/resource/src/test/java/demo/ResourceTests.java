package demo;

import static org.junit.Assert.assertEquals;

import java.security.Principal;

import org.junit.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;


public class ResourceTests {
	
	private ResourceApplication resource = new ResourceApplication();

	@Test
	public void home() {
		assertEquals("Hello World", resource.home().getContent());
	}

	@Test
	public void changes() {
		Principal user = new UsernamePasswordAuthenticationToken("admin", "");
		resource.update(new Message("Foo"), user);
		assertEquals(1, resource.changes().size());
	}

	@Test
	public void changesOverflow() {
		for (int i=1; i<=11; i++) { resource.changes().add(new Change("foo", "bar")); } 
		Principal user = new UsernamePasswordAuthenticationToken("admin", "");
		resource.update(new Message("Foo"), user);
		assertEquals(10, resource.changes().size());
	}

}
