//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');



var server = require('http').Server(app); // Подключаем http через app
var io = require('socket.io')(server); // Подключаем socket.io и указываем на сервер
var log4js = require('log4js'); // Подключаем наш логгер
var logger = log4js.getLogger(); // Подключаем с модуля log4js сам логгер 



Object.assign=require('object-assign')
app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";


logger.debug('Script has been started...'); // Логгируем.


if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);






app.use(express.static(__dirname + '/views')); 
io.on('connection', function (socket) { 
  // Создаем обработчик события 'connection' которое создает io.connect(port); 
  // с аргументом socket
  var name = 'U' + (socket.id).toString().substr(1,4); 
  // Создаем никнейм нашему клиенту. В начале буква 'U' дальше берем 3 символа ID (сокета) 
  //после первого символа, и все это клеим с помощью '+'
  socket.broadcast.emit('newUser', name); 
  // Отсылает событие 'newUser' всем подключенным, кроме текущего. 
  // На клиенте навешаем обработчик на 'newUser' 
  //(Отправляет клиентам событие о подключении нового юзера)
  socket.emit('userName', name); 
  // Отправляем текущему клиенту событие 'userName' с его ником (name) 
  //(Отправляем клиенту его юзернейм)
  logger.info(name + ' connected to chat!'); // Логгирование
});


io.on('connection', function (socket) {
  var name = 'U' + (socket.id).toString().substr(1,4);
  socket.broadcast.emit('newUser', name);

logger.info(name + ' connected to chat!');
  socket.emit('userName', name);
  // Обработчик ниже // Мы его сделали внутри коннекта

socket.on('message', function(msg){ // Обработчик на событие 'message' и аргументом (msg) из переменной message
    logger.warn('-----------'); // Logging
    logger.warn('User: ' + name + ' | Message: ' + msg);
    logger.warn('====> Sending message to other chaters...');
    io.sockets.emit('messageToClients', msg, name); // Отправляем всем сокетам событие 'messageToClients' и отправляем туда же два аргумента (текст, имя юзера)
  });
});






module.exports = app ;
