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
  


  let jwt = undefined;
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
  });
  

  console.log('CitiRfq: subscribed modules.');
  
  extendedUserInfoService.getEmail().then(email => {
    currentUserEmail = email;
  

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
      console.log('CitiRfq: rendering ', data, e);

      // cant get getJwt to work, use hardcoded name mappings for demo purposes
      const emailNameMappings = {
        'jiehong.chung@citi.com': 'Jiehong Chung',
        'rick.li@citi.com': 'Rick Li',
      };

      // todo: brendan
      // if any property is missing from our nlp/regex parsing, show form
      if (Object.values(data.payload).some(value => !value)) {
        console.log(data);
        const messageML = `
          <messageML> 
            <form id="form_id"> 
              <h4>Description</h4>
              <text-field name="description" placeholder="Description" required="true">${data.payload.description}</text-field>

              <h4>Maturity</h4>
              <text-field name="maturity" placeholder="YYYY/MM/DD" required="true">2019/10/16</text-field>
                
              <button name="submit_button" type="action">Submit</button>
            </form>
          </messageML>
        `;

        return { template: messageML };
      }

      // assign the current user email to compare with the original message (data.message.user.email) when deciding what to render
      data.currentUser = {
        email: currentUserEmail,
        name: emailNameMappings[currentUserEmail] || 'John Smith',
      };

      const jsonData = JSON.stringify(data);
      const iframeCss = `
        width: 100%;
        overflow: hidden;
      `;
      const template = `
        <messageML>
          <div style="${iframeCss}">
            <iframe id="ext-app-iframe" src="https://localhost:4000/rfq.html?data=${encodeURI(jsonData)}" height="230" width="100%" />
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
