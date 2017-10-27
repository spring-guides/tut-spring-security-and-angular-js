var LoginComponent = ng.core.Component({
    templateUrl : 'js/login/login.html'
}).Class({
    constructor : [AppService, ng.router.Router, function(app, router) {
        var self = this;
        this.credentials = {username:'', password:''};
        this.login = function() {
            app.authenticate(self.credentials, function() {
                router.navigateByUrl('/')
            });
            return false;
        };
    }]
});
