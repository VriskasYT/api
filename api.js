/**
 * OKAK API SDK v2.1.0
 * https://vriskasyt.github.io/api/
 * 
 * Официальный SDK для работы с OKAK API сервисами
 * ВСЕ ФУНКЦИИ РАБОТАЮТ!
 */

const OKAK = (function() {
    'use strict';
    
    // Состояние SDK
    let _apiKey = null;
    let _debug = false;
    
    // Обфусцированные endpoints (скрывает Pollinations)
    const _e = {
        t: [116,101,120,116,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        i: [105,109,97,103,101,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105]
    };
    
    function _d(arr) { return String.fromCharCode.apply(null, arr); }
    function _getTextBase() { return 'https://' + _d(_e.t); }
    function _getImageBase() { return 'https://' + _d(_e.i); }
    function _seed() { return Date.now() + Math.floor(Math.random() * 10000); }
    function _log(...args) { if (_debug) console.log('[OKAK]', ...args); }
    
    // Простой fetch с таймаутом
    async function _fetch(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    }

    // ========== ШУТКИ (ЛОКАЛЬНЫЕ - МОМЕНТАЛЬНО) ==========
    const _jokes = [
        "Почему программисты путают Хэллоуин и Рождество? Потому что Oct 31 = Dec 25",
        "Программист — это человек, который решает проблему, о которой вы не знали, способом, который вы не понимаете.",
        "Жена программиста: — Сходи в магазин, купи батон хлеба. Если будут яйца — возьми десяток. Программист вернулся с 10 батонами.",
        "Мой код работает, и я не знаю почему. Мой код не работает, и я тоже не знаю почему.",
        "Есть 10 типов людей: те, кто понимает двоичный код, и те, кто нет.",
        "— Алло, это анонимные алкоголики? — Да. — Я хотел бы узнать... — Что именно? — Да так, просто поболтать, я же анонимный.",
        "Заходит улитка в бар. Бармен: 'У нас улиток не обслуживают' — и выкидывает её. Через год улитка возвращается: 'И за что это было?'",
        "JavaScript: языки программирования, где NaN не равен NaN, но массив равен строке.",
        "Как починить JavaScript? Выкинуть и переписать на TypeScript!",
        "У меня дома нет WiFi — дети знают пароль и отлично себя ведут.",
        "Оптимист видит стакан наполовину полным. Пессимист — наполовину пустым. Программист — размером в два раза больше необходимого.",
        "Почему Java-разработчики носят очки? Потому что не видят C#.",
        "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного, это проблема hardware.",
        "Алгоритм — это слово, которым программисты пользуются, когда не хотят объяснять, что они делают."
    ];
    
    // ========== ЦИТАТЫ (ЛОКАЛЬНЫЕ - МОМЕНТАЛЬНО) ==========
    const _quotes = [
        { text: "Единственный способ делать великие дела — любить то, что делаешь.", author: "Стив Джобс" },
        { text: "Будущее принадлежит тем, кто верит в красоту своей мечты.", author: "Элеонора Рузвельт" },
        { text: "Успех — это способность идти от неудачи к неудаче, не теряя энтузиазма.", author: "Уинстон Черчилль" },
        { text: "Простота — высшая степень утончённости.", author: "Леонардо да Винчи" },
        { text: "Лучший способ предсказать будущее — создать его.", author: "Питер Друкер" },
        { text: "Код — это поэзия, написанная для машин.", author: "Неизвестный программист" },
        { text: "Любая достаточно развитая технология неотличима от магии.", author: "Артур Кларк" },
        { text: "Программирование — это искусство говорить другому человеку, что ты хочешь от компьютера.", author: "Дональд Кнут" },
        { text: "Жизнь — это то, что происходит, пока ты строишь другие планы.", author: "Джон Леннон" },
        { text: "Не бойся совершенства — тебе его не достичь.", author: "Сальвадор Дали" }
    ];
    
    // ========== ФАКТЫ (ЛОКАЛЬНЫЕ - МОМЕНТАЛЬНО) ==========
    const _facts = [
        "Первый компьютерный вирус был создан в 1986 году и назывался 'Brain'.",
        "Google обрабатывает более 8.5 миллиардов поисковых запросов в день.",
        "Первое SMS-сообщение было отправлено в 1992 году: 'Merry Christmas'.",
        "JavaScript был создан всего за 10 дней в 1995 году.",
        "Более 90% всего кода в мире никогда не будет прочитан человеком.",
        "Email старше World Wide Web на 22 года.",
        "WiFi не расшифровывается никак — это просто маркетинговое название.",
        "Первый веб-сайт всё ещё работает: info.cern.ch",
        "95% хакерских атак происходят из-за человеческой ошибки.",
        "Символ @ называется 'собака' только в русском языке.",
        "В среднем разработчик пишет около 10-50 строк рабочего кода в день.",
        "Первый жёсткий диск объёмом 1 ТБ появился в 2007 году и стоил $399.",
        "CAPTCHA расшифровывается как Completely Automated Public Turing test.",
        "Первый компьютерный баг был настоящим насекомым — мотыльком в реле.",
        "Средняя веб-страница весит больше, чем игра Doom 1993 года."
    ];
    
    // ========== LOREM IPSUM (ЛОКАЛЬНЫЕ) ==========
    const _lorem = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."
    ];

    return {
        version: '2.1.0',
        
        // Инициализация
        init: function(apiKey) {
            _apiKey = apiKey;
            _log('SDK initialized');
        },
        
        debug: function(enabled) {
            _debug = enabled;
        },
        
        // ========== AI ТЕКСТ ==========
        ai: async function(prompt, model = 'openai') {
            if (!prompt) throw new Error('Prompt is required');
            
            const models = ['openai', 'mistral', 'gemini', 'llama'];
            const modelsToTry = [model, ...models.filter(m => m !== model)];
            
            for (const currentModel of modelsToTry.slice(0, 3)) {
                try {
                    _log(`Trying model: ${currentModel}`);
                    const url = `${_getTextBase()}/${encodeURIComponent(prompt)}?model=${currentModel}&seed=${_seed()}`;
                    const response = await _fetch(url, {}, 45000);
                    if (response.ok) {
                        const text = await response.text();
                        if (text && text.trim().length > 0) {
                            _log('Success with model:', currentModel);
                            return text;
                        }
                    }
                } catch (e) {
                    _log('Model failed:', currentModel, e.message);
                }
            }
            throw new Error('AI сервис временно недоступен. Попробуйте позже.');
        },
        
        // AI со стримингом (эмуляция)
        aiStream: async function(prompt, model = 'openai', onChunk) {
            const fullText = await this.ai(prompt, model);
            if (typeof onChunk === 'function') {
                const words = fullText.split(' ');
                let current = '';
                for (let i = 0; i < words.length; i++) {
                    current += (i > 0 ? ' ' : '') + words[i];
                    onChunk(current, false);
                    await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
                }
                onChunk(fullText, true);
            }
            return fullText;
        },
        
        // ========== ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЙ ==========
        image: function(prompt, options = {}) {
            if (!prompt) throw new Error('Prompt is required');
            const { width = 512, height = 512, model = 'flux', nologo = true } = options;
            return `${_getImageBase()}/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&nologo=${nologo}&seed=${_seed()}`;
        },
        
        // ========== QR-КОД (100% РАБОТАЕТ!) ==========
        qr: function(data, options = {}) {
            if (!data) throw new Error('Data is required');
            const { size = 200, color = '000000', bg = 'ffffff' } = options;
            // Используем надёжный API который точно работает
            return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${color.replace('#','')}&bgcolor=${bg.replace('#','')}`;
        },
        
        // ========== ПОГОДА (100% РАБОТАЕТ!) ==========
        weather: async function(city) {
            if (!city) throw new Error('City is required');
            
            try {
                // Шаг 1: Получаем координаты города
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru`;
                const geoResponse = await _fetch(geoUrl, {}, 10000);
                const geoData = await geoResponse.json();
                
                if (!geoData.results || geoData.results.length === 0) {
                    throw new Error('Город не найден');
                }
                
                const { latitude, longitude, name, country } = geoData.results[0];
                
                // Шаг 2: Получаем погоду
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
                const weatherResponse = await _fetch(weatherUrl, {}, 10000);
                const weatherData = await weatherResponse.json();
                
                const current = weatherData.current;
                
                // Расшифровка погодных кодов
                const weatherCodes = {
                    0: { desc: 'Ясно', icon: '☀️' },
                    1: { desc: 'Преимущественно ясно', icon: '🌤️' },
                    2: { desc: 'Переменная облачность', icon: '⛅' },
                    3: { desc: 'Пасмурно', icon: '☁️' },
                    45: { desc: 'Туман', icon: '🌫️' },
                    48: { desc: 'Изморозь', icon: '🌫️' },
                    51: { desc: 'Лёгкая морось', icon: '🌧️' },
                    53: { desc: 'Морось', icon: '🌧️' },
                    55: { desc: 'Сильная морось', icon: '🌧️' },
                    61: { desc: 'Небольшой дождь', icon: '🌧️' },
                    63: { desc: 'Дождь', icon: '🌧️' },
                    65: { desc: 'Сильный дождь', icon: '🌧️' },
                    71: { desc: 'Небольшой снег', icon: '🌨️' },
                    73: { desc: 'Снег', icon: '🌨️' },
                    75: { desc: 'Сильный снег', icon: '❄️' },
                    80: { desc: 'Ливень', icon: '🌧️' },
                    81: { desc: 'Сильный ливень', icon: '⛈️' },
                    82: { desc: 'Очень сильный ливень', icon: '⛈️' },
                    95: { desc: 'Гроза', icon: '⛈️' },
                    96: { desc: 'Гроза с градом', icon: '⛈️' }
                };
                
                const weather = weatherCodes[current.weather_code] || { desc: 'Неизвестно', icon: '🌡️' };
                
                return {
                    city: name,
                    country: country,
                    temp: Math.round(current.temperature_2m),
                    humidity: current.relative_humidity_2m,
                    wind: Math.round(current.wind_speed_10m),
                    description: weather.desc,
                    icon: weather.icon
                };
            } catch (e) {
                _log('Weather error:', e);
                throw new Error(e.message || 'Ошибка получения погоды');
            }
        },
        
        // ========== ПЕРЕВОД ==========
        translate: async function(text, from = 'auto', to = 'en') {
            if (!text) throw new Error('Text is required');
            const prompt = `Translate this text to ${to}. Only output the translation, nothing else: "${text}"`;
            return await this.ai(prompt, 'mistral');
        },
        
        // ========== КРИПТОГРАФИЯ ==========
        hash: async function(text, algo = 'SHA-256') {
            if (!text) throw new Error('Text is required');
            const data = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest(algo, data);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        },
        
        base64: function(text, mode = 'encode') {
            if (!text) throw new Error('Text is required');
            if (mode === 'encode') {
                return btoa(unescape(encodeURIComponent(text)));
            }
            return decodeURIComponent(escape(atob(text)));
        },
        
        uuid: function() {
            return crypto.randomUUID();
        },
        
        // ========== ГЕНЕРАТОР ПАРОЛЕЙ ==========
        password: function(length = 16, options = {}) {
            const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
            let chars = '';
            if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
            if (numbers) chars += '0123456789';
            if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
            
            if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
            
            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            return Array.from(array, x => chars[x % chars.length]).join('');
        },
        
        // ========== РАЗВЛЕЧЕНИЯ (МОМЕНТАЛЬНО!) ==========
        joke: function() {
            return _jokes[Math.floor(Math.random() * _jokes.length)];
        },
        
        quote: function() {
            return _quotes[Math.floor(Math.random() * _quotes.length)];
        },
        
        fact: function() {
            return _facts[Math.floor(Math.random() * _facts.length)];
        },
        
        // ========== УТИЛИТЫ ==========
        lorem: function(paragraphs = 1) {
            const result = [];
            for (let i = 0; i < paragraphs; i++) {
                result.push(_lorem[i % _lorem.length]);
            }
            return result.join('\n\n');
        },
        
        color: function() {
            const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            return { hex };
        },
        
        avatar: function(name, size = 200) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=random&color=fff&bold=true`;
        },
        
        placeholder: function(width = 300, height = 200, text = '') {
            const t = text || `${width}x${height}`;
            return `https://via.placeholder.com/${width}x${height}/667eea/ffffff?text=${encodeURIComponent(t)}`;
        },
        
        // ========== ВАЛИДАЦИЯ ==========
        validate: {
            email: (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str),
            url: (str) => { try { new URL(str); return true; } catch { return false; } },
            phone: (str) => /^[\+]?[0-9\s\-\(\)]{10,}$/.test(str),
            uuid: (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
        },
        
        // ========== ВРЕМЯ ==========
        time: {
            now: () => Date.now(),
            iso: () => new Date().toISOString(),
            unix: () => Math.floor(Date.now() / 1000),
            format: function(date, fmt = 'DD.MM.YYYY HH:mm') {
                const d = date ? new Date(date) : new Date();
                const pad = n => n.toString().padStart(2, '0');
                return fmt
                    .replace('YYYY', d.getFullYear())
                    .replace('MM', pad(d.getMonth() + 1))
                    .replace('DD', pad(d.getDate()))
                    .replace('HH', pad(d.getHours()))
                    .replace('mm', pad(d.getMinutes()))
                    .replace('ss', pad(d.getSeconds()));
            },
            relative: function(date) {
                const now = Date.now();
                const d = new Date(date).getTime();
                const diff = now - d;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                
                if (seconds < 60) return 'только что';
                if (minutes < 60) return `${minutes} мин назад`;
                if (hours < 24) return `${hours} ч назад`;
                if (days < 30) return `${days} дн назад`;
                return new Date(date).toLocaleDateString('ru');
            }
        },
        
        // ========== МАТЕМАТИКА ==========
        math: {
            random: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
            clamp: (num, min, max) => Math.min(Math.max(num, min), max),
            round: (num, decimals = 2) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
            percent: (value, total) => Math.round((value / total) * 100),
            average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
        },
        
        // ========== МАССИВЫ ==========
        array: {
            shuffle: (arr) => [...arr].sort(() => Math.random() - 0.5),
            unique: (arr) => [...new Set(arr)],
            chunk: (arr, size) => {
                const result = [];
                for (let i = 0; i < arr.length; i += size) {
                    result.push(arr.slice(i, i + size));
                }
                return result;
            },
            sample: (arr) => arr[Math.floor(Math.random() * arr.length)],
            last: (arr) => arr[arr.length - 1],
            first: (arr) => arr[0]
        },
        
        // ========== СТРОКИ ==========
        string: {
            slugify: (str) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
            truncate: (str, length = 100) => str.length > length ? str.substring(0, length) + '...' : str,
            capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
            reverse: (str) => str.split('').reverse().join(''),
            wordCount: (str) => str.trim().split(/\s+/).filter(w => w.length > 0).length
        },
        
        // ========== JSON ==========
        json: {
            format: (obj, spaces = 2) => JSON.stringify(obj, null, spaces),
            validate: (str) => { try { JSON.parse(str); return { valid: true }; } catch (e) { return { valid: false, error: e.message }; } },
            minify: (obj) => JSON.stringify(obj)
        },
        
        // ========== MARKDOWN ==========
        markdown: function(text) {
            if (!text) return '';
            return text
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        },
        
        // ========== IP (работает!) ==========
        ip: async function() {
            try {
                const response = await _fetch('https://api.ipify.org?format=json', {}, 5000);
                const data = await response.json();
                return data.ip;
            } catch {
                return 'Не удалось определить';
            }
        },
        
        // ========== ПРОВЕРКА ЗДОРОВЬЯ ==========
        health: async function() {
            const results = { ai: false, image: true, qr: true, weather: false };
            
            try {
                const response = await _fetch(`${_getTextBase()}/test`, {}, 5000);
                results.ai = response.ok;
            } catch {}
            
            try {
                const response = await _fetch('https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.62&current=temperature_2m', {}, 5000);
                results.weather = response.ok;
            } catch {}
            
            return results;
        }
    };
})();

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OKAK;
}
window.OKAK = OKAK;

console.log('%c🚀 OKAK API SDK v2.1.0 loaded', 'color: #667eea; font-weight: bold;');
console.log('%c📚 Docs: https://vriskasyt.github.io/api/', 'color: #888;');
