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
  Cancelled: 'Cancelled',
};

const RFQ_STATE_MAPPING = {
  [RFQ_STATES.Initiated]: {
    getSummaryPreText: data => `New RFQ from ${data.message.user.displayName}: `,
    getPriceComponent: (data) => {
      if (data.perspective === PERSPECTIVES.Citi) {
        return $(`<input value="${data.payload.price}" />`).on('input', (e) => {
          data.payload.price = e.target.value;
        }).on('focus', (e) => e.target.select());
      }
      return null;
    },
    getFooterText: (data) => {
      if (data.perspective === PERSPECTIVES.Client) {
        return 'Quote Requested, pending response.';
      }
      return null;
    },
    buttons: {
      [PERSPECTIVES.Client]: [{
        text: 'Cancel',
        buttonType: 'red',
        nextState: RFQ_STATES.Cancelled,
      }],
      [PERSPECTIVES.Citi]: [{
        text: 'Send Quote',
        buttonType: 'green',
        nextState: RFQ_STATES.Quoted,
      }],
    }
  },
  [RFQ_STATES.Quoted]: {
    getSummaryPreText: () => 'Quoted: ',
    getActionLabelMarkup: (data) => {
      const verb = data.perspective === PERSPECTIVES.Client ? 'received from' : 'sent by';
      const timestamp = (new Date(data.payload.lastUpdated) || new Date()).toTimeString();
      const hhmm = timestamp.substring(0, 5);
      const ss = timestamp.substring(5, 8);

      return `Quote ${verb} ${data.salesperson.name} at ${hhmm}<span class="lighten">${ss}</span>`
    },
    getFooterText: (data) => {
      if (data.perspective === PERSPECTIVES.Citi) {
        return 'Pending Client Decision';
      }
    },
    buttons: {
      [PERSPECTIVES.Client]: [
        {
          text: 'Accept',
          buttonType: 'green',
          nextState: RFQ_STATES.Accepted,
        },
        {
          text: 'Reject',
          buttonType: 'amber',
          nextState: RFQ_STATES.Rejected,
        },
        /*todo: add this functionality later if there's time{
          text: 'Refresh',
          buttonType: 'cyan',
          nextState: RFQ_STATES.RequoteRequested,
        },*/
      ],
    },
  },
  [RFQ_STATES.Accepted]: {
    getSummaryPreText: () => 'Accepted: ',
    getActionLabelMarkup: (data) => {
      const timestamp = (new Date(data.payload.lastUpdated) || new Date()).toTimeString();
      const hhmm = timestamp.substring(0, 5);
      const ss = timestamp.substring(5, 8);

      return `Quote accepted by ${data.message.user.displayName} at ${hhmm}<span class="lighten">${ss}</span>`
    },
    getFooterText: (data) => {
      if (data.perspective === PERSPECTIVES.Client) {
        return 'Pending Citi Confirmation';
      }
    },
    buttons: {
      [PERSPECTIVES.Citi]: [{
        text: 'Complete',
        buttonType: 'green',
        nextState: RFQ_STATES.Completed,
      }],
    },
  },
  [RFQ_STATES.Rejected]: {
    getSummaryPreText: () => 'Rejected: ',
    buttons: {
      [PERSPECTIVES.Citi]: [{
        text: 'Complete',
        buttonType: 'green',
        nextState: RFQ_STATES.Completed,
      }],
    },
  },
  [RFQ_STATES.Completed]: {
    getPreHeaderComponent: () => ($(`
      <div class="pre-header-row">
        Trade Confirmation
      </div>
    `)),
    getSummaryPreText: () => 'Completed: ',
    getActionLabelMarkup: (data) => {
      const timestamp = (new Date(data.payload.lastUpdated) || new Date()).toTimeString();
      const hhmm = timestamp.substring(0, 5);
      const ss = timestamp.substring(5, 8);

      return `Trade confirmed by ${data.salesperson.name} at ${hhmm}<span class="lighten">${ss}</span>`
    },
  },
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
  // update state and timestamp
  data.payload.state = buttonDefinition.nextState;
  data.payload.lastUpdated = new Date();

  // socket is declared in window.onload()
  // send this rfq to the server for sending to chatroom
  socket.emit('sendRfqMessageEvent', data);
}

disableUI = () => {
  console.log('disable UI called');
  // for now just show the greyed out overlay
  $('.disable-overlay').show();
}

