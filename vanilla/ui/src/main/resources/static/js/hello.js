var AppService = ng.core.Injectable({}).Class({constructor: function() {
    this.authenticated = false;
}})

var HomeComponent = ng.core.Component({
    templateUrl : 'home.html'
}).Class({
    constructor : [AppService, ng.http.Http, function(app, http) {
        var self = this;
        this.greeting = {id:'', msg:''};
        http.get('http://localhost:9000').subscribe(response => self.greeting =response.json());
        this.authenticated = function() { return app.authenticated; };
    }]
});

var LoginComponent = ng.core.Component({
    templateUrl : 'login.html'
}).Class({
    constructor : [AppService, ng.http.Http, ng.router.Router, function(app, http, router) {
        var self = this;
        this.credentials = {username:'', password:''};
        this.login = function() {
            http.post('login', $.param(self.credentials), {
                headers : {
                  "content-type" : "application/x-www-form-urlencoded"
                }}).subscribe(function() {
                app.authenticated = true;
                router.navigateByUrl('/')
            });
            return false;
        };
        this.authenticated = function() { return app.authenticated; };
    }]
});

var AppComponent = ng.core.Component({
        templateUrl: 'app.html',
        selector: 'app',
        providers: [AppService]
    }).Class({constructor : [AppService, ng.http.Http, ng.router.Router, function(app, http, router){

        var authenticate = function(callback) {

            http.get('user').subscribe(function(response) {
                if (response.json().name) {
                    app.authenticated = true;
                } else {
                    app.authenticated = false;
                }
                callback && callback();
            });

        }

        this.logout = function() {
            http.post('logout', {}).subscribe(function() {
                app.authenticated = false;
                router.navigateByUrl('/login')
            });
        }

        authenticate();
    }]
});

var routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home'},
    { path: 'home', component: HomeComponent},
    { path: 'login', component: LoginComponent}
];

var AppModule = ng.core.NgModule({
    imports: [ng.platformBrowser.BrowserModule, ng.http.HttpModule,
            ng.router.RouterModule.forRoot(routes), ng.forms.FormsModule],
    declarations: [HomeComponent, LoginComponent, AppComponent],
    bootstrap: [AppComponent]
  }).Class({constructor : function(){}});

document.addEventListener('DOMContentLoaded', function() {
    ng.platformBrowserDynamic.platformBrowserDynamic().bootstrapModule(AppModule);
});