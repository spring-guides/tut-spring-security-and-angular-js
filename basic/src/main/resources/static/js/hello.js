var AppComponent = ng.core.Component({
    selector : 'app',
    template : '<p>The ID is {{greeting.id}}</p><p>The content is {{greeting.content}}</p>'
}).Class({
    constructor : [ng.http.Http, function(http) {
        var self = this;
        self.greeting = {id:'', content:''};
        http.get("/resource").subscribe(response => self.greeting =response.json());
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
