const RFQ_STATES = {
  Initiated: 'Initiated',
  Acknowledged: 'Acknowledged',
  Countered: 'Countered',
  Accepted: 'Accepted',
  Rejected: 'Rejected',
  Completed: 'Completed',
};

const RFQ_BUTTON_MAPPING = {
  [RFQ_STATES.Initiated]: [{
    text: 'Acknowledge',
    buttonType: 'primary',
    nextState: RFQ_STATES.Acknowledged,
  }],
  [RFQ_STATES.Acknowledged]: [
    {
      text: 'Counter',
      buttonType: 'primary',
      nextState: RFQ_STATES.Countered,
    },
    {
      text: 'Accept',
      buttonType: 'primary',
      nextState: RFQ_STATES.Accepted,
    },
    {
      text: 'Reject',
      buttonType: 'primary',
      nextState: RFQ_STATES.Rejected,
    },
  ],
  [RFQ_STATES.Countered]: [{
    text: 'Counter',
    buttonType: 'primary',
    nextState: RFQ_STATES.Countered,
  }],
  [RFQ_STATES.Accepted]: [{
    text: 'Complete',
    buttonType: 'primary',
    nextState: RFQ_STATES.Completed,
  }],
  [RFQ_STATES.Rejected]: [{
    text: 'Complete',
    buttonType: 'primary',
    nextState: RFQ_STATES.Completed,
  }]
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

onActionButtonClicked = (data, nextState) => {
  // update state
  data.payload.state = nextState;

  // socket is declared in window.onload()
  // expect the server to send an event with this rfqId as the event name when it receives our message
  socket.on(data.payload.rfqId, disableUI);
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
  const currentState = RFQ_STATES[rfq.state];
  const buttonDefinitions = RFQ_BUTTON_MAPPING[currentState];
  if (buttonDefinitions) {
    buttonDefinitions.forEach((buttonDefinition) => {
      const button = $(`
        <button class="rfq-action-button ${buttonDefinition.buttonType}">
          ${buttonDefinition.text}
        </button>
      `).click(e => onActionButtonClicked(data, buttonDefinition.nextState));
      buttons.push(button);
    });
  }
  return buttons;
}

// update ui componens from the parsed url param json
const updateUIComponents = (data) => {
  const { message, payload } = data;

  $('#message-text').text(message ? message.messageText : '');
  $('#received-data').text(JSON.stringify(payload, null, 4));
  $('#rfq-id-label').text(payload.rfqId);
  
  // summary of the rfq with fields (may be editable according to rfq state)
  const rfqEditableContainer = $('#rfq-edit-container');
  // clear everything first
  rfqEditableContainer.children().remove();
  // create components with corresponding event handlers
  const preText = $(`
    <span class="rfq-display-segment">${message.user.displayName} wants to ${payload.direction}</span>
  `);
  /*const directionDropdown = $(`
    <select class="rfq-display-segment" value="${payload.direction}">
      <option value="buy"${payload.direction === 'buy' ? 'selected' : ''}>buy</option>
      <option value="sell"${payload.direction === 'sell' ? 'selected' : ''}>sell</option>
    </select>
  `).change(e => payload.direction = e.target.value);*/
  const sizeInput = $(`
    <input class="rfq-display-segment" type="text" value="${payload.size}" />
  `);
  const descriptionText = $(`
    <span class="rfq-display-segment">${payload.description} at $</span>
  `);
  const priceInput = $(`
    <input class="rfq-display-segment" type="text" value="${payload.price}" />
  `).on('input', e => payload.price = e.target.value);

  // add components to container
  rfqEditableContainer.append(
    preText)/*.append(
    directionDropdown)*/.append(
    sizeInput).append(
    descriptionText).append(
    priceInput
  );

  // contains buttons for the user to ack/counter
  const actionsContainer = $('#rfq-actions-container');
  actionsContainer.children().remove();
  const buttons = getActionButtons(data);
  // add buttons to container
  buttons.forEach(button => actionsContainer.append(button));
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
  console.log('RFQ page data received:', data);
  data = enhanceDataWithRfqState(data);
  console.log('RFQ page data enhanced:', data);
  updateUIComponents(data);
};
