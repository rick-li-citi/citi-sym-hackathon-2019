const Symphony = require('symphony-api-client-node');
Symphony.setDebugMode(true);
require('./server.js');

// temporary until we plug in nlp
const getRfqFromMessageObject = (message) => {
  let { messageText } = message;

  const REGEX = {
    DIRECTION: /(buy|sell)/ig,
    PRICE: /(at|@)( +)?\d+/ig,
    SIZE: /(\d+)?\.?\d+(k|m|b){0,2}/ig,
  };

  const directionMatch = messageText.match(REGEX.DIRECTION);
  if (directionMatch) { messageText = messageText.replace(directionMatch[0], ''); }
  const priceMatch = messageText.match(REGEX.PRICE);
  if (priceMatch) { messageText = messageText.replace(priceMatch[0], ''); }
  const sizeMatch = messageText.match(REGEX.SIZE);
  if (sizeMatch) { messageText = messageText.replace(sizeMatch[0], ''); }

  const rfq = {
    direction: directionMatch ? directionMatch[0] : '',
    price: priceMatch ? priceMatch[0].replace(/\D/ig, '') : '',
    size: sizeMatch ? sizeMatch[0] : '',
  };
  // just use whatever's left for the description
  rfq.description = messageText.trim();

  return rfq;
}

const botHearsSomething = (event, messages) => {
  messages.forEach((message, index) => {
    let reply_message = '';//'Hello ' + message.user.firstName + ', hope you are doing well!!'
    reply_message += '<span class="entity" data-entity-id="summary"></span>';
    // TODO: turn the message text into data here (e.g. call NLP)
    const rfq = getRfqFromMessageObject(message);
    
    // if any field is missing, don't reply
    if (Object.values(rfq).some(value => !value)) {
      return;
    }

    // set data to render into the "summary" entity span defined above
    //symphony ext app will render "com.citi.rfq" to iframe loading rfq ui by the rfqId;
    const jsonObject = {
      summary: {
        type: 'com.citi.rfq',
        version: '0.1',
        message,
        payload: rfq,
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
});
