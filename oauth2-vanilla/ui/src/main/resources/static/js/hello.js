var AppComponent = ng.core.Component({
    selector : 'app',
    templateUrl : 'app.html'
}).Class({
    constructor : [ng.http.Http, function(http) {
        var self = this;
        this.greeting = {id:'', msg:''};
        this.authenticated = false;
        this.authenticate = function() {

            http.get('user').subscribe(function(response) {
                if (response.json().name) {
                    self.authenticated = true;
                    http.get('resource/').subscribe(response => self.greeting = response.json());
                } else {
                    self.authenticated = false;
                }
            }, function() {self.authenticated = false;});

        }
        this.logout = function() {
            http.post('logout', {}).subscribe(function() {
                self.authenticated = false;
            });
        };
        this.authenticate();
    }]
});

var AppModule = ng.core.NgModule({
    imports: [ng.platformBrowser.BrowserModule, ng.http.HttpModule],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
  }).Class({constructor : function(){}})

document.addEventListener('DOMContentLoaded', function() {
    ng.platformBrowserDynamic.platformBrowserDynamic().bootstrapModule(AppModule);
});
