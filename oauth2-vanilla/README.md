# Single Sign On with OAuth2: Single Page Application with Spring and Angular JS

In this article we continue [our discussion][fourth] of how to use [Spring Security](http://projects.spring.io/spring-security) with [Angular JS](http://angularjs.org) in a "single page application". Here we show how to use [Spring Security OAuth](http://projects.spring.io/spring-security-oauth/) together with [Spring Cloud](http://projects.spring.io/spring-cloud/) to extend our API Gateway to do Single Sign On and OAuth2 token authentication to backend resources. This is the fifth in a series of articles, and you can catch up on the basic building blocks of the application or build it from scratch by reading the [first article][first], or you can just go straight to the [source code in Github](https://github.com/dsyer/spring-security-angular/tree/master/oauth2). In the [last article][fourth] we built a small distributed application that used [Spring Session](https://github.com/spring-projects/spring-session/) to authenticate the backend resources and [Spring Cloud](http://projects.spring.io/spring-cloud/) to implement an embedded API Gateway in the UI server. In this article we extract the authentication responsibilities to a separate server to make our UI server the first of potentially many Single Sign On applications to the authorization server. This is a common pattern in many applications these days, both in the enterprise and in social startups. We will use an OAuth2 server as the authenticator, so that we can also use it to grant tokens for the backend resource server. Spring Cloud will automatically relay the access token to our backend, and enable us to further simplify the implementation of both the UI and resource servers.

> Reminder: if you are working through this article with the sample application, be sure to clear your browser cache of cookies and HTTP Basic credentials. In Chrome the best way to do that for a single server is to open a new incognito window.

[first]: http://spring.io/blog/1903-spring-and-angular-js-a-secure-single-page-application (First Article in the Series)
[second]: http://spring.io/blog/1904-the-login-page-angular-js-and-spring-security-part-ii (Second Article in the Series)
[third]: http://spring.io/blog/1905-the-resource-server-angular-js-and-spring-security-part-iii (Third Article in the Series)
[fourth]: http://spring.io/blog/1906-the-api-gateway-pattern-angular-js-and-spring-security-part-iv (Fourth Article in the Series)

## Creating an OAuth2 Authorization Server

Our first step is to create a new server to handle authentication and token management. Following the steps in [Part I][first] we can begin with [Spring Boot Initializr](http://start.spring.io). E.g. using curl on a UN*X like system:

```
$ curl start.spring.io/starter.tgz -d style=web -d style=security \
-d name=authserver | tar -xzvf - 
```

You can then import that project (it's a normal Maven Java project by default) into your favourite IDE, or just work with the files and "mvn" on the command line.

### Adding the OAuth2 Dependencies

We need to add the [Spring OAuth](http://projects.spring.io/spring-security-oauth) dependencies, so in our [POM](https://github.com/dsyer/spring-security-angular/blob/master/oauth2/authserver/pom.xml) we add:

```xml
<dependency>
  <groupId>org.springframework.security.oauth</groupId>
  <artifactId>spring-security-oauth2</artifactId>
  <version>2.0.5.RELEASE</version>
</dependency>
```

The authorization server is pretty easy to implement. A minimal version looks like this:

```java
@SpringBootApplication
public class AuthserverApplication extends WebMvcConfigurerAdapter {

	public static void main(String[] args) {
		SpringApplication.run(AuthserverApplication.class, args);
	}
	
	@Configuration
	@EnableAuthorizationServer
	protected static class OAuth2Config extends AuthorizationServerConfigurerAdapter {

		@Autowired
		private AuthenticationManager authenticationManager;
		
		@Override
		public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
			endpoints.authenticationManager(authenticationManager);
		}

@Override
		public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
			clients.inMemory()
					.withClient("acme")
					.secret("acmesecret")
					.authorizedGrantTypes("authorization_code", "refresh_token",
							"password").scopes("openid");
		}

}
```

We only had to do 2 things (after adding `@EnableAuthorizationServer`):

* Register a client "acme" with a secret and some authorized grant types including "authorization_code".

* Inject the default `AuthenticationManager` from Spring Boot autoconfiguration and wire it into the OAuth2 endpoints.

Now let's get it running on port 9999, with a predictable password for testing:

```properties
server.port=9999
security.user.password=password
server.contextPath=/uaa
```

We also set the context path so that it doesn't use the default ("/") because otherwise you can get cookies for other servers on localhost being sent to the wrong server. So get the server running and we can make sure it is working:

```
$ mvn spring-boot:run
```

or start the `main()` method in your IDE.

### Testing the Authorization Server

Our server is using the Spring Boot default security settings, so like the server in [Part I][first] it will be protected by HTTP Basic authentication. To initiate an [authorization code token grant](https://tools.ietf.org/html/rfc6749#section-1.3.1) you visit the authorization endpoint, e.g. at http://localhost:9999/uaa/oauth/authorize?response_type=code&client_id=acme&redirect_uri=http://example.com once you have authenticated you will get a redirect to example.com with an authorization code attached, e.g. http://example.com/?code=jYWioI.

> Note: for the purposes of this sample application we have created a client "acme" with no registered redirect, which is what enables us to get a redirect the example.com. In a production application you should always register a redirect (and use HTTPS).

The code can be exchanged for an access token using the "acme" client credentials on the token endpoint:

```
$ curl acme:acmesecret@localhost:9999/uaa/oauth/token  \
-d grant_type=authorization_code -d client_id=acme     \
-d redirect_uri=http://example.com -d code=jYWioI
{"access_token":"2219199c-966e-4466-8b7e-12bb9038c9bb","token_type":"bearer","refresh_token":"d193caf4-5643-4988-9a4a-1c03c9d657aa","expires_in":43199,"scope":"openid"}
```

The access token is a UUID ("2219199c..."), backed by an in-memory token store in the server. We also got a refresh token that we can use to get a new access token when the current one expires.

> Note: since we allowed "password" grants for the "acme" client we can also get a token directly from the token endpoint using curl and user credentials instead of an authorization code. This is not suitable for a browser based client, but it's useful for testing.

If you followed the link above you would have seen the whitelabel UI provided by Spring OAuth. To start with we will use this and we can come back later to beef it up like we did in [Part II][second] for the self-contained server.

<span id="changing-the-resource-server"></span>
## Changing the Resource Server

If we follow on from [Part IV][fourth], our resource server is using [Spring Session](https://github.com/spring-projects/spring-session/) for authentication, so we can take that out and replace it with Spring OAuth. We also need to remove the Spring Session and Redis dependencies, so replace this:

```xml
<dependency>
  <groupId>org.springframework.session</groupId>
  <artifactId>spring-session</artifactId>
  <version>1.0.0.RC1</version>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-redis</artifactId>
</dependency>
```

with this:

```xml
<dependency>
  <groupId>org.springframework.security.oauth</groupId>
  <artifactId>spring-security-oauth2</artifactId>
</dependency>
```

and then remove the session `Filter` from the [main application class](https://github.com/dsyer/spring-security-angular/blob/master/vanilla-oauth2/resource/src/main/groovy/demo/ResourceApplication.groovy), replacing it with the convenient `@EnableOAuth2ResourceServer` annotation (from Spring Cloud Security):

```java
@SpringBootApplication
@RestController
@EnableOAuth2Resource
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

That much is enough to get us a protected resource. Run the application and hit the home page with a command line client:

```
$ curl -v localhost:9000
> GET / HTTP/1.1
> User-Agent: curl/7.35.0
> Host: localhost:9000
> Accept: */*
> 
< HTTP/1.1 401 Unauthorized
...
< WWW-Authenticate: Bearer realm="null", error="unauthorized", error_description="An Authentication object was not found in the SecurityContext"
< Content-Type: application/json;charset=UTF-8
{"error":"unauthorized","error_description":"An Authentication object was not found in the SecurityContext"}
```

and you will see a 401 with a "WWW-Authenticate" header indicating that it wants a bearer token. We are going to add a small amount of external configuration (in "application.properties") to allow the resource server to decode the tokens it is given and authenticate a user:

```properties
...
oauth2.resource.userInfoUri: http://localhost:9999/uaa/user
```

This tells the server that it can use the token to access a "/user" endpoint and use that to derive authentication information (it's a bit like the ["/me" endpoint](https://developers.facebook.com/docs/graph-api/reference/v2.2/user/?locale=en_GB) in the Facebook API). Effectively it provides a way for the resource server to decode the token, as expressed by the `ResourceServerTokenServices` interface in Spring OAuth2.

> Note: the `userInfoUri` is by far not the only way of hooking a resource server up with a way to decode tokens. In fact it's sort of a lowest common denominator (and not part of the spec), but quite often available from OAuth2 providers (like Facebook, Cloud Foundry, Github), and other choices are available. For instance you can encode the user authentication in the token itself (e.g. with [JWT][JWT]), or use a shared backend store. There is also a `/token_info` endpoint in CloudFoundry, which provides more detailed information than the user info endpoint, but which requires more thorough authentication. Different options (naturally) provide different benefits and trade-offs, but a full discussion of those is outside the scope of this article.

## Implementing the User Endpoint

On the authorization server we can easily add that endpoint

```java
@SpringBootApplication
@RestController
@EnableResourceServer
public class AuthserverApplication {

  @RequestMapping("/user")
  public Principal user(Principal user) {
    return user;
  }

  ...

}

```

We added a `@RequestMapping` the same as the UI server in [Part II][second], and also the `@EnableResourceServer` annotation from Spring OAuth, which by default secures everything in an authorization server except the "/oauth/*" endpoints.

With that endpoint in place we can test it and the greeting resource, since they both now accept bearer tokens that were created by the authorization server:

```
$ TOKEN=2219199c-966e-4466-8b7e-12bb9038c9bb
$ curl -H "Authorization: Bearer $TOKEN" localhost:9000
{"id":"03af8be3-2fc3-4d75-acf7-c484d9cf32b1","content":"Hello World"}
$ curl -H "Authorization: Bearer $TOKEN" localhost:9999/uaa/user
{"details":...,"principal":{"username":"user",...},"name":"user"}
```

(substitute the value of the access token that you obtain from your own authorization server to get that working yourself).

## The UI Server

The final piece of this application we need to complete is the UI server, extracting the authentication part and delegating to the authorization server. So, as with [the resource server](#changing-the-resource-server), we first need to remove the Spring Session and Redis dependencies and replace them with Spring OAuth2.

Once that is done we can remove the session filter and the "/user" endpoint as well, and set up the application to redirect to the authorization server:

```java
@SpringBootApplication
@EnableZuulProxy
@EnableOAuth2Sso
public class UiApplication {

	public static void main(String[] args) {
		SpringApplication.run(UiApplication.class, args);
	}

	@Configuration
	@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
	protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
```

Recall from [Part IV][fourth] that the UI server acts an API Gateway and we can declare the route mappings in YAML. So the "/user" endpoint can be proxied to the authorization server:

```yaml
zuul:
  routes:
    resource:
      path: /resource/**
      url: http://localhost:9000
    user:
      path: /user/**
      url: http://localhost:9999/uaa/user
```

### In the Client

There are some minor tweaks to the UI application on the front end that we still need to make to trigger the redirect to the authorization server. The first is in the navigation bar in "index.html" where the "login" link changes from an Angular route:

```html
<div ng-controller="navigation" class="container">
  <ul class="nav nav-pills" role="tablist">
    ...
    <li><a href="#/login">login</a></li>
    ...
  </ul>
</div>
```

to a plain HTML link

```html
<div ng-controller="navigation" class="container">
  <ul class="nav nav-pills" role="tablist">
    ...
    <li><a href="login">login</a></li>
    ...
  </ul>
</div>
```

The "/login" endpoint that this goes to is handled by Spring Security and if the user is not authenticated it will result in a redirect to the authorization server.

We can also remove the definition of the `login()` function in the "navigation" controller, and the "/login" route from the Angular configuration, which simplifies the implementation a bit:

```javascript
angular.module('hello', [ 'ngRoute' ]).config(function($routeProvider) {

	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'home'
	}).otherwise('/');

}). // ...
.controller('navigation',

function($rootScope, $scope, $http, $location, $route) {

  $http.get('user').success(function(data) {
    if (data.name) {
      $rootScope.authenticated = true;
    } else {
      $rootScope.authenticated = false;
    }
  }).error(function() {
    $rootScope.authenticated = false;
  });

  $scope.credentials = {};

  $scope.logout = function() {
    $http.post('logout', {}).success(function() {
      $rootScope.authenticated = false;
      $location.path("/");
    }).error(function(data) {
      $rootScope.authenticated = false;
    });
  }

});
```

## How Does it Work?

Run all the servers together now, and visit the UI in a browser at [http://localhost:8080](http://localhost:8080). Click on the "login" link and you will be redirected to the authorization server to authenticate (HTTP Basic popup) and approve the token grant (whitelabel HTML), before being redirected to the home page in the UI with the greeting fetched from the OAuth2 resource server using the same token as we authenticated the UI with.

The interactions between the browser and the backend can be seen in your browser if you use some developer tools (usually F12 opens this up, works in Chrome by default, requires a plugin in Firefox). Here's a summary:

Verb | Path    | Status | Response
-----|---------|--------|---------
GET  | /       | 200    | index.html
GET  | /css/angular-bootstrap.css | 200 | Twitter bootstrap CSS
GET  | /js/angular-bootstrap.js  | 200 | Bootstrap and Angular JS
GET  | /js/hello.js              | 200 | Application logic
GET  | /home.html                | 200 | HTML partial for home page
GET  | /user                     | 302 | Redirect to login page
GET  | /login                    | 302 | Redirect to auth server
GET  | (uaa)/oauth/authorize     | 401 | (ignored)
GET  | /resource                 | 302 | Redirect to login page
GET  | /login                    | 302 | Redirect to auth server
GET  | (uaa)/oauth/authorize     | 401 | (ignored)
GET  | /login                    | 302 | Redirect to auth server
GET  | (uaa)/oauth/authorize     | 200 | HTTP Basic auth happens here
POST | (uaa)/oauth/authorize     | 302 | User approves grant, redirect to /login
GET  | /login                    | 302 | Redirect to home page
GET  | /user                     | 200 | (Proxied) JSON authenticated user
GET  | /home.html                | 200 | HTML partial for home page
GET  | /resource                 | 200 | (Proxied) JSON greeting

The requests prefixed with (uaa) are to the authorization server. The responses that are marked "ignored" are responses received by Angular in an XHR call, and since we aren't processing that data they are dropped on the floor. We do look for an authenticated user in the case of the "/user" resource, but since it isn't there in the first call, that response is dropped.

In the "/trace" endpoint of the UI (scroll down to the bottom) you will see the proxied backend requests to "/user" and "/resource", with `remote:true` and the bearer token instead of the cookie (as it would have been in [Part IV][fourth]) being used for authentication. Spring Cloud Security has taken care of this for us: by recognising that we has `@EnableOAuth2Sso` and `@EnableZuulProxy` it has figured out that (by default) we want to relay the token to the proxied backends.

## The Logout Experience

If you click on the "logout" link you will see that the home page changes (the greeting is no longer displayed) so the user is no longer authenticated with the UI server. Click back on "login" though and you actually *don't* need to go back through the authentication and approval cycle in the authorization server (because you haven't logged out of that). Opinions will be divided as to whether that is a desirable user experience, and it's a notoriously tricky problem (Single Sign Out: [Science Direct article](http://www.sciencedirect.com/science/article/pii/S2214212614000179) and [Shibboleth docs](https://wiki.shibboleth.net/confluence/display/SHIB2/SLOIssues)). The ideal user experience might not be technically feasible, and you also have to be suspicious sometimes that users really want what they say they want. "I want 'logout' to log me out" sounds simple enough, but the obvious response is, "Logged out of what? Do you want to be logged out of *all* the systems controlled by this SSO server, or just the one that you clicked the 'logout' link in?" We don't have room to discuss this topic more broadly here but it does deserve more attention. If you are interested then there is some discussion of the principles and some (fairly unappetising) ideas about implementations in the [Open ID Connect](http://openid.net/connect/) specification.

## Conclusion

This is almost the end of our shallow tour through the Spring Security and Angular JS stack. We have a nice architecture now with clear responsibilities in three separate components, UI/API Gateway, resource server and authorization server/token granter. The amount of non-business code in all layers is now minimal, and it's easy to see where to extend and improve the implementation with more business logic. The next steps will be to tidy up the UI in our authorization server, and probably add some more tests, including tests on the JavaScript client. Another interesting task is to extract all the boiler plate code and put it in a library (e.g. "spring-security-angular") containing Spring Security and Spring Session autoconfiguration and some webjars resources for the navigation controller in the Angular piece. Having read the articles in thir series, anyone who was hoping to learn the inner workings of either Angular JS or Spring Security will probably be disappointed, but if you wanted to see how they can work well together and how a little bit of configuration can go a long way, then hopefully you will have had a good experience.  [Spring Cloud](http://projects.spring.io/spring-cloud/) is new and these samples required snapshots when they were written, but there are release candidates available and a GA release coming soon, so check it out and send some feedback [via Github](https://github.com/spring-cloud) or [gitter.im](https://gitter.im/spring-cloud/spring-cloud).

## Addendum: Bootstrap UI and JWT Tokens for the Authorization Server

You will find another version of this application in the [source code in Github](https://github.com/dsyer/spring-security-angular/tree/master/oauth2) which has a pretty login page and user approval page implemented similarly to the way we did the login page in [Part II][second]. It also uses [JWT][JWT] to encode the tokens, so instead of using the "/user" endpoint, the resource server can pull enough information out of the token itself to do a simple authentication. The browser client still uses it, proxied through the UI server, so that it can determine if a user is authenticated (it doesn't need to do that very often, compared to the likely number of calls to a resource server in a real application).

[JWT]: http://en.wikipedia.org/wiki/JWT (Jason Web Tokens)
