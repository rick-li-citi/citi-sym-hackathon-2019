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
                template: '<messageML><div style="border-radius: 4px; width: 800px; overflow: hidden;background: border: 1px solid #838995;box-sizing: border-box;box-shadow: 0px 1px 10px #007ECC;"><iframe src="https://localhost:4000/rfq.html" width="100%" height="305px" /></div></messageML>',
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