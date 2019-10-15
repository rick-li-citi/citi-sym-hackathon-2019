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
    "citi-rfq", 
    ["modules", "applications-nav", "ui", "share", "entity", "extended-user-info"], 
    ["CitiRfq:controller"],
  );
}).then((response) => {
  console.log('CitiRfq: subscribed modules.');
  const extendedUserInfoService = SYMPHONY.services.subscribe('extended-user-info');
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
    render(e, data) {
      console.log('CitiRfq: rendering ', data, e);

      // cant get getJwt to work, use hardcoded name mappings for demo purposes
      const emailNameMappings = {
        'jiehong.chung@citi.com': 'Jiehong Chung',
        'rick.li@citi.com': 'Rick Li',
      };

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
});
// .fail((e) => {
//   console.error(`Fail to register application `, e);
// });
