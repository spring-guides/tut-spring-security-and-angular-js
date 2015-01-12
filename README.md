Demo samples for [Angular JS](http://angularjs.org) with [Spring Security](http://projects.spring.io/spring-security) blogs. All samples have the same basic functionality: a secure static, single-page application, which renders content from a secure backend JSON resource. Blogs are in READMEs of individual projects, and also on the [Spring Blog](http://spring.io.blog). Also some summary slides here: http://presos.dsyer.com/decks/security-micro-clients.html (so far minimal).

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/dsyer/spring-security-angular?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Contents: 

* `basic`: sample with HTTP Basic authentication, static HTML and an API resource all in the same server ([blog](http://spring.io/blog/2015/01/12/spring-and-angular-js-a-secure-single-page-application)).

* `single`: adds form authentication, but static HTML and an API resource still in the same server ([blog](https://spring.io/blog/2015/01/12/the-login-page-angular-js-and-spring-security-part-ii)).

* `vanilla`: form authentication and static HTML in one server ("ui") and an unprotected backend API resource in another ("resource") ([blog](http://spring.io/blog/1905)).

* `spring-session`: the same as "vanilla", but using [Spring Session](https://github.com/spring-projects/spring-session) as an authentication token between the UI and the back end service (blog shared with `vanilla`).

* `proxy`: same as "vanilla", but with the UI acting as a reverse proxy for the backend (API Gateway pattern). CORS responses are not needed because all client requests go to the same server. Authentication for the backend could be overlaid using the "spring-session" approach (above) or using "oauth2" (below) ([blog](http://spring.io/blog/1906)).

* `oauth2-vanilla`: same as "proxy" but with OAuth2 SSO to the UI and OAuth2 resource server protection for the backend. The OAuth2 authorization server is no-frills ([blog](http://spring.io/blog/1907)).

* `oauth2`: same as "oauth2-vanilla" but JWT tokens (signed, encoded JSON, carrying information about the user and the token grant) and a nice UI with a login screen in the authorization server.
