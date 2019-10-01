window.onload = function(){
  const socket = io('https://localhost:3000');

  socket.on('serverEvent', data => {
    console.log('Received ServerEvent', data);
  });

  setInterval(() => {
    socket.emit('clientEvent', new Date());
  }, 1000);
};