var port = 8080; // Указываем порт на котором у на стоит сокет

var socket = io.connect('0.0.0.0:' + port); 
// Тут мы объявляем "socket" (дальше мы будем с ним работать) 
// и подключаемся сразу к серверу через порт


socket.on('userName', function(userName){ 
	// Создаем прослушку 'userName' и принимаем переменную 
	// name в виде аргумента 'userName'
	console.log('You\'r username is => ' + userName); 
	// Логгирование в консоль браузера
	$('textarea').val($('textarea').val() + 'You\'r username => ' + userName + '\n'); 
	// Выводим в поле для текста оповещение для подключенного с его ником
});

socket.on('newUser', function(userName){ // Думаю тут понятно уже =)
	console.log('New user has been connected to chat | ' + userName); // Логгирование
	$('textarea').val($('textarea').val() + userName + ' connected!\n'); 
	// Это событие было отправлено всем кроме только подключенного, 
	// по этому мы пишем другим юзерам в поле что 'подключен новый юзер' с его ником
});

$(document).on('click', 'button', function(){ // Прослушка кнопки на клик
	var message = $('input').val(); 
	// Все что в поле для ввода записываем в переменную
	socket.emit('message', message); 
	// Отправляем событие 'message' на сервер c самим текстом (message)- как переменная
	$('input').val(null); // Заполняем поле для ввода 'пустотой'
});


socket.on('messageToClients', function(msg, name){
	console.log(name + ' | => ' + msg); 
	// Логгирование в консоль браузера
	$('textarea').val($('textarea').val() + name + ' : '+ msg +'\n'); // Добавляем в поле для текста сообщение типа (Ник : текст)
});
