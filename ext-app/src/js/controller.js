const CitiRfqService = SYMPHONY.services.register('CitiRfq:controller');

const baseUrl = 'https://localhost:5000';
//const baseUrl = 'https://192.168.1.119:5000'; // Brandon - my laptop's IP on my home network, where the java app is running
let appToken = undefined;
let currentUserEmail = undefined;

let appTokenPromise = fetch(`${baseUrl}/appToken`).then(res => 
  res.json()
).then(res => {
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
  
  let currentUser = undefined;
  extendedUserInfoService.getJwt().then(jwt => {
    console.log('jwt: ', jwt);
    let token = jwt;
    let base64HeaderUrl = token.split('.')[0];
    let base64Header = base64HeaderUrl.replace('-', '+').replace('_', '/');
    let headerData = JSON.parse(window.atob(base64Header));

    // Get Token payload and date's
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace('-', '+').replace('_', '/');
    let dataJWT = JSON.parse(window.atob(base64));

    console.log('User is ', dataJWT.user);
    currentUser = {
      email: dataJWT.user.emailAddress,
      name: dataJWT.user.displayName,
    };

    // once email is set, subscribe to entity service
    let entityService = SYMPHONY.services.subscribe("entity");
    entityService.registerRenderer(
      "com.citi.rfq",
      {},
      "CitiRfq:controller",
    );
  });

  CitiRfqService.implement({
    trigger(uiClass, id, payload, data){
      console.log(payload)
    },
    render(e, data) {
      if ( new Date().getTime() - data.message.timestamp > 0.5 * 60 * 60 * 1000 ){
        return {
          template: '<messageML><span>RFQ expired.</span></messageML>'
        };
      }
      console.log('CitiRfq: rendering ', data, e);

      console.log(data);
      
      // assign the current user email to compare with the original message (data.message.user.email) when deciding what to render
      data.currentUser = currentUser;

      const jsonData = JSON.stringify(data);
      const iframeCss = `
        width: 100%;
        overflow: hidden;
      `;
      const template = `
        <messageML>
          <div style="${iframeCss}">
            <iframe id="ext-app-iframe" src="https://localhost:4000/rfq.html?data=${encodeURI(jsonData)}" height="250" width="100%" />
          </div>
        </messageML>
      `;

      return {
        template,
        data,
      };
    }
  });

})
.catch((e) => {
  console.error(`Fail to register application `, e);
});
