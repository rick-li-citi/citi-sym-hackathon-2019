const CitiRfqService = SYMPHONY.services.register('CitiRfq:controller');
SYMPHONY.remote.hello()
.then((data) => {
    console.log('CitiRfq: hello done');
    return SYMPHONY.application.register("citi-rfq", 
        ["modules", "applications-nav", "ui", "share", "entity"], 
        ["CitiRfq:controller"]);
})
.then((response) => {
    console.log('CitiRfq: subscribed modules.');
    CitiRfqService.implement({
        render(e, data) {
            console.log('CitiRfq: rendering ', data, e);
            return {
                template: '<entity><iframe src="https://google.com" /></entity>',
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