@Grab('spring-boot-starter-security')
@RestController
class Application {

   @RequestMapping("/")
   def home() {
      [status: 'OK']
   }

}
