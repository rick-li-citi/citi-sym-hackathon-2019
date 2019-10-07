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
    nextState: RFQ_STATES.Acknowledged,
  }],
  [RFQ_STATES.Acknowledged]: [
    {
      text: 'Counter',
      nextState: RFQ_STATES.Countered,
    },
    {
      text: 'Accept',
      nextState: RFQ_STATES.Accepted,
    },
    {
      text: 'Reject',
      nextState: RFQ_STATES.Rejected,
    },
  ],
  [RFQ_STATES.Countered]: [{
    text: 'Counter',
    nextState: RFQ_STATES.Countered,
  }],
  [RFQ_STATES.Accepted]: [{
    text: 'Complete',
    nextState: RFQ_STATES.Completed,
  }],
  [RFQ_STATES.Rejected]: [{
    text: 'Complete',
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

onActionButtonClicked = (rfq, nextState) => {
  // TODO: send message with rfq and updated fields to chatroom
  console.log(rfq, nextState)
}

// get buttons as jquery objects with event handlers already attached
const getActionButtons = (rfq) => {
  let buttons = [];
  const currentState = RFQ_STATES[rfq.state];
  const buttonDefinitions = RFQ_BUTTON_MAPPING[currentState];
  if (buttonDefinitions) {
    buttonDefinitions.forEach((buttonDefinition) => {
      const button = $(`
        <button class="rfq-action-button">
          ${buttonDefinition.text}
        </button>
      `).click(e => onActionButtonClicked(rfq, buttonDefinition.nextState));
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
  const buttons = getActionButtons(payload);
  // add buttons to container
  buttons.forEach(button => actionsContainer.append(button));
}

const prevRfqId = 0;
window.onload = function(){
  const socket = io('https://localhost:3000');

  socket.on('serverEvent', data => {
    console.log('Received ServerEvent', data);
  });
/*
  setInterval(() => {
    socket.emit('clientEvent', new Date());
  }, 1000);*/
  
  const urlParams = new URLSearchParams(window.location.search);
  const jsonData = urlParams.get('data');
  let data = JSON.parse(jsonData);
  console.log('RFQ page data received:', data);
  data = enhanceDataWithRfqState(data);
  console.log('RFQ page data enhanced:', data);
  updateUIComponents(data);
};
