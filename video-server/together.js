const ws = require('ws');

const wss = new ws.WebSocketServer({
  port: 3031
});


const run = () => {
  wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
      console.log('received: %s', data);
    });
  
    ws.send('Hello my dear friend');
  });
}

module.exports = { run };