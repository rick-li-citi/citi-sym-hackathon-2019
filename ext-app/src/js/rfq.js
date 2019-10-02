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

  const tableContainer = $('#rfq-table-container');
  const table = $(`
    <table class="rfq-table">
      <thead><tr></tr></thead>
      <tbody><tr></tr></tbody>
    </table>
  `);

  tableColumnDefinitions.forEach((colDef) => {
    const headerRow = table.find('thead > tr');
    const bodyRow = table.find('tbody > tr');

    headerRow.append($(`<th>${colDef.header}</th>`));
    bodyRow.append($(`<td>${payload[colDef.field]}</th>`));
  });

  tableContainer.append(table);
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
