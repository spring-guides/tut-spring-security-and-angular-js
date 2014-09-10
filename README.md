Demo samples from Microservice Security talk by Dave Syer at
[SpringOne2GX 2014](https://2014.event.springone2gx.com/schedule/sessions/spring_boot_for_the_web_tier.html). Slides
here: http://presos.dsyer.com/decks/microservice-security.html.

Contents: 

* `./demo/app.groovy`: the HTTP Basic auth sample app. Start it with [Spring Boot CLI](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#getting-started-installing-the-cli)

* `./certs`: the X.509 authentication example. Start the `Application` class as a Spring Boot app (main method), and look at the tests and slides for how to log into it with the certificates in `src/main/resources`

* `/pairs/spring-session`: the [Spring Session](https://github.com/spring-projects/spring-session) demo, using a shared cookie as an authentication token between a front end UI and a back end service
