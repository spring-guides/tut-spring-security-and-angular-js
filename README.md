Demo samples for Single Page Security blogs. Slides
here: http://presos.dsyer.com/decks/security-micro-clients.html.

Contents: 

* `single`: basic sample with form authentication, static HTML and an API resource all in the same server.

* `vanilla`: form authentication and static HTML in one server ("ui") and an unprotected backend API resource in another ("resource").

* `spring-session`: the same as "vanilla", but using [Spring Session](https://github.com/spring-projects/spring-session) as an authentication token between the UI and the back end service.

* `proxy`: same as "vanilla", but with the UI acting as a reverse proxy for the backend (API Gateway pattern). CORS responses are not needed because all client requests go to the same server. Authentication for the backend could be overlaid using the "spring-session" approach (above) or using "oauth2" (below).

* `oauth2`: same as "proxy" but with OAuth2 SSO to the UI and OAuth2 resource server protection for the backend. The OAuth2 tokens are JWTs (signed, encoded JSON, carrying information about the user and the token grant), but the same approach would work with a centralized `TokenStore` as well.
