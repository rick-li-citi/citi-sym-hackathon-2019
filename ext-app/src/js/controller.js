const CitiRfqService = SYMPHONY.services.register('CitiRfq:controller');

SYMPHONY.remote.hello().then((data) => {
  console.log('CitiRfq: hello done');
  return SYMPHONY.application.register(
    "citi-rfq", 
    ["modules", "applications-nav", "ui", "share", "entity"], 
    ["CitiRfq:controller"],
  );
 }).then((response) => {
  console.log('CitiRfq: subscribed modules.');
  CitiRfqService.implement({
    render(e, data) {
      console.log('CitiRfq: rendering ', data, e);

      const jsonData = JSON.stringify(data);
      const iframeCss = `
        width: 100%;
        overflow: hidden;
        background: linear-gradient(to bottom, #00bdf2e6 0%, #00b3f0e6 20%, #0066b3e6 75%, #004785e6 100%);
        border-radius: 4px;
      `;
      const template = `
        <messageML>
          <div style="${iframeCss}">
            <iframe src="https://localhost:4000/rfq.html?data=${encodeURI(jsonData)}" width="100%" style="height: fit-content;" />
          </div>
        </messageML>'
      `;
      return {
        template,
        data: {},
      };
    }
  });
  let entityService = SYMPHONY.services.subscribe("entity");
  entityService.registerRenderer(
    "com.citi.rfq",
    {},
    "CitiRfq:controller",
  );
})
.fail((e) => {
  console.error(`Fail to register application `, e);
});
