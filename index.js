const Symphony = require('symphony-api-client-node');
Symphony.setDebugMode(true);
require('./server.js');

const ISIN_MAPPINGS = {
  US88160RAE18: {
    ticker: 'TSLA',
    coupon: 5.300,
    maturity: '08/15/2025',
  },
  US459200HU86: {
    ticker: 'IBM',
    coupon: 3.625,
    maturity: '02/12/2024',
  },
  US594918CB81: {
    ticker: 'MSFT',
    coupon: 4.500,
    maturity: '02/06/2057',
  },
};

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

  'can i buy 4mm TSLA 5.300 081525 at 16.51 pls'
  'can i buy 4mm US88160RAE18 at 16.51 pls'
  const nlpResponse = {
    quantity: 4000000,
    clientDirection: 'buy',
    isin: null,//'US88160RAE18',
    ticker: 'TSLA',
    coupon: 5.300,
    maturity: '08/15/2025',
    price: 16.51, // optional field, sales editable
  };

  if (!nlpResponse.isin) {
    // lookup isin based on ticker coupon maturity
    // todo: joe
  }


  const rfq = {
    direction: nlpResponse.clientDirection,
    price: price,
    size: quantity,
    isin: nlpResponse.isin,
    description: `${nlpResponse.ticker} ${nlpResponse.coupon} ${nlpResponse.maturity}`,
  };

  return rfq;
}

const botHearsSomething = (event, messages) => {
  messages.forEach((message, index) => {
    // let us clear the chatroom
    if (message.messageText === '-') {
      return;
    }

    let reply_message = '';//'Hello ' + message.user.firstName + ', hope you are doing well!!'
    reply_message += '<span class="entity" data-entity-id="summary"></span>';

    let rfq;
    // first, check for reply from symphony element form with updated values
    if (message.payload && message.payload.symphonyElementsAction) {
      rfq = message.payload.symphonyElementsAction.formValues;
    } else {
      // TODO: turn the message text into data here (e.g. call NLP)
      rfq = getRfqFromMessageObject(message);
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
