const Symphony = require('symphony-api-client-node');
Symphony.setDebugMode(true)
require('./server.js');

const botHearsSomething = (event, messages) => {
  messages.forEach((message, index) => {
    let reply_message = 'Hello ' + message.user.firstName + ', hope you are doing well!!'
    reply_message += '<span class="entity" data-entity-id="summary"></span>';
    // TODO: turn the message text into data here (e.g. call NLP)

    // set data to render into the "summary" entity span defined above
    //symphony ext app will render "com.citi.rfq" to iframe loading rfq ui by the rfqId;
    const jsonObject = {
      summary: {
        type: 'com.citi.rfq',
        version: '0.1',
        message,
        payload: {
          rfqId: 'xxxx',
          description: 'bond name',
          direction: 'buy',
          size: '123',
          price: '123',
        },
      },
    };
    const jsonString = JSON.stringify(jsonObject);

    Symphony.sendMessage(message.stream.streamId, 
      reply_message, 
      jsonString,
      Symphony.MESSAGEML_FORMAT,
    );
  });
};

Symphony.initBot(__dirname + '/config.json').then((symAuth) => {
  Symphony.getDatafeedEventsService(botHearsSomething);
})
