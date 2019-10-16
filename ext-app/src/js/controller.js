const CitiRfqService = SYMPHONY.services.register('CitiRfq:controller');

const baseUrl = 'https://localhost:5000';
let appToken = undefined;

let appTokenPromise = fetch(`${baseUrl}/appToken`)
  .then(res => res.json())
  .then(res => {
    appToken = res['token'];
  });
Promise.all([appTokenPromise, SYMPHONY.remote.hello()]).then((data) => {
  console.log('CitiRfq: hello done', data);
  return SYMPHONY.application.register(
    {appId: "citi-rfq", tokenA: appToken}, 
    ["modules", "applications-nav", "ui", "share", "entity","extended-user-info"], 
    ["CitiRfq:controller"],
  );
 }).then((response) => {
  const extendedUserInfoService = SYMPHONY.services.subscribe('extended-user-info');
  const uiService = SYMPHONY.services.subscribe('ui');
  const rfqButton = {
    // icon: `${baseUrl}/img/icon_small.png`,
    label: 'Rates RFQ',
    data: {}
  };
  uiService.registerExtension('single-user-im', 'CitiRfq-im', 'CitiRfq:controller', rfqButton);
  uiService.registerExtension('rooms', 'CitiRfq-im', 'CitiRfq:controller', rfqButton);
  


  let jwt = undefined;
  let currentUser = undefined;
  
  // .then(jwt => {
  //   console.log('jwt: ', jwt);
  // });
  extendedUserInfoService.getJwt().then(jwt => {
    console.log('jwt: ', jwt);
  });
  // extendedUserInfoService.getEmail().then(email => {
  //   console.log('email: ', email);
  //     currentUser = email;
  // });

  console.log('CitiRfq: subscribed modules.');
  CitiRfqService.implement({
    trigger(uiClass, id, payload, data){
      console.log(payload)
    },
    render(e, data) {
      console.log('CitiRfq: rendering ', data, e);
      extendedUserInfoService.getJwt().then(jwt => {
        console.log('jwt: ', jwt);
      });
      const jsonData = JSON.stringify(data);
      const iframeCss = `
        width: 100%;
        overflow: hidden;
        background: linear-gradient(to bottom, #00bdf2e6 0%, #00b3f0e6 20%, #0066b3e6 75%, #004785e6 100%);
      `;
      const template = `
        <messageML>
          <div style="${iframeCss}">
            <iframe src="https://localhost:4000/rfq.html?data=${encodeURI(jsonData)}" width="100%" height="200px" />
          </div>
        </messageML>'
      `;
      return {
        template,
        data: {},
      };
    }
  });
  // let entityService = SYMPHONY.services.subscribe("entity");
  // entityService.registerRenderer(
  //   "com.citi.rfq",
  //   {},
  //   "CitiRfq:controller",
  // );
})
// .catch((e) => {
//   console.error(`Fail to register application `, e);
// });
