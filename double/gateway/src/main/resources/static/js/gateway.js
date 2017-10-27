var AppComponent = ng.core.Component({
        templateUrl: 'app.html',
        selector: 'app'
    }).Class({
        constructor : [ng.http.Http, function(http){
            var self = this;
            this.credentials = {username:'', password:''};
            this.authenticated = false;
            var authenticate = function(credentials) {
                var headers = credentials ? {
                    authorization : "Basic " + btoa(credentials.username + ":" + credentials.password)
                } : {};
                http.get('user', {headers: headers}).subscribe(function(response) {
                    var data =response.json();
                    self.admin = data && data.roles && data.roles.indexOf("ROLE_ADMIN")>-1;
                    self.authenticated = data && data.name;
                    self.user = self.authenticated ? data.name : '';
                });
            }
            this.login = function() {
                authenticate(self.credentials);
                return false;
            };
            this.logout = function() {
                http.post('logout', {}).subscribe(function() {
                    self.authenticated = false;
                    self.admin = false;
                });
            }
            authenticate();
        }]
    });

var RequestOptionsService = ng.core.Class({
    extends: ng.http.BaseRequestOptions,
    constructor : function() {},
    merge: function(opts) {
        opts.headers = new ng.http.Headers(opts.headers ? opts.headers : {});
        opts.headers.set('X-Requested-With', 'XMLHttpRequest');
        return opts.merge(opts);
    }
});

var AppModule = ng.core.NgModule({
    imports: [ng.platformBrowser.BrowserModule, ng.http.HttpModule, ng.forms.FormsModule],
    declarations: [AppComponent],
    providers : [{ provide: ng.http.RequestOptions, useClass: RequestOptionsService }],
    bootstrap: [AppComponent]
  }).Class({constructor : function(){}});

document.addEventListener('DOMContentLoaded', function() {
    ng.platformBrowserDynamic.platformBrowserDynamic().bootstrapModule(AppModule);
});
