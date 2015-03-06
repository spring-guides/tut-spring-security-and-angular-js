# Multiple UI Applications and a Gateway: Single Page Application with Spring and Angular JS

In this article we continue [our discussion][fifth] of how to use [Spring Security](http://projects.spring.io/spring-security) with [Angular JS](http://angularjs.org) in a "single page application". Here we show how to use [Spring Session](http://projects.spring.io/spring-security-oauth/) together with [Spring Cloud](http://projects.spring.io/spring-cloud/) to combine the features of the systems we built in parts II and IV. The aim is to build a Gateway (like in [part IV][fourth]) that is used not only for API resources but also to load the UI itself from a backend server. We can also simplify the token-wrangling bits of [part II][second] by using the Gateway to pass through the authentication to the backends. Then we extend the system to show how we can make local, granular access decisions in the backends, while stil controlling identity and authentication at the Gateway. This is a very powerful model for building distributed systems in general, and has a number of benefits that we can explore as we see the features in the code.

[first]: http://spring.io/blog/2015/01/12/spring-and-angular-js-a-secure-single-page-application (First Article in the Series)
[second]: http://spring.io/blog/2015/01/12/the-login-page-angular-js-and-spring-security-part-ii (Second Article in the Series)
[third]: http://spring.io/blog/2015/01/20/the-resource-server-angular-js-and-spring-security-part-iii (Third Article in the Series)
[fourth]: http://spring.io/blog/2015/01/28/the-api-gateway-pattern-angular-js-and-spring-security-part-iv (Fourth Article in the Series)
[fifth]: https://spring.io/blog/2015/02/03/sso-with-oauth2-angular-js-and-spring-security-part-v (Fifth Article in the Series)

## Target Architecture

Here's a picture of the basic system we are going to build to start with:

![Components of the System](https://raw.githubusercontent.com/dsyer/spring-security-angular/master/double/double-simple.png)

Like the other sample applications in this series it has a UI (HTML and JavaScript) and a Resource server. Like the sample in [Part IV][fourth] it has a Gateway, but here it is separate, not part of the UI. The UI effectively becomes part of the backend, giving us even more choice to re-configure and re-implement features, and also bringing other benefits as we will see.

The browser goes to the Gateway for everything and it doesn't have to know about the architecture of the backend (fundamentally, it has no idea that there is a back end). One of the things the browser does in this Gateway is authentication, e.g. it sends a username and password like in [Part II][second], and it gets a cookie in return. On subsequent requests it presents the cookie automatically (no code needs to be written on the client) and the Gateway passes it through to the backends. The backends use the cookie to authenticate and because all components share a session they share the same information about the user. Contrast this with [Part V][fifth] where the cookie had to be converted to an access token in the Gateway, and the access token then had to be independently decoded by all the backend components.

As in [Part IV][fourth] the Gateway simplifies the interaction between clients and servers, and the it presents a nice, small, well-defined surface on which to deal with security. For example, we don't need to worry about [Common Origin Resource Sharing](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing), which is a welcome relief since it is easy to get wrong.

## Building the Backend

In this simple architecture the 

## Granular Access Decisions in the Backend

![Components of the System](https://raw.githubusercontent.com/dsyer/spring-security-angular/master/double/double-components.png)

## Backend and Frontend Authentication

The backends can have any kind of authentication we like, and that can be useful for testing purposes (e.g. you can go directly to the UI if you know its physical address and a set of local credentials). The Gateway imposes a completely unrelated set of constraints, as long as it can authenticate users and assign metadata to them that satisfy the access rules in the backends. This is quite a powerful model for being able to independently develop and test the backend components.
