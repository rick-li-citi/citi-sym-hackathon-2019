const tableColumnDefinitions = [
  {
    header: 'ID',
    field: 'rfqId',
  },
  {
    header: 'Description',
    field: 'description',
  },
  {
    header: 'Direction',
    field: 'direction',
  },
  {
    header: 'Size',
    field: 'size',
  },
  {
    header: 'Price',
    field: 'price',
  },
];

const updateUIComponents = (data) => {
  const { message, payload } = data;
  $('#message-text').text(message ? message.messageText : '');
  $('#received-data').text(JSON.stringify(payload, null, 4));
  
  const rfqEditableContainer = $('#rfq-edit-container');
  const preText = $(`
    <span class="rfq-display-segment">${message.user.displayName} wants to</span>
  `);
  const directionDropdown = $(`
    <select class="rfq-display-segment" value="${payload.direction}">
      <option value="buy">buy</option>
      <option value="sell">sell</option>
    </select>
  `);
  const sizeInput = $(`
    <input class="rfq-display-segment" type="text" value="${payload.size}" />
  `);
  const descriptionText = $(`
    <span class="rfq-display-segment">${payload.description} at $</span>
  `);
  const priceInput = $(`
    <input class="rfq-display-segment" type="text" value="${payload.price}" />
  `);

  rfqEditableContainer.append(preText).append(directionDropdown).append(sizeInput).append(descriptionText).append(priceInput);
}

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
  const data = JSON.parse(jsonData);
  console.log('RFQ page data received:', data);
  updateUIComponents(data);
};
