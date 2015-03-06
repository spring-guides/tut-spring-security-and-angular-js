package demo

import static org.junit.Assert.assertEquals

import java.security.Principal

import org.junit.Test
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken


public class ResourceTests {
	
	private ResourceApplication resource = new ResourceApplication()

	@Test
	void home() {
		assertEquals('Hello World', resource.home().content)
	}

	@Test
	void changes() {
		Principal user = new UsernamePasswordAuthenticationToken("admin", "")
		resource.update([content: 'Foo'], user)
		assertEquals(1, resource.changes().size())
	}

	@Test
	void changesOverflow() {
		for (i in 1..11) { resource.changes << [] } 
		Principal user = new UsernamePasswordAuthenticationToken("admin", "")
		resource.update([content: 'Foo'], user)
		assertEquals(10, resource.changes().size())
	}

}