getHeader = (data) => {
  const rfq = data.payload;

  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }
  const summaryPreText = currentStateMapping.getSummaryPreText ? currentStateMapping.getSummaryPreText(data) : '';

  const inverseDirectionMapping = { BUY: 'SELL', SELL: 'BUY' };
  const citiDirection = inverseDirectionMapping[rfq.direction.toUpperCase()];

  const header = $(`
    <div class="rfq-header-section">
      <div class="citi-logo-wrapper">
        <img src="https://online.citi.com/GFC/branding/img/Citi-Enterprise-White.png"/>
      </div>
      <div class="rfq-info-wrapper">
        <div>${summaryPreText}<span style="color: #00bdf2;">CITI</span> ${citiDirection} ${rfq.size} ${rfq.description.toUpperCase()}</div>
        <div class="rfq-id-small">RFQ ID: ${data.payload.rfqId}</div>
      </div>
    </div>
  `);

  const preHeaderComponent = currentStateMapping.getPreHeaderComponent ? currentStateMapping.getPreHeaderComponent(data) : null;
  if (preHeaderComponent) {
    header.prepend(preHeaderComponent);
  }

  return header;
};

getBody = (data) => {
  const rfq = data.payload;

  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }
  const priceComponent = currentStateMapping.getPriceComponent ? currentStateMapping.getPriceComponent(data) : null;

  // display the size as a comma separated number
  const suffixMultiplierMapping = { k: 1e3, m: 1e6, mm: 1e6, b: 1e9 };
  const suffixMatch = rfq.size.toString().match(/[\D]+$/);
  const sizeValue = Number.parseFloat(rfq.size) * (suffixMultiplierMapping[suffixMatch ? suffixMatch[0] : null] || 1);
  const sizeLabel = sizeValue.toString().replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, '$&,');

  const body = $(`
    <div class="rfq-body-section">
      <div class="rfq-body">
        <span>${rfq.description.toUpperCase()}</span>
        <span>${rfq.isin}</span>
        <span class="notional-wrapper">${sizeLabel}</span>
      </div>
      <div class="rfq-body right">
        <div>CLIENT ${rfq.direction.toUpperCase()}</div>
        <div class="price-wrapper"></div>
      </div>
    </div>
  `);
  body.find('.price-wrapper').append(priceComponent || rfq.price);
  
  return body;
};

getLastActionLabel = (data) => {
  const rfq = data.payload;

  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }
  const actionLabelMarkup = currentStateMapping.getActionLabelMarkup ? currentStateMapping.getActionLabelMarkup(data) : null;

  return actionLabelMarkup ? $(`
    <div class="rfq-footer-section">
      ${actionLabelMarkup}
    </div>
  `) : null;
};


const getFooter = (data) => {
  const rfq = data.payload;
  const currentStateMapping = RFQ_STATE_MAPPING[RFQ_STATES[rfq.state]];
  if (!currentStateMapping) {
    return null;
  }

  const footerContainer = $('<div class="footer-container"></div>');

  const footerText = currentStateMapping.getFooterText ? currentStateMapping.getFooterText(data) : null;
  if (footerText) {
    footerContainer.append($(`
      <span class="footer-text">${footerText}</span>
    `));
  }

  // get buttons as jquery objects with event handlers already attached
  const buttonContainer = $('<div class="rfq-button-container"></div>');
  const buttonDefinitions = currentStateMapping.buttons;
  if (buttonDefinitions && buttonDefinitions[data.perspective]) {
    buttonDefinitions[data.perspective].forEach((buttonDefinition) => {
      const button = $(`
        <button class="rfq-action-button ${buttonDefinition.buttonType}">
          ${buttonDefinition.text}
        </button>
      `).click(e => onActionButtonClicked(data, buttonDefinition));
      buttonContainer.append(button);
    });
  }

  footerContainer.append(buttonContainer);

  return footerContainer;
}

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
  data.perspective = data.currentUser.email === data.message.user.email ? PERSPECTIVES.Client : PERSPECTIVES.Citi;
  if (data.perspective === PERSPECTIVES.Citi) {
    data.salesperson = data.currentUser;
  }

  container.append(getHeader(data));
  container.append(getBody(data));
  container.append(getLastActionLabel(data));
  container.append(getFooter(data));
};
