const PERSPECTIVES = {
  Client: 'Client',
  Citi: 'Citi',
};

const RFQ_STATES = {
  Initiated: 'Initiated',
  Quoted: 'Quoted',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
  Completed: 'Completed',
};

const RFQ_STATE_MAPPING = {
  [RFQ_STATES.Initiated]: {
    getFooterMarkup: (data) => {
      if (data.perspective === PERSPECTIVES.Client) {
        return ''
      }
    },
    getSummaryPreText: data => `New RFQ from ${data.message.user.displayName}: `,
    buttons: {
      [PERSPECTIVES.Citi]: [{
        text: 'Send Quote',
        buttonType: 'primary',
        onClick: (data) => {
          data.payload.timestamp = new Date();
          data.payload.state = RFQ_STATES.Quoted;
        },
      }],
    }
  },
  [RFQ_STATES.Quoted]: {
    getSummaryPreText: () => 'Quoted: ',
    getFooterMarkup: (data) => {
      const verb = data.perspective === PERSPECTIVES.Client ? 'received' : 'sent';
      const timestamp = new Date().toLocaleTimeString();
      console.log(timestamp);
      return `Quote ${verb} at <span class="lighten">${timestamp}</span>`
    },
    buttons: {
      [PERSPECTIVES.Client]: [
        {
          text: 'Accept',
          buttonType: 'primary',
          onClick: (data) => {
            data.payload.timestamp = new Date();
            data.payload.state = RFQ_STATES.Accepted;
          },
        },
        {
          text: 'Reject',
          buttonType: 'primary',
          nextState: RFQ_STATES.Rejected,
        },
        /*todo: add this functionality later if there's time{
          text: 'Refresh',
          buttonType: 'primary',
          nextState: RFQ_STATES.RequoteRequested,
        },*/
      ],
    },
    [RFQ_STATES.Accepted]: {
      getSummaryPreText: () => 'Accepted: ',
      buttons: {
        [PERSPECTIVES.Citi]: [{
          text: 'Complete',
          buttonType: 'primary',
          nextState: RFQ_STATES.Completed,
        }],
      }
    },
    [RFQ_STATES.Rejected]: {
      getSummaryPreText: () => 'Rejected: ',
      buttons: {
        [PERSPECTIVES.Citi]: [{
          text: 'Complete',
          buttonType: 'primary',
          nextState: RFQ_STATES.Completed,
        }],
      }
    }
  }
};

// get the rfq object from the parsed url param json
const enhanceDataWithRfqState = (data) => {
  const { message, payload } = data;

  // no rfqId means its a new rfq, so give it an id
  if (!payload.rfqId) {
    payload.rfqId = message.messageId;
    payload.state = RFQ_STATES.Initiated;
  }

  return data;
}

onActionButtonClicked = (data, buttonDefinition) => {
  // call button's event handler
  buttonDefinition.onClick(data);

  // socket is declared in window.onload()
  // send this rfq to the server for sending to chatroom
  socket.emit('sendRfqMessageEvent', data);
}

disableUI = () => {
  console.log('disable UI called');
  // for now just show the greyed out overlay
  $('.disable-overlay').show();
}

// get buttons as jquery objects with event handlers already attached
const getActionButtons = (data) => {
  const rfq = data.payload;
  let buttons = [];
  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }

  const buttonDefinitions = currentStateMapping.buttons;
  if (buttonDefinitions && buttonDefinitions[data.perspective]) {
    buttonDefinitions[data.perspective].forEach((buttonDefinition) => {
      const button = $(`
        <button class="rfq-action-button ${buttonDefinition.buttonType}">
          ${buttonDefinition.text}
        </button>
      `).click(e => onActionButtonClicked(data, buttonDefinition));
      buttons.push(button);
    });
  }
  return buttons;
}

getHeader = (data) => {
  const rfq = data.payload;

  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }
  const summaryPreText = currentStateMapping.getSummaryPreText ? currentStateMapping.getSummaryPreText(data) : '';

  const header = $(`
    <div class="rfq-header-section">
      <div class="citi-logo-wrapper">
        <img src="https://online.citi.com/GFC/branding/img/Citi-Enterprise-White.png"/>
      </div>
      <div class="rfq-info-wrapper">
        <div>${summaryPreText}<span style="color: #00bdf2;">CITI</span> SELL 25mm TII 0 1/4 07/15/29</div>
        <div class="rfq-id-small">RFQ ID: ${data.payload.rfqId}</div>
        <div>Citi Salesperson Name</div>
        <div>Citigroup Global Markets</div>
      </div>
    </div>
  `);

  return header;
};

getBody = (data) => {
  const rfq = data.payload;

  let priceMarkup;
  if (data.perspective === PERSPECTIVES.Citi) {
    priceMarkup = `<input value="${rfq.price}" />`;
  } else {
    priceMarkup = rfq.price;
  }

  const body = $(`
    <div class="rfq-body-section">
      <div class="rfq-body">
        <span>TII 0 1/4 07/15/29</span>
        <span>US9128287D64</span>
        <span class="notional-wrapper">25,000,000</span>
      </div>
      <div class="rfq-body right">
        <div>CLIENT BUY</div>
        <div class="price-wrapper">${priceMarkup}</div>
      </div>
    </div>
  `);
  
  return body;
};

getFooter = (data) => {
  const rfq = data.payload;

  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }
  const footerMarkup = currentStateMapping.getFooterMarkup ? currentStateMapping.getFooterMarkup(data) : null;

  return footerMarkup ? $(`
    <div class="rfq-footer-section">
      ${footerMarkup}
    </div>
  `) : null;
};

const socket = io('https://localhost:3000');
const prevRfqId = 0;
window.onload = function() {
  socket.on('serverEvent', data => {
    console.log('Received ServerEvent', data);
  });
  socket.on('confirmRfqMessageReceived', data => {
    console.log('action received by server, todo: disable everything here', data);
  });
  
  const urlParams = new URLSearchParams(window.location.search);
  const jsonData = urlParams.get('data');
  let data = JSON.parse(jsonData);
  data = enhanceDataWithRfqState(data);
  console.log('RFQ page data received:', data);

  const container = $("#rfq-container");
  // data.perspective: who is looking at this screen?
  data.perspective = data.currentUser === data.message.user.email ? PERSPECTIVES.Client : PERSPECTIVES.Citi;
  
  container.append(getHeader(data));
  container.append(getBody(data));
  container.append(getFooter(data));
  container.append(getActionButtons(data));
};



