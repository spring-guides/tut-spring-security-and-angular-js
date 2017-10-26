var AppComponent = ng.core.Component({
    selector : 'app',
    templateUrl : 'app.html'
}).Class({
    constructor : [ng.http.Http, function(http) {
            var self = this;
            self.authenticated = false;
            self.greeting = {id:'', content:''};
            http.get("/user").subscribe(response => {
                var data = response.json();
            if (data.name) {
                self.authenticated = true;
                self.user = data.name
                http.get("/resource").subscribe(response => self.greeting =response.json());
            } else {
                self.authenticated = false;
            }
        }, response => { self.authenticated = false; });
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


