const Symphony = require('symphony-api-client-node');
Symphony.setDebugMode(true)
require('./server.js');

const botHearsSomething = (event, messages) => {
  messages.forEach((message, index) => {
    console.log('botHearsSomething:', message);
    let reply_message = 'Hello ' + message.user.firstName + ', hope you are doing well!!'
    reply_message += '<span class="entity" data-entity-id="summary"></span>';
    let json = '{"summary": { "type": "com.citi.rfq", "version": "0.1", "payload": {"rfqId": "xxxx"} }}'; //symphony ext app will render "com.citi.rfq" to iframe loading rfq ui by the rfqId;
    Symphony.sendMessage(message.stream.streamId, 
      reply_message, 
      json,
      Symphony.MESSAGEML_FORMAT,
    );
  });
};

Symphony.initBot(__dirname + '/config.json').then((symAuth) => {
  Symphony.getDatafeedEventsService(botHearsSomething);
})
