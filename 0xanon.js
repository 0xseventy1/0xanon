const TelegramBot = require('node-telegram-bot-api');
const token = '6999327845:AAE_UDtzqzsrj20gBbhepqHCCxEZko-ywCI'; // Укажите свой токен
const bot = new TelegramBot(token, { polling: true });

let waitingUsers = [];
let chats = {};
const waitingTimeout = 60000; // 1 минута

// Главное меню с кнопками
const mainMenu = {
    reply_markup: {
        keyboard: [
            [{ text: '🔍 Найти собеседника' }],
            [{ text: '📞 Контакты' }] // Добавляем кнопку "Контакты"
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};

// Меню чата с кнопкой выхода
const chatMenu = {
    reply_markup: {
        keyboard: [
            [{ text: '❌ Выйти из чата' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};

// Обработчик команд /start и /help
bot.onText(/\/(start|help)/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Добро пожаловать! Нажмите "🔍 Найти собеседника", чтобы начать общение.', mainMenu);
});

// Обработка нажатия кнопки
bot.on('message', (msg) => {
    const userId = msg.from.id;

    if (msg.text === '🔍 Найти собеседника') {
        handleFindCompanion(userId);
    } else if (msg.text === '❌ Выйти из чата') {
        handleExitChat(userId);
    } else if (msg.text === '📞 Контакты') { // Обработка нажатия кнопки "Контакты"
        bot.sendMessage(userId, 'Контакт администратора: @gustavik_olegarh');
    } else {
        forwardMessage(userId, msg.text);
    }
});

function handleFindCompanion(userId) {
    if (waitingUsers.includes(userId)) {
        bot.sendMessage(userId, 'Поиск собеседника уже выполняется. Пожалуйста, подождите.');
        return;
    }

    if (waitingUsers.length > 0) {
        const partnerId = waitingUsers.shift();
        startChat(userId, partnerId);
    } else {
        waitingUsers.push(userId);
        bot.sendMessage(userId, 'Поиск собеседника... Ожидайте.');
        setTimeout(() => {
            const index = waitingUsers.indexOf(userId);
            if (index !== -1) {
                waitingUsers.splice(index, 1);
                bot.sendMessage(userId, 'Не удалось найти собеседника. Попробуйте позже.', mainMenu);
            }
        }, waitingTimeout);
    }
}

function handleExitChat(userId) {
    const partnerId = chats[userId];
    if (partnerId) {
        bot.sendMessage(partnerId, 'Собеседник покинул чат. Возвращаем вас на главный экран.', mainMenu);
        delete chats[partnerId];
    }

    bot.sendMessage(userId, 'Вы покинули чат. Возвращаем вас на главный экран.', mainMenu);
    delete chats[userId];
}

function startChat(userId, partnerId) {
    chats[userId] = partnerId;
    chats[partnerId] = userId;

    bot.sendMessage(userId, 'Собеседник найден! Начните общение. Для выхода нажмите "❌ Выйти из чата"', chatMenu);
    bot.sendMessage(partnerId, 'Собеседник найден! Начните общение. Для выхода нажмите "❌ Выйти из чата"', chatMenu);
}

function forwardMessage(userId, text) {
    const partnerId = chats[userId];
    if (partnerId) {
        bot.sendMessage(partnerId, text);
    }
}

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.log(error);
    // Можно опционально уведомить пользователей об ошибке
    // bot.sendMessage(adminChatId, `Ошибка бота: ${error.message}`);
});

process.on('SIGINT', () => {
    bot.stopPolling();
    process.exit();
});

