const CitiRfqService = SYMPHONY.services.register('CitiRfq:controller');
SYMPHONY.remote.hello()
.then((data) => {
    console.log('====hello ====')
    return SYMPHONY.application.register("citi-rfq", 
        ["modules", "applications-nav", "ui", "share", "entity"], 
        ["CitiRfq:controller"]);
})
.then((response) => {
    CitiRfqService.implement({
        render(e, data){
            console.log('====', data);
            return {
                template: '<entity><iframe src="https://your-site.com/iframe-url.html" /></entity>',
                data: {}
              };

        }
    });
    let entityService = SYMPHONY.services.subscribe("entity");
    entityService.registerRenderer(
        "com.citi.rfq",
        {},
        "CitiRfq:controller"
    );
})
.fail((e) => {
  console.error(`Fail to register application `, e);
});

