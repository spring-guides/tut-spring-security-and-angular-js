Demo samples for [Angular JS](http://angularjs.org) with [Spring Security](http://projects.spring.io/spring-security) blogs. Spring Security, Spring Boot and Angular JS all have nice features for making it really easy to produce modern applications, so there is potentially a lot of value in making them work together very smoothly. Things to consider are cookies, headers, native clients, various security vulnerabilities and how modern browser technology can help us to avoid them. In this series we show how nice features of the component frameworks can be integrated simply to provide a pleasant and secure user experience. We start with a very basic single-server implementation and scale it up in stages, splitting out backend resources and authentication to separate services. The final state includes a simple API Gateway on the front end implemented declaratively using Spring Cloud, and using this we are able to neatly sidestep a lot of the problems people encounter securing a javascript front end with a distributed back end. The example code uses Angular JS, but the same architecture and backends can be used with any front-end stack.

All samples have the same basic functionality: a secure static, single-page application, which renders content from a secure backend JSON resource. Blogs are in READMEs of individual projects, and also on the [Spring Blog](http://spring.io.blog). Also some summary slides here: http://presos.dsyer.com/decks/security-micro-clients.html (so far minimal).

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dsyer/spring-security-angular?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Contents: 

* `basic`: sample with HTTP Basic authentication, static HTML and an API resource all in the same server ([blog](http://spring.io/blog/2015/01/12/spring-and-angular-js-a-secure-single-page-application)).

* `single`: adds form authentication, but static HTML and an API resource still in the same server ([blog](https://spring.io/blog/2015/01/12/the-login-page-angular-js-and-spring-security-part-ii)).

* `vanilla`: form authentication and static HTML in one server ("ui") and an unprotected backend API resource in another ("resource") ([blog](https://spring.io/blog/2015/01/20/the-resource-server-angular-js-and-spring-security-part-iii)).

* `spring-session`: the same as "vanilla", but using [Spring Session](https://github.com/spring-projects/spring-session) as an authentication token between the UI and the back end service (blog shared with `vanilla`).

* `proxy`: same as "vanilla", but with the UI acting as a reverse proxy for the backend (API Gateway pattern). CORS responses are not needed because all client requests go to the same server. Authentication for the backend could be overlaid using the "spring-session" approach (above) or using "oauth2" (below) ([blog](https://spring.io/blog/2015/01/28/the-api-gateway-pattern-angular-js-and-spring-security-part-iv)).

* `oauth2-vanilla`: same as "proxy" but with OAuth2 SSO to the UI and OAuth2 resource server protection for the backend. The OAuth2 authorization server is no-frills ([blog](https://spring.io/blog/2015/02/03/sso-with-oauth2-angular-js-and-spring-security-part-v)).

* `oauth2`: same as "oauth2-vanilla" but JWT tokens (signed, encoded JSON, carrying information about the user and the token grant) and a nice UI with a login screen in the authorization server.

Ideas for more samples and blogs:

* Production settings: explain how to harden the system for production use, e.g. require HTTPS for redirects, monitoring, metering, auditing, log aggregation, custom authentication

* A full blog on the JWT sample.

* Add some access decisions other than simple "authenticated()". Maybe map scopes to roles.

* Add service discovery to the proxy.

* Add a second UI and hide them both behind a gateway

* Logout

* Other OAuth2 providers, and/or OAuth 1.0a
