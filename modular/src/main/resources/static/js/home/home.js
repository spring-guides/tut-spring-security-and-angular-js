var HomeComponent = ng.core.Component({
    templateUrl : 'js/home/home.html'
}).Class({
    constructor : [AppService, ng.http.Http, function(app, http) {
        var self = this;
        this.greeting = {id:'', msg:''};
        http.get('resource').subscribe(response => self.greeting =response.json());
        this.authenticated = function() { return app.authenticated; };
    }]
});
