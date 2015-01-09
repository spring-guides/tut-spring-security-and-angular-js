# The API Gateway: Single Page Application with Spring and Angular JS

In this article we continue [our discussion][third] of how to use [Spring Security](http://projects.spring.io/spring-security) with [Angular JS](http://angularjs.org) in a "single page application". Here we show how to use [Spring Cloud](http://projects.spring.io/spring-cloud/) to build an API Gateway to control the authentication and access to the backend resources. This is the fourth in a series of articles, and you can catch up on the basic building blocks of the application or build it from scratch by reading the [first article][first], or you can just go straight to the [source code in Github](https://github.com/dsyer/spring-security-angular/tree/master/proxy). In the [last article][third] we built a simple distributed application that used [Spring Session](https://github.com/spring-projects/spring-session/) to authenticate the backend resources. In this one we make the UI server into a reverse proxy to the backend resource server, and fix the issues with the last implementation (technical complexity introduced by custom token authentication).

> Reminder: if you are working through this article with the sample application, be sure to clear your browser cache of cookies and HTTP Basic credentials. In Chrome the best way to do that for a single server is to open a new incognito window.

[first]: http://spring.io/blog/1903-spring-and-angular-js-a-secure-single-page-application (First Article in the Series)
[second]: http://spring.io/blog/1904-the-login-page-angular-js-and-spring-security-part-ii (Second Article in the Series)
[third]: http://spring.io/blog/1905-the-resource-server-angular-js-and-spring-security-part-iii (Third Article in the Series)

## Creating an API Gateway

An API Gateway is a single point of entry (and control) for front end clients, which could be browser based (like the examples in this article) or mobile. The client only has to know the URL of one server, and the backend can be refactored at will with no change, which is a significant advantage. There are other advantages in terms of centralization and control: rate limiting, authentication, auditing and logging. And implementing a simple reverse proxy is really simple with [Spring Cloud](http://projects.spring.io/spring-cloud/).

If you were following along in the code, you will know that the application implementation at the end of the [last article][third] was a bit complicated, so it's not a great place to iterate away from. But there was a halfway point which we could start from, where the backend resource wasn't yet secured with Spring Security. The source code for this is a separate project [in Github](https://github.com/dsyer/spring-security-angular/tree/master/vanilla) so we are going to start from there. It has a UI server and a resource server and they are talking to each other. The resource server doesn't have Spring Security, but it has some physical security (it is only accepting connections from localhost).

### Declarative Reverse Proxy in One Line

To turn it into an API Gateawy, the UI server needs one small tweak. Somewhere in the Spring configuration we need to add an `@EnableZuulProxy` annotation, e.g. in the main (only) [application class](https://github.com/dsyer/spring-security-angular/blob/master/proxy/ui/src/main/java/demo/UiApplication.java):

```java
@SpringBootApplication
@RestController
@EnableZuulProxy
public class UiApplication {
  ...
}
```

and in an external configuration file we need to map a local resource in the UI server to a remote one in the [external configuration](https://github.com/dsyer/spring-security-angular/blob/master/proxy/ui/src/main/resources/application.yml) ("application.yml"):

```yaml
zuul:
  routes:
    resource:
      path: /resource/**
      url: http://localhost:9000
```

This says "map paths with the pattern /resource/** in this server to the same paths in the remote server at localhost:9000". Simple and yet effective (OK so it's 6 lines including the YAML, but you don't always need that)!

All we need to make this work is the right stuff on the classpath. For that purpose we have a few new lines in our Maven POM:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-parent</artifactId>
      <version>1.0.0.BUILD-SNAPSHOT</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zuul</artifactId>
  </dependency>
  ...
</dependencies>
```

Note the use of the "spring-cloud-starter-zuul" - it's a starter POM just like the Spring Boot ones, but it governs the dependencies we need for this Zuul proxy. We are also using `<dependencyManagement>` because we want to be able to depend on all the versions of transitive dependencies being correct.

### Consuming the Proxy in the Client

With those changes in place our application still works, but we haven't actually used the new proxy yet until we modify the client. Fortunately that's trivial. We just need to go from this implementation of the "home" controller:

```javascript
angular.module('hello', [ 'ngRoute' ])
...
.controller('home', function($scope, $http) {
	$http.get('http://localhost:9000/').success(function(data) {
		$scope.greeting = data;
	})
});
```

to a local resource:

```javascript
angular.module('hello', [ 'ngRoute' ])
...
.controller('home', function($scope, $http) {
	$http.get('resource/').success(function(data) {
		$scope.greeting = data;
	})
});
```

Now when we fire up the servers everything is working and the requests are being proxied through the UI (API Gateway) to the resource server.

### Further Simplifications

Even better: we don't need the CORS filter any more in the resource server. We threw that one together pretty quickly anyway, and it should have been a red light that we had to do anything as technically focused by hand (especially where it concerns security). Fortunately it is now redundant, so we can just throw it away, and go back to sleeping at night!

## Securing the Resource Server

You might remember in the intermediate state that we started from there is no security in place for the resource server. 

> Aside: Lack of software security might not even be a problem if your network architecture mirrors the application architecture (you can just make the resource server physically inaccessible to anyone but the UI server). As a simple demonstration of that we can make the resource server only accessible on localhost. Just add this to `application.properties` in the resource server:

        server.address: 127.0.0.1

> Wow, that was easy! Do that with a network address that's only visible in your data center and you have a security solution that works for all resource servers and all user desktops.

Suppose that we decide we do need security at the software level as well (quite likely for a number of reasons). That's not going to be a problem, because all we need to do is add Spring Security as a dependency (in the [resource server POM](https://github.com/dsyer/spring-security-angular/blob/master/proxy/resource/pom.xml)):

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

That's enough to get us a secure resource server, but it won't get us a working application yet, for the same reason that it didn't in [Part III][third]: there is no shared authentication state between the two servers.

## Sharing Authentication State

We can use the same mechanism to share authentication (and CSRF) state as we did in the last, i.e. [Spring Session](https://github.com/spring-projects/spring-session/). We add the dependency to both servers as before:

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

but this time the configuration is much simpler because we can just add the same `Filter` declaration to both. First the UI server:

```java
@SpringBootApplication
@RestController
@EnableZuulProxy
public class UiApplication {

  ...

  @Bean
  public Filter sessionFilter(RedisConnectionFactory redisOperations) {
    SessionRepository sessionRepository = new RedisOperationsSessionRepository(
        redisOperations);
    SessionRepositoryFilter filter = new SessionRepositoryFilter(sessionRepository);
    return filter;
  }

}
```

and then the resource server:

```java
@SpringBootApplication
@RestController
class ResourceApplication {
  ...
  @Bean
  Filter sessionFilter(RedisConnectionFactory redisOperations) {
    SessionRepository sessionRepository = new RedisOperationsSessionRepository(
        redisOperations)
    new SessionRepositoryFilter(sessionRepository)
  }
}
```

As long as redis is still running in the background (use the [`fig.yml`]((https://github.com/dsyer/spring-security-angular/tree/master/proxy/fig.yml) if you like to start it) then the system will work.

## How Does it Work?

What is going on behind the scenes now? First we can look at the HTTP requests in the UI server (and API Gateway):

Verb | Path    | Status | Response
-----|---------|--------|---------
GET  | /       | 200    | index.html
GET  | /css/angular-bootstrap.css | 200 | Twitter bootstrap CSS
GET  | /js/angular-bootstrap.js  | 200 | Bootstrap and Angular JS
GET  | /js/hello.js              | 200 | Application logic
GET  | /user                     | 302 | Redirect to login page
GET  | /login                    | 200 | Whitelabel login page (ignored)
GET  | /resource                 | 302 | Redirect to login page
GET  | /login                    | 200 | Whitelabel login page (ignored)
GET  | /login.html               | 200 | Angular login form partial
POST | /login                    | 302 | Redirect to home page (ignored)
GET  | /user                     | 200 | JSON authenticated user
GET  | /resource                 | 200 | JSON greeting

That's identical to the sequence at the end of [Part II][second] except for the fact that the cookie names are slightly different ("SESSION" instead of "JSESSIONID") because we are using Spring Session. But the architecture is different and that last request to "/resource" is special because it was proxied to the resource server. We can see the reverse proxy in action by looking at the "/trace" endpoint (from Spring Boot Actuator, which we added with the Spring Cloud dependencies). Go to http://localhost:8080/trace in a browser and scroll to the end (if you don't have one already get a JSON plugin for your browser to make it nice and readable). You will need to authenticate with HTTP Basic (browser popup), but the same credentials are valid as for your login form. At or near the end you should see a pair of requests something like this:

```javascript
{
  "timestamp": 1420558194546,
  "info": {
    "method": "GET",
    "path": "/",
    "query": ""
    "remote": true,
    "proxy": "resource",
    "headers": {
      "request": {
        "accept": "application/json, text/plain, */*",
        "x-xsrf-token": "542c7005-309c-4f50-8a1d-d6c74afe8260",
        "cookie": "SESSION=c18846b5-f805-4679-9820-cd13bd83be67; XSRF-TOKEN=542c7005-309c-4f50-8a1d-d6c74afe8260",
        "x-forwarded-prefix": "/resource",
        "x-forwarded-host": "localhost:8080"
      },
      "response": {
        "Content-Type": "application/json;charset=UTF-8",
        "status": "200"
      }
    },
  }
},
{
  "timestamp": 1420558200232,
  "info": {
    "method": "GET",
    "path": "/resource/",
    "headers": {
      "request": {
        "host": "localhost:8080",
        "accept": "application/json, text/plain, */*",
        "x-xsrf-token": "542c7005-309c-4f50-8a1d-d6c74afe8260",
        "cookie": "SESSION=c18846b5-f805-4679-9820-cd13bd83be67; XSRF-TOKEN=542c7005-309c-4f50-8a1d-d6c74afe8260"
      },
      "response": {
        "Content-Type": "application/json;charset=UTF-8",
        "status": "200"
      }
    }
  }
},
```

The second entry there is the request from the client to the gateway on "/resource" and you can see the cookies (added by the browser) and the CSRF header (added by Angular as discussed in [Part II](second)). The first entry has `remote: true` and that means it's tracing the call to the resource server. You can see it went out to a uri path "/" and you can see that (crucially) the cookies and CSRF headers have been sent too. Without Spring Session these headers would be meaningless to the resource server, but the way we have set it up it can now use those headers to re-constitute a session with authentication and CSRF token data. So the request is permitted and we are in business!

## Conclusion

We covered quite a lot in this article but we got to a really nice place where there is a minimal amount of boilerplate code in our two servers, they are both nicely secure and the user experience isn't compromised. That alone would be a reason to use the API Gateway pattern, but really we have only scratched the surface of what that might be used for (Netflix uses it for [a lot of things](https://github.com/Netflix/zuul/wiki/How-We-Use-Zuul-At-Netflix)). Read up on [Spring Cloud](http://projects.spring.io/spring-cloud/) to find out more on how to make it easy to add more features to the gateway. The next article in this series will extend the application architecture a bit by extracting the authentication responsibilities to a separate server (the Single Sign On pattern).
