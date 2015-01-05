# The Login Page: Single Page Application with Spring and Angular JS

In this article we continue [our discussion][first] of how to use [Spring Security](http://projects.spring.io/spring-security) with [Angular JS](http://angularjs.org) in a "single page application". Here we show how to use Angular JS to authenticate a user via a form and fetch a secure resource to render in the UI. This is the second in a series of articles, and you can catch up on the basic building blocks of the application or build it from scratch by reading the [first article][first], or you can just go straight to the [source code in Github](https://github.com/dsyer/spring-security-angular/tree/master/single). In the first article we built a simple application that used HTTP Basic authentication to protect the backend resources. In this one we add a login form, give the user some control over whether to authenticate or not, and fix the issues with the first iteration (principally lack of CSRF protection).

> Reminder: if you are working through this article with the sample application, be sure to clear your browser cache of
> cookies and HTTP Basic credentials. In Chrome the best way to do that for a single server is to open a new incognito
> window.

[first]: http://spring.io/blog/1903-spring-and-angular-js-a-secure-single-page-application (First Article in the Series)

## Add Navigation to the Home Page

The core of a single page application is a static "index.html". We already had a really basic one, but for this application we need to offer some navigation features (login, logout, home), so let's modify it (in "src/main/resources/static"):

```html
<!doctype html>
<html>
<head>
<title>Hello AngularJS</title>
<link
	href="css/angular-bootstrap.css"
	rel="stylesheet">
<style type="text/css">
[ng\:cloak], [ng-cloak], .ng-cloak {
	display: none !important;
}
</style>
</head>

<body ng-app="hello" ng-cloak class="ng-cloak">
	<div ng-controller="navigation" class="container">
		<ul class="nav nav-pills" role="tablist">
			<li class="active"><a href='#/'>home</a></li>
			<li><a href='#/login'>login</a></li>
			<li ng-show="authenticated"><a href='' ng-click="logout()">logout</a></li>
		</ul>
	</div>
	<div ng-view class="container"></div>
	<script src="js/angular-bootstrap.js" type="text/javascript"></script>
	<script src="js/hello.js"></script>
</body>
</html>
```

It's not much different than the original in fact. Salient features:

* There is a `<ul>` for the navigation bar. All the links come straight back to the home page, but in a way that Angular will recognize once we get it set up with "routes".

* All the content is going to be added as "partials" in the `<div>` labelled "ng-view".
  
* The "ng-cloak" has been moved up to the body because we want to hide the whole page until Angular can work out which bits to render. Otherwise the menus and content can "flicker" as they are moved around when the page loads.
  
* As in the [first article][first], the front end assets "angular-bootstrap.css" and "angular-bootstrap.js" are generated from JAR libraries at build time.

## Add Navigation to the Angular Application

Let's modify the "hello" application (in "src/main/resources/public/js/hello.js") to add some navigation features. We can start by adding some configuration for routes, so that the links in the home page actually do something. E.g.

```javascript
angular.module('hello', [ 'ngRoute' ])
  .config(function($routeProvider) {

	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'home'
	}).when('/login', {
		templateUrl : 'login.html',
		controller : 'navigation'
	}).otherwise('/');

  })
  .controller('navigation', function() {})
  .controller('home', function($scope, $http) {
  $http.get('/resource/').success(function(data) {
    $scope.greeting = data;
  })
});
```

We added a dependency on an Angular module called ["ngRoute"](https://docs.angularjs.org/api/ngRoute) and this allowed us to inject a magic `$routeProvider` into the config function (Angular does dependency injection by naming convention, and recognizes the names of your function parameters). The `$routeProvider` is then used inside the function to set up links to "/" (the "home" controller) and "/login" (the "login" controller). The "templateUrls" are relative paths from the root of the routes (i.e. "/") to "partial" views that will be used to render the model created by each controller.

In order to use the "ngRoute" module, we need to add a line to the "wro.xml" configuration that builds the static assets (in "src/main/wro"):

```xml
<groups xmlns="http://www.isdc.ro/wro">
  <group name="angular-bootstrap">
    ...
    <js>webjar:angularjs/1.3.8/angular-route.min.js</js>
   </group>
</groups>
```

### The Greeting

The greeting content from the old home page can go in "home.html" (right next to the "index.html" in "src/main/resources/static"):

```html
<h1>Greeting</h1>
<div ng-controller="home" ng-show="authenticated">
	<p>The ID is {{greeting.id}}</p>
	<p>The content is {{greeting.content}}</p>
</div>
<div  ng-show="!authenticated">
	<p>Login to see your greeting</p>
</div>
```

Since the user now has the choice whether to login or not (before it was all controlled by the browser), we need to distinguish in the UI between content that is secure and that which is not. We have anticipated this by adding references to an (as yet non-existent) `authenticated` variable.

### The Login Form

The login form goes in "login.html":

```html
<div class="alert alert-danger" ng-show="error">
	There was a problem logging in. Please try again.
</div>
<form role="form" ng-submit="login()">
	<div class="form-group">
		<label for="username">Username:</label> <input type="text"
			class="form-control" id="username" name="username" ng-model="credentials.username"/>
	</div>
	<div class="form-group">
		<label for="password">Password:</label> <input type="password"
			class="form-control" id="password" name="password" ng-model="credentials.password"/>
	</div>
	<button type="submit" class="btn btn-primary">Submit</button>
</form>
```

This is a very standard login form, with 2 inputs for username and password and a button for submitting the form via [`ng-submit`](https://docs.angularjs.org/api/ng/directive/ngSubmit). There is also an error message, shown only if the angular `$scope` contains an `error`. The form controls use [`ng-model`](https://docs.angularjs.org/api/ng/directive/ngModel) to pass data between the HTML and the Angular controller, and in this case we are using a `credentials` object to hold the username and pasword. According to the routes we defined the login form is linked with the "navigation" controller, which is so far empty, so let's head over to that to fill in some gaps.


## The Authentication Process

To support the login form we just added we need to add some more features. On the client side these will be implemented in the "navigation" controller, and on the server it will be Spring Security configuration.

### Submitting the Login Form

To submit the form we need to define the `login()` function that we referenced already in the form via `ng-submit`, and the `credentials` object that we referenced via `ng-model`. Let's flesh out the "navigation" controller in "hello.js" (ommitting the routes config and the "home" controller):

```javascript
angular.module('hello', [ 'ngRoute' ]) // ... ommitted code
.controller('navigation',

  function($rootScope, $scope, $http, $location) {

  var authenticate = function(callback) {

    $http.get('user').success(function(data) {
      if (data.name) {
        $rootScope.authenticated = true;
      } else {
        $rootScope.authenticated = false;
      }
      callback && callback();
    }).error(function() {
      $rootScope.authenticated = false;
      callback && callback();
    });

  }

  authenticate();
  $scope.credentials = {};
  $scope.login = function() {
    $http.post('login', $.param($scope.credentials), {
      headers : {
        "content-type" : "application/x-www-form-urlencoded"
      }
    }).success(function(data) {
      authenticate(function() {
        if ($rootScope.authenticated) {
          $location.path("/");
          $scope.error = false;
        } else {
          $location.path("/login");
          $scope.error = true;
        }
      });
    }).error(function(data) {
      $location.path("/login");
      $scope.error = true;
      $rootScope.authenticated = false;
    })
  };
});
```

All of the code in the "navigation" controller will be executed when the page loads because the `<div>` containing the menu bar is visible and is decorated with `ng-controller="navigation"`. In addition to initializing the `credentials` object, it defines 2 functions, the `login()` that we need in the form, and a helper function `authenticate()` which tries to load a "user" resource from the backend. The `authenticate()` function is called when the controller is loaded to see if the user is actually already authenticated (e.g. if he had refreshed the browser in the middle of a session). We need the `authenticate()` function because authentication is done by the server, and we can't trust the browser to keep track of it.

The `authenticate()` function sets an application-wide flag called `authenticated` which we have already used in our "home.html" to control which parts of the page are rendered. We do this using [`$rootScope`](https://docs.angularjs.org/api/ng/service/$rootScope) because it's convenient and easy to follow, and we need to share the `authenticated` flag between the "navigation" and the "home" controllers. Angular experts might prefer to share data through a shared user-defined service (but it ends up being the same mechanism).

The `login()` function also sets a local `$scope.error` flag accordingly when we get the result of the authentication. This is used to control the display of the error message above the login form.

### The Currently Authenticated User

To service the `authenticate()` function we need to add a new endpoint to the backend:

```java
@SpringBootApplication
@RestController
public class UiApplication {
  
  @RequestMapping("/user")
  public Principal user(Principal user) {
    return user;
  }

  ...

}
```

This is a useful trick in a Spring Security application. If the "/user" resource is reachable then it will return the currently authenticated user (an [`Authentication`][authentication]), and otherwise Spring Security will intercept the request and send it through am [`AuthenticationEntryPoint`][authenticationentrypoint].

An alternative implementation of this `authenticate()` (client side) and "/user" (server side) could just check the HTTP response from a simple GET of any protected resource (e.g. a 401 means `authenticated=false`). This is slightly fragile because it depends on non-standard configuration of the server using a custom [`AuthenticationEntryPoint`][authenticationentrypoint].

[authenticationentrypoint]: https://github.com/spring-projects/spring-security/blob/master/web/src/main/java/org/springframework/security/web/AuthenticationEntryPoint.java (AuthenticationEntryPoint)
[authentication]: https://github.com/spring-projects/spring-security/blob/master/core/src/main/java/org/springframework/security/core/Authentication.java (Authentication)

### Handling the Login Request on the Server

Spring Security makes it easy to handle the login request. We just need to add some configuration to our application (e.g. as an inner class):

```java
@Configuration
@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.formLogin().and().authorizeRequests()
        .antMatchers("/**/*.html", "/").permitAll().anyRequest()
        .authenticated();
  }
}
```

This is a standard Spring Boot with Spring Security customization, just adding a login form, and allowing anonymous access to the static (HTML) resources (the CSS and JS resources are already accessible by default). The HTML resources need to be available to anonymous users, not just ignored by Spring Security, for reasons that will become clear.

## CSRF Protection

The application is almost ready to use, but if you try running it you will find that the login form doesn't work. Look at the responses in the browser you will see why:

```
POST /login HTTP/1.1
...
Content-Type: application/x-www-form-urlencoded

username=user&password=password

HTTP/1.1 403 Forbidden
Set-Cookie: JSESSIONID=3941352C51ABB941781E1DF312DA474E; Path=/; HttpOnly
Content-Type: application/json;charset=UTF-8
Transfer-Encoding: chunked
...

{"timestamp":1420467113764,"status":403,"error":"Forbidden","message":"Expected CSRF token not found. Has your session expired?","path":"/login"}
```

That's good because it means that Spring Security's built-in CSRF protection has kicked in to prevent us from shooting ourselves in the foot. All it wants is a token sent to it in a header called "X-CSRF". The value of the CSRF token was available server side in the `HttpRequest` attributes from the initial request that loaded the home page. To get it to the client we could render it using a dynamic HTML page on the server, or expose it via a custom endpoint, or else we could send it as a cookie. The last choice is the best because Angular has [built in support for CSRF](https://docs.angularjs.org/api/ng/service/$http) (which it calls "XSRF") based on cookies.

So all we need on the server is a custom filter that will send the cookie. Angular wants the cookie name to be "XSRF-TOKEN" and Spring Security provides it as a request attribute, so we just need to transfer the value from a request attribute to a cookie:

```java
public class CsrfHeaderFilter() extends OncePerRequestFilter() {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
      CsrfToken csrf = (CsrfToken) request.getAttribute(CsrfToken.class
          .getName());
      if (csrf != null) {
        Cookie cookie = WebUtils.getCookie(request, "XSRF-TOKEN");
        String token = csrf.getToken();
        if (cookie==null || token!=null && !token.equals(cookie.getValue())) {
          cookie = new Cookie("XSRF-TOKEN", token);
          cookie.setPath("/");
          response.addCookie(cookie);
        }
      }
      filterChain.doFilter(request, response);
    }
  };
}
```

To finish the job and make it completely generic we should be careful to set the cookie path to the context path of the application (instead of hard-coded to "/"), but this is good enough for the application we are working on. 

We need to install this filter in the application somewhere, and it needs to go after the Spring Security `CsrfFilter` so that the request attribute is available. Since we have Spring Security protecting these resources there's no better place than in the Spring Security filter chain, e.g. extending the `SecurityConfiguration` above:

```java
@Configuration
@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.formLogin().and().authorizeRequests()
        .antMatchers("/**/*.html", "/").permitAll().anyRequest()
        .authenticated().and().csrf()
        .addFilterAfter(csrfHeaderFilter(), CsrfFilter.class);
  }
}
```

The other thing we have to do on the server is tell Spring Security to expect the CSRF token in the format that Angular wants to send it back (a header called "X-XRSF-TOKEN" instead of the default "X-CSRF-TOKEN"). We do this by customizing the CSRF filter:

```java
@Configuration
@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.formLogin()
        ...
        .csrf().csrfTokenRepository(csrfTokenRepository())
        ...
        ;
  }
  private CsrfTokenRepository csrfTokenRepository() {
    HttpSessionCsrfTokenRepository repository = new HttpSessionCsrfTokenRepository();
    repository.setHeaderName("X-XSRF-TOKEN");
    return repository;
  }
}
```

With those changes in place we don't need to do anything on the client side and login is now working.

## Logout

The application is almost finished functionally. The last thing we need to do is implement the logout feature that we sketched in the home page. Here's a reminder what the navigation bar looks like:

```html
<div ng-controller="navigation" class="container">
  <ul class="nav nav-pills" role="tablist">
    <li class="active"><a href='#/'>home</a></li>
    <li><a href='#/login'>login</a></li>
    <li ng-show="authenticated"><a href='' ng-click="logout()">logout</a></li>
  </ul>
</div>
```

If the user is authenticated then we show a "logout" link and hook it to a `logout()` function in the "navigation" controller. The implementation of the function is relatively simple:

```javascript
$scope.logout = function() {
  $http.post('logout', {}).success(function() {
    $rootScope.authenticated = false;
    $location.path("/");
  }).error(function(data) {
    $rootScope.authenticated = false;
  });
}
```

It sends an HTTP POST to "/logout" which we now need to implement on the server. This is straightforward:

```java
@Configuration
@Order(SecurityProperties.ACCESS_OVERRIDE_ORDER)
protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.formLogin().and().logout()
        ...
        ;
  }
}
```

(we just added `.logout()` to the `HttpSecurity` configuration builder).

## How Does it Work

The interactions between the browser and the backend can be seen in your browser if you use some developer tools (usually F12 opens this up, works in Chrome by default, requires a plugin in Firefox). Here's a summary:

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

The responses that are marked "ignored" above are HTML responses received by Angular in an XHR call, and since we aren't processing that data the HTML is dropped on the floor. We do look for an authenticated user in the case of the "/user" resource, but since it isn't there in the first call, the response is dropped.

Look more closely at the requests and you will see that they all have cookies. If you start with a clean browser (e.g. incognito in Chrome), the very first request has no cookies going off to the server, but the server sends back "Set-Cookie" for "JSESSIONID" (the regular `HttpSession`) and "X-XSRF-TOKEN" (the CRSF cookie that we set up above). Subsequent requests all have those cookies, and they are important: the application doesn't work without them, and they are providing some really basic security features (authentication and CSRF protection). The values of the cookies change when the user authenticates (after the POST) and this is another important security feature (preventing [session fixation attacks](http://en.wikipedia.org/wiki/Session_fixation)).

> Note: it is not adequate for CSRF protection to rely on a cookie being sent back to the server because cookies can be
> tampered with. Since in our application the CSRF token is sent to the client as a cookie we will see it being sent
> back automatically by the browser, but it is the header that provides the protection.

## Help, How is My Application Going to Scale?

"But wait..." you are saying, "isn't it bad to use session state in a single-page application?" The answer to that question is going to have to be "mostly", because it very definitely is a Good Thing to use the session for authentication and CSRF protection. That state has to be stored somewhere, and if you take it out of the session, you are going to have to manage it manually yourself, on both the server and the client. That's just more code and probably more maintenance, and generally re-inventing a perfectly good wheel.

"But, but..." you are going to respond, "how do I scale my application horizontally now?" This is the "real" question you were asking above, but it tends to get shortened to "session state is bad, I must be stateless". Don't panic. The main point to take on board here is that security *is* stateful. You can't have a secure, stateless application. So where are you going to store the state? That's all there is to it. Rob Winch gave a very useful and insightful talk at [Spring Exchange 2014](https://skillsmatter.com/skillscasts/5398-the-state-of-securing-restful-apis-with-spring) explaining the need for state (and the ubiquity of it - TCP and SSL are stateful, so your system is stateful whether you knew it or not), which is probably worth a look if you want to look into this topic in more depth.

The good news is you have a choice. The easiest choice is to store the session data in-memory, and rely on sticky sessions in your load balancer (they all support that somehow) to route requests from the same session back to the same JVM. That's good enough to get you off the ground and will work for a *really* large number of use cases. The other choice is to share the session data between instances of your application. As long as you are strict and only store the security data, it is small and changes infrequently (only when users log in and out, or their session times out), so there shouldn't be any major infrastructure problems. It's also really easy to do with [Spring Session](https://github.com/spring-projects/spring-session/). We'll be using Spring Session in the next article in this series, so there's no need to go into any detail about how to set it up, but it is literall a few lines of code and a Redis server, which is super fast.

> Tip: another easy way to set up shared session state is to deploy your application as a WAR file to Cloud Foundry
> [Pivotal Web Services](http://run.pivotal.io) and bind it to a Redis service.

## Conclusion

The application we have now is close to what a user might expect in a "real" application in a live environment, and it probably could be used as a template for building out into a more feature rich application with that architecture (single server with static content and JSON resources).  In the next article we expand the architecture to a separate authentication and UI server, plus a standalone resource server for the JSON. This is obviously easily generalised to multiple resourece servers. We are also going to introduce Spring Session into the stack and show how that can be used to share authentication data.
