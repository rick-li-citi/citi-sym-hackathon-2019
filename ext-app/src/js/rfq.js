const updateUIComponents = (data) => {
  document.getElementById('message-text').textContent = data.message.messageText;
  document.getElementById('received-data').textContent = JSON.stringify(data.payload, null, 4);
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
