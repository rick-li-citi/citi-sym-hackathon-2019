const Symphony = require('symphony-api-client-node');
Symphony.setDebugMode(true);
require('./server.js');

const SUPPORTED_BONDS = [{
  isin: 'US88160RAE18',
  ticker: 'TSLA',
  coupon: 5.300,
  maturity: '08/15/2025',
}, {
  isin: 'US459200HU86',
  ticker: 'IBM',
  coupon: 3.625,
  maturity: '02/12/2024',
}, {
  isin: 'US594918CB81',
  ticker: 'MSFT',
  coupon: 4.500,
  maturity: '02/06/2057',
}, {
  isin: 'US38259PAB85',
  ticker: 'GOOG',
  coupon: 3.625,
  maturity: '5/19/2021',
}];

const findByDetails = (ticker, coupon, maturity) => {
  return SUPPORTED_BONDS.find((bond) => {
    return bond.ticker === ticker && bond.coupon == coupon && bond.maturity === maturity;
  });
}

const findByISIN = (isin) => {
  return SUPPORTED_BONDS.find(bond => bond.isin === isin);
}

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
  let nlpResponse = {
    quantity: 4000000,
    clientDirection: 'buy',
    isin: null,//'US88160RAE18',
    ticker: 'TSLA',
    coupon: 5.300,
    maturity: '08/15/2025',
    price: 16.51, // optional field, sales editable
  };

  let details;
  if (!nlpResponse.isin) {
    // lookup isin based on ticker coupon maturity
    details = findByDetails(nlpResponse.ticker, nlpResponse.coupon, nlpResponse.maturity);
  } else {
    details = findByISIN(nlpResponse.isin);
  }

  if (!details) return null;

  nlpResponse = {
    ...nlpResponse,
    ...details,
  };

  console.log(nlpResponse);

  const rfq = {
    direction: nlpResponse.clientDirection,
    price: nlpResponse.price,
    size: nlpResponse.quantity,
    isin: nlpResponse.isin,
    description: `${nlpResponse.ticker} ${nlpResponse.coupon} ${nlpResponse.maturity}`,
  };

  return rfq;
}

let jsonObject;
const botHearsSomething = (event, messages) => {
  messages.forEach((message, index) => {
    let reply_message = '<span class="entity" data-entity-id="summary"></span>';

    let rfq;
    // first, check for reply from symphony element form with updated values
    if (message.payload && message.payload.symphonyElementsAction) {
      rfq = message.payload.symphonyElementsAction.formValues;
    } else {
      rfq = getRfqFromMessageObject(message);
    }

    // show form
    reply_message = `
      <form id="form_id"> 
        <h4>Review/edit fields and submit RFQ:</h4>
        <h5>Direction</h5>
        <radio name="direction" value="buy"${rfq.direction.toUpperCase() === 'BUY' ? ' checked="true"' : ''}>Buy</radio>
        <radio name="direction" value="sell"${rfq.direction.toUpperCase() === 'SELL' ? ' checked="true"' : ''}>Sell</radio>

        <h5>Price</h5>
        <text-field name="price" placeholder="Price" required="true">${rfq.price}</text-field>

        <h5>Size</h5>
        <text-field name="size" placeholder="Size" required="true">${rfq.size}</text-field>

        <h5>ISIN</h5>
        <text-field name="isin" placeholder="Isin" required="true">${rfq.isin}</text-field>

        <h5>Description</h5>
        <text-field name="description" placeholder="Description" required="true">${rfq.description}</text-field>
          
        <button name="submit_button" type="action">Submit</button>
      </form>
    `;

    // set data to render into the "summary" entity span defined above
    //symphony ext app will render "com.citi.rfq" to iframe loading rfq ui by the rfqId;
    jsonObject = {
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

const formSubmitted = (events, actions) => {
  actions.forEach((action) => {
    console.log(action);
    let reply_message = '<span class="entity" data-entity-id="summary"></span>';
    // user has clicked submit on the form, can now proceed to normal flow
    jsonObject.summary.payload = action.formValues;
    const jsonString = JSON.stringify(jsonObject);

    Symphony.sendMessage(action.streamId,
      reply_message,
      jsonString,
      Symphony.MESSAGEML_FORMAT,
    );
  });
};

Symphony.initBot(__dirname + '/config.json').then((symAuth) => {
  Symphony.getDatafeedEventsService({
    onMessageSent: botHearsSomething.bind(null, 'MESSAGE_RECEIVED'),
    onSymphonyElementsAction: formSubmitted.bind(null, 'ELEMENTS_ACTION_RECEIVED'),
  });
});
