var AppService = ng.core.Injectable({}).Class({constructor: [ng.http.Http, function(http) {

    var self = this;
    this.error = null;
    this.authenticated = false;
    this.authenticate = function(callback) {

        http.get('/user').subscribe(function(response) {
            var user = response.json();
            if (user.name) {
                self.authenticated = true;
                self.writer = user.roles && user.roles.indexOf("ROLE_WRITER")>0;
            } else {
                self.authenticated = false;
                self.writer = false;
            }
            callback && callback(response);
        }, function(response) {
          if (response.status === 0) {
            self.error = 'No connection. Verify application is running.';
          } else if (response.status == 401) {
            self.error = 'Unauthorized.';
          } else if (response.status == 403) {
            self.error = 'Forbidden.';
          } else {
            self.error = 'Unknown.';
          }
          self.authenticated = false;
          self.writer = false;
        });

    }

}]})

var ReadComponent = ng.core.Component({
    templateUrl : 'read.html'
}).Class({
    constructor : [AppService, ng.http.Http, function(app, http) {
        var self = this;
        self.greeting = {id:'', content:''};
        http.get('/resource').subscribe(response => self.greeting =response.json());
        this.authenticated = function() { return app.authenticated; };
    }]
});

var WriteComponent = ng.core.Component({
  templateUrl : 'write.html'
}).Class({
  constructor : [AppService, ng.http.Http, function(app, http) {
      var self = this;
      this.greeting = {id:'', content:''};
      http.get('/resource').subscribe(response => self.greeting = response.json());
      self.update = function() {
        http.post('/resource', {content: self.greeting.content}).subscribe(function(response) {
          self.greeting = response.json()
        })
      }
  }]
});

var UnauthenticatedComponent = ng.core.Component({
  templateUrl : 'unauthenticated.html'
}).Class({
  constructor : [AppService, function(app) {
    this.error = app.error;
  }]
});

var ChangesComponent = ng.core.Component({
    templateUrl : 'changes.html'
}).Class({
    constructor : [AppService, ng.http.Http, function(app, http) {
        var self = this;
        self.data = [];
        self.greeting = {id:'', content:''};
        http.get('/resource/changes').subscribe(function(response) {
          self.data = response.json();
        })
    }]
});

var AppComponent = ng.core.Component({
        templateUrl: 'app.html',
        selector: 'app',
        providers: [AppService]
    }).Class({
        constructor : [AppService, ng.http.Http, ng.router.Router, function(app, http, router){
            var self = this;
            self.user = {};
            this.logout = function() {
                http.post('logout', {}).subscribe(function() {
                    app.authenticated = false;
                    router.navigateByUrl('/login')
                });
            };
            this.message = function() {
              if (!app.authenticated) {
                router.navigate(['/unauthenticated'])
              } else {
                if (app.writer) {
                  router.navigate(['/write'])
                } else {
                  router.navigate(['/read'])
                }

              }
            };
            this.changes = function() {
              if (!app.authenticated) {
                router.navigate(['/unauthenticated'])
              } else {
                router.navigate(['/changes'])
              }
            };
            app.authenticate(response => {
              self.user = response.json();
              self.message();
            });
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

var routes = [
    { path: '', pathMatch: 'full', redirectTo: 'read'},
    { path: 'read', component: ReadComponent},
    { path: 'write', component: WriteComponent},
    { path: 'unauthenticated', component: UnauthenticatedComponent},
    { path: 'changes', component: ChangesComponent}
];

var AdminModule = ng.core.NgModule({
    imports: [ng.platformBrowser.BrowserModule, ng.http.HttpModule,
            ng.router.RouterModule.forRoot(routes), ng.forms.FormsModule],
    declarations: [ReadComponent, WriteComponent, UnauthenticatedComponent, ChangesComponent, AppComponent],
    providers : [{ provide: ng.http.RequestOptions, useClass: RequestOptionsService }],
    bootstrap: [AppComponent]
  }).Class({constructor : function(){}});

document.addEventListener('DOMContentLoaded', function() {
    ng.platformBrowserDynamic.platformBrowserDynamic().bootstrapModule(AdminModule);
});
