# The Resource Server: Angular JS and Spring Security Part III

In this article we continue [our discussion][second] of how to use [Spring Security](http://projects.spring.io/spring-security) with [Angular JS](http://angularjs.org) in a "single page application". Here we start by breaking out the "greeting" resource that we are using as the dynamic content in our application into a separate server, first as an unprotected resource, and then protected by an opaque token. This is the third in a series of articles, and you can catch up on the basic building blocks of the application or build it from scratch by reading the [first article][first], or you can just go straight to the source code in Github, which is in two parts: one where the [resource is unprotected](https://github.com/dsyer/spring-security-angular/tree/master/vanilla), and one where it is [protected by a token](https://github.com/dsyer/spring-security-angular/tree/master/spring-session).

> Reminder: if you are working through this article with the sample application, be sure to clear your browser cache of cookies and HTTP Basic credentials. In Chrome the best way to do that for a single server is to open a new incognito window.

[first]: http://spring.io/blog/2015/01/12/spring-and-angular-js-a-secure-single-page-application (First Article in the Series)
[second]: http://spring.io/blog/2015/01/12/the-login-page-angular-js-and-spring-security-part-ii (Second Article in the Series)

## A Separate Resource Server

### Client Side Changes

On the client side there isn't very much to do to move the resource to a different backend. Here's the "home" controller in the [last article](https://github.com/dsyer/spring-security-angular/blob/master/single/src/main/resources/static/js/hello.js):

```javascript
angular.module('hello', [ 'ngRoute' ])
...
.controller('home', function($scope, $http) {
	$http.get('/resource/').success(function(data) {
		$scope.greeting = data;
	})
})
...
```

All we need to do to this is change the URL. For example, if we are going to run the new resource on localhost, it could look like this:

```javascript
angular.module('hello', [ 'ngRoute' ])
...
.controller('home', function($scope, $http) {
	$http.get('http://localhost:9000/').success(function(data) {
		$scope.greeting = data;
	})
})
...
```

### Server Side Changes

The [UI server](https://github.com/dsyer/spring-security-angular/blob/master/vanilla/ui/src/main/java/demo/UiApplication.java) is trivial to change: we just need to remove the `@RequestMapping` for the greeting resource (it was "/resource"). Then we need to create a new resource server, which we can do like we did in the [first article][first] using the [Spring Boot Initializr](https://start.spring.io). E.g. using curl on a UN*X like system:

```
$ mkdir resource && cd resource
$ curl https://start.spring.io/starter.tgz -d style=web \
-d name=resource -d language=groovy | tar -xzvf - 
```

You can then import that project (it's a normal Maven Java project by default) into your favourite IDE, or just work with the files and "mvn" on the command line. We are using Groovy because we can, but please feel free to use Java if you prefer. There isn't going to be much code anyway.

Just add a `@RequestMapping` to the [main application class](https://github.com/dsyer/spring-security-angular/blob/master/vanilla/resource/src/main/groovy/demo/ResourceApplication.groovy), copying the implementation from the [old UI](https://github.com/dsyer/spring-security-angular/blob/master/single/src/main/java/demo/UiApplication.java):

```java
@SpringBootApplication
@RestController
class ResourceApplication {
	
	@RequestMapping('/')
	def home() {
		[id: UUID.randomUUID().toString(), content: 'Hello World']
	}

    static void main(String[] args) {
        SpringApplication.run ResourceApplication, args
    }

}
```

Once that is done your application will be loadable in a browser. On the command line you can do this

```
$ mvn spring-boot:run --server.port=9000
```

and go to a browser at [http://localhost:9000](http://localhost:9000) and you should see JSON with a greeting. You can bake in the port change in `application.properties` (in"src/main/resources"):

```properties
server.port: 9000
```

If you try loading that resource from the UI (on port 8080) in a browser, you will find that it doesn't work because the browser won't allow the XHR request.

## CORS Negotiation

The browser tries to negotiate with our resource server to find out if it is allowed to access it according to the [Common Origin Resource Sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) protocol. It's not an Angular JS responsibility, so just like the cookie contract it will work like this with all JavaScript in the browser. The two servers do not declare that they have a common origin, so the browser declines to send the request and the UI is broken.

To fix that we need to support the CORS protocol which involves a "pre-flight" OPTIONS request and some headers to list the allowed behaviour of the caller. Spring 4.2 might have some nice [fine-grained CORS support](https://jira.spring.io/browse/SPR-9278), but until that is released we can do an adequate job for the purposes of this application by sending the same CORS responses to all requests using a `Filter`. We can just create a class in the same directory as the resource server application and make sure it is a `@Component` (so it gets scanned into the Spring application context), for example:

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CorsFilter implements Filter {

	void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
		HttpServletResponse response = (HttpServletResponse) res
		response.setHeader("Access-Control-Allow-Origin", "*")
		response.setHeader("Access-Control-Allow-Methods", "POST, PUT, GET, OPTIONS, DELETE")
		response.setHeader("Access-Control-Max-Age", "3600")
		if (request.getMethod()!='OPTIONS') {
			chain.doFilter(req, res)
		} else {
		}
	}

	void init(FilterConfig filterConfig) {}

	void destroy() {}

}
```

The `Filter` is defined with an `@Order` so that it is definitely applied *before* the main Spring Security filter. With that change to the resource server, we should be able to re-launch it and get our greeting in the UI.

> Note: blithely using `Access-Control-Allow-Origin=*` is quick and dirty, and it works, but it is not not secure and is not in any way recommended.

## Securing the Resource Server

Great! We have a working application with a new architecture. The only problem is that the resource server has no security.

### Adding Spring Security

We can also look at how to add security to the resource server as a filter layer, like in the UI server. This is perhaps more conventional, and is certainly the best option in most PaaS environments (since they don't usually make private networks available to applications). The first step is really easy: just add Spring Security to the classpath in the Maven POM:

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  ...
</dependencies>
```

Re-launch the resource server and, hey presto! It's secure:

```
$ curl -v localhost:9000
< HTTP/1.1 401 Unauthorized
< WWW-Authenticate: Basic realm="Spring"
...
{"timestamp":1420544006458,"status":401,"error":"Unauthorized","message":"Full authentication is required to access this resource","path":"/"}
```

So all we need to do is teach the client to send credentials with every request.

## Token Authentication

The internet, and people's Spring backend projects, are littered with custom token-based authentication solutions. Spring Security provides a barebones `Filter` implementation to get you started on your own (see for example [`AbstractPreAuthenticatedProcessingFilter`](https://github.com/spring-projects/spring-security/blob/master/web/src/main/java/org/springframework/security/web/authentication/preauth/AbstractPreAuthenticatedProcessingFilter.java) and [`TokenService`](https://github.com/spring-projects/spring-security/blob/master/core/src/main/java/org/springframework/security/core/token/TokenService.java)). There is no canonical implementation in Spring Security though, and one of the reasons why is probably that there's an easier way.

Remember from [Part II][second] of this series that Spring Security uses the `HttpSession` to store authentication data by default. It doesn't interact directly with the session though: there's an abstraction layer ([`SecurityContextRepository`](https://github.com/spring-projects/spring-security/blob/master/web/src/main/java/org/springframework/security/web/context/SecurityContextRepository.java)) in between that you can use to change the storage backend. If we can point that repository, in our resource server, to a store with an authentication verified by our UI, then we have a way to share authentication between the two servers. The UI server already has such a store (the `HttpSession`), so if we can distribute that store and open it up to the resource server, we have most of a solution.

### Spring Session

That part of the solution is pretty easy with [Spring Session](https://github.com/spring-projects/spring-session/). All we need is a shared data store (Redis is supported out of the box), and a few lines of configuration in the servers to set up a `Filter`.

In the UI application we need to add some dependencies to our [POM](https://github.com/dsyer/spring-security-angular/blob/master/spring-session/ui/pom.xml):

```xml
<dependency>
  <groupId>org.springframework.session</groupId>
  <artifactId>spring-session</artifactId>
  <version>1.0.0.RELEASE</version>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-redis</artifactId>
</dependency>
```

and then add the `Filter`:

```java
@SpringBootApplication
@RestController
@EnableRedisHttpSession
public class UiApplication {

  public static void main(String[] args) {
    SpringApplication.run(UiApplication.class, args);
  }

  ...

}
```

The `@EnableRedisHttpSession` is provided by Spring Session, and Spring Boot supplies a redis connection (a URL and credentials can be configured using environment variables or configuration files).

With that 1 line of code in place and a Redis server running on localhost you can run the UI application, login with some valid user credentials, and the session data (the authentication and CSRF token) will be stored in redis.

> Tip: if you don't have a redis server running locally you can easily spin one up with [Docker](https://www.docker.com/) (on Windows or MacOS this requires a VM). There is a [`fig.yml`](http://www.fig.sh/) file in the [source code in Github](https://github.com/dsyer/spring-security-angular/tree/master/spring-session/fig.yml) which you can run really easily on the command line with `fig up`.

## Sending a Custom Token from the UI

The only missing piece is the transport mechanism for the key to the data in the store. The key is the `HttpSession` ID, so if we can get hold of that key in the UI client, we can send it as a custom header to the resource server. So the "home" controller would need to change so that it sends the header as part of the HTTP request for the greeting resource. For example:

```javascript
angular.module('hello', [ 'ngRoute' ])
...
.controller('home', function($scope, $http) {
	$http.get('token').success(function(token) {
		$http({
			url : 'http://localhost:9000',
			method : 'GET',
			headers : {
				'X-Auth-Token' : token.token
			}
		}).success(function(data) {
			$scope.greeting = data;
		});
	})
});
```

(A more elegant solution might be to grab the token as needed, and use an Angular [interceptor](https://docs.angularjs.org/api/ng/service/$http) to add the header to every request to the resource server. The interceptor definition could then be abstracted instead of doing it all in one place and cluttering up the business logic.)

Instead of going directly to "http://localhost:9000" we have wrapped that call in the success callback of a call to a new custom endpoint on the UI server at "/token". The implementation of that is trivial:

```java
@SpringBootApplication
@RestController
@EnableRedisHttpSession
public class UiApplication {

  public static void main(String[] args) {
    SpringApplication.run(UiApplication.class, args);
  }

  ...

  @RequestMapping("/token")
  @ResponseBody
  public Map<String,String> token(HttpSession session) {
    return Collections.singletonMap("token", session.getId());
  }

}
```

So the UI application is ready and will include the session ID in a header called "X-Auth-Token" for all calls to the backend.

## Authentication in the Resource Server

There is one tiny change to the resource server for it to be able to accept the custom header. The CORS filter has to nominate that header as an allowed one from remote clients, e.g.

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

  void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
    ...
    response.setHeader("Access-Control-Allow-Headers", "x-auth-token")
    ...
  }

  ...
}
```

All that remains is to pick up the custom token in the resource server and use it to authenticate our user. This turns out to be pretty straightforward because all we need to do is tell Spring Security where the session repository is, and where to look for the token (session ID) in an incoming request. First we need to add the Spring Session and Redis dependencies, and then we can set up the `Filter`:

```java
@SpringBootApplication
@RestController
@EnableRedisHttpSession
class ResourceApplication {

  ...
  
  @Bean
  HeaderHttpSessionStrategy sessionStrategy() {
    new HeaderHttpSessionStrategy();
  }

}
```

This `Filter` created is the mirror image of the one in the UI server, so it establishes Redis as the session store. The only difference is that it uses a custom `HttpSessionStrategy` that looks in the header ("X-Auth-Token" by default) instead of the default (cookie named "JSESSIONID"). 

There is one final change to the resource server to make it work with our new authentication scheme. Spring Boot default security is stateless, and we want this to store authentication in the session, so we need to be explicit in `application.yml` (or `application.properties`):

```yaml
security:
  sessions: NEVER
```

This says to Spring Security "never create a session, but use one if it is there" (it will be already be there because of the authentication in the UI).

Re-launch the resource server and open the UI up in a new browser window.

## Why Doesn't it All Work With Cookies?

We had to use a custom header and write code in the client to populate the header, which isn't terribly complicated, but it seems to contradict the advice in [Part II][second] to use cookies and sessions wherever possible. The argument there was that not to do so introduces additional unecessary complexity, and for sure the implementation we have now is the most complex we have seen so far: the technical part of the solution far outweighs the business logic (which is admittedly tiny). This is definitely a fair criticism (and one we plan to address in the next article in this series), but let's just briefly look at why it's not as simple as just using cookies and sessions for everything.

At least we are still using the session, which makes sense because Spring Security and the Servlet container know how to do that with no effort on our part. But couldn't we have continued to use cookies to transport the authentication token? It would have been nice, but there is a reason it wouldn't work, and that is that the browser wouldn't let us. You can just go poking around in the browser's cookie store from a JavaScript client, but there are some restrictions, and for good reason. In particular you don't have access to the cookies that were sent by the server as "HttpOnly" (which you will see is the case by default for session cookies). You also can't set cookies in outgoing requests, so we couldn't set a "SESSION" cookie (which is the Spring Session default cookie name), we had to use a custom "X-Session" header. Both these restrictions are for your own protection so malicious scripts cannot access your resources without proper authorization.

TL;DR the UI and resource servers do not have a common origin, so they cannot share cookies (even though we can use Spring Session to force them to share sessions).

## Conclusion

We have duplicated the features of the application in [Part II of this series][second]: a home page with a greeting fetched from a remote backend, with login and logout links in a navigation bar. The difference is that the greeting comes from a resource server that is a standalone, instead of being embedded in the UI server. This added significant complexity to the implementation, but the good news is that we have a mostly configuration-based (and practically 100% declarative) solution. We could even make the solution 100% declarative by extracting all the new code into libraries (Spring configuration and Angular custom directives). We are going to defer that interesting task for after the next couple of installments. In the [next article](https://spring.io/blog/2015/01/28/the-api-gateway-pattern-angular-js-and-spring-security-part-iv) we are going to look at a different really great way to reduce all the complexity in the current implementation: the API Gateway Pattern (the client sends all its requests to one place and authentication is handled there).

> Note: we used Spring Session here to share sessions between 2 servers that are not logically the same the same application. It's a neat trick, and it isn't possible with "regular" JEE distributed sessions.
