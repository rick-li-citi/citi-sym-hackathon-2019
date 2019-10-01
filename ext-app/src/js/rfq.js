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
  console.log(JSON.parse(jsonData));
};