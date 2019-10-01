1. open https://develop2.symphony.com/client/index.html?bundle=https://localhost:4000/bundle.json
2. 'npm start' in root directory runs the bot on localhost:3000
3. 'npm run watch' in ./ext-app runs the extension app on localhost:4000

data flow:
1. botHearsSomething
  a. TODO: process message (NLP)
  b. send message, will be received by controller
2. controller (render function)
  a. receive data from botHearsSomething
  b. format data into url safe json string
  c. return messageML template containing iframe to rfq page with data as url param
3. rfq
  a. receive data from controller's render function
  b. TODO: render UI based on data
  c. TODO: user interaction, post back to chatroom?
