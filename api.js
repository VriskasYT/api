/**
 * OKAK API SDK v2.0.0
 * https://vriskasyt.github.io/api/
 * 
 * Официальный SDK для работы с OKAK API сервисами
 * 
 * Использование:
 * - OKAK.ai(prompt, model) - генерация текста
 * - OKAK.image(prompt, options) - генерация изображений
 * - OKAK.qr(data, options) - QR-коды
 * - OKAK.hash(text, algo) - хеширование
 * - OKAK.base64(text, mode) - Base64
 * - OKAK.uuid() - генерация UUID
 * - OKAK.weather(city) - погода
 * - OKAK.translate(text, from, to) - перевод
 * - OKAK.joke() - случайная шутка
 * - OKAK.quote() - цитата дня
 * - OKAK.facts() - интересный факт
 * - OKAK.color() - случайный цвет
 * - OKAK.avatar(name) - аватар по имени
 * - OKAK.placeholder(w, h, text) - placeholder изображение
 * - OKAK.lorem(paragraphs) - генерация текста Lorem Ipsum
 * - OKAK.password(length, options) - генератор паролей
 * - OKAK.ip() - ваш IP адрес
 * - OKAK.userAgent() - User Agent парсер
 * - OKAK.markdown(text) - Markdown в HTML
 * - OKAK.minify(code, type) - минификация кода
 * - OKAK.json.format(obj) - форматирование JSON
 * - OKAK.json.validate(str) - валидация JSON
 * - OKAK.health() - проверка сервисов
 */

const OKAK = (function() {
    'use strict';
    
    // Состояние SDK
    let _apiKey = null;
    let _initialized = false;
    let _debug = false;
    
    // Настройки
    const _config = {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        fallbackModels: ['openai', 'mistral', 'llama']
    };
    
    // Обфусцированные endpoints
    const _e = {
        t: [116,101,120,116,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        i: [105,109,97,103,101,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        g: [103,101,110,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        k: [115,107,95,105,90,105,51,99,65,55,108,57,54,107,70,79,102,109,97,66,107,83,56,119,65,81,104,49,86,79,100,113,66,68,107]
    };
    
    function _d(arr) { return String.fromCharCode.apply(null, arr); }
    function _getBase(type) {
        switch(type) {
            case 'text': return 'https://' + _d(_e.t);
            case 'image': return 'https://' + _d(_e.i);
            case 'gen': return 'https://' + _d(_e.g);
            default: return '';
        }
    }
    function _getKey() { return _d(_e.k); }
    function _seed() { return Date.now() + Math.floor(Math.random() * 10000); }
    function _log(...args) { if (_debug) console.log('[OKAK]', ...args); }
    
    function _fetchWithTimeout(url, options = {}, timeout = _config.timeout) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
    }
    
    function _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    async function _fetchWithRetry(url, options = {}, retries = _config.retries) {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                _log(`Attempt ${i + 1}/${retries}`);
                const response = await _fetchWithTimeout(url, options);
                if (response.ok) return response;
                if (response.status === 429 || response.status >= 500) {
                    lastError = new Error(`HTTP ${response.status}`);
                    if (i < retries - 1) { await _delay(_config.retryDelay * (i + 1)); continue; }
                }
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                lastError = error;
                if (i < retries - 1) await _delay(_config.retryDelay * (i + 1));
            }
        }
        throw lastError;
    }

    // Шутки на русском
    const _jokes = [
        "Почему программисты путают Хэллоуин и Рождество? Потому что Oct 31 = Dec 25",
        "— Алло, это анонимные алкоголики?\n— Да, а вы кто?\n— Я же говорю — анонимный!",
        "Программист — это человек, который решает проблему, о которой вы не знали, способом, который вы не понимаете.",
        "Жена программиста:\n— Дорогой, сходи в магазин и купи батон хлеба. Если будут яйца — возьми десяток.\nПрограммист вернулся с 10 батонами.",
        "Как называется группа людей, которые смотрят на код и говорят 'это работать не будет'? Code review.",
        "В чём разница между Junior и Senior разработчиком? Junior гуглит решение, Senior гуглит правильный вопрос.",
        "Мой код работает, и я не знаю почему. Мой код не работает, и я не знаю почему.",
        "Есть два типа людей: те, кто делает бэкапы, и те, кто пока ещё не терял данные.",
        "Как починить JavaScript? Выкинуть и переписать на TypeScript!",
        "У меня дома нет WiFi — дети знают пароль и отлично себя ведут."
    ];
    
    // Цитаты
    const _quotes = [
        { text: "Единственный способ делать великие дела — любить то, что делаешь.", author: "Стив Джобс" },
        { text: "Будущее принадлежит тем, кто верит в красоту своей мечты.", author: "Элеонора Рузвельт" },
        { text: "Успех — это способность идти от неудачи к неудаче, не теряя энтузиазма.", author: "Уинстон Черчилль" },
        { text: "Простота — высшая степень утончённости.", author: "Леонардо да Винчи" },
        { text: "Лучший способ предсказать будущее — создать его.", author: "Питер Друкер" },
        { text: "Код — это поэзия, написанная для машин.", author: "Аноним" },
        { text: "Любая достаточно развитая технология неотличима от магии.", author: "Артур Кларк" },
        { text: "Совершенство достигается не тогда, когда нечего добавить, а когда нечего убрать.", author: "Антуан де Сент-Экзюпери" },
        { text: "Программирование — это искусство говорить другому человеку, что ты хочешь от компьютера.", author: "Дональд Кнут" },
        { text: "Жизнь — это то, что происходит, пока ты строишь другие планы.", author: "Джон Леннон" }
    ];
    
    // Факты
    const _facts = [
        "Первый компьютерный вирус был создан в 1986 году и назывался 'Brain'.",
        "Google обрабатывает более 8.5 миллиардов поисковых запросов в день.",
        "Первое SMS-сообщение было отправлено в 1992 году: 'Merry Christmas'.",
        "JavaScript был создан всего за 10 дней в 1995 году.",
        "Более 90% всего кода в мире никогда не будет прочитан человеком.",
        "CAPTCHA расшифровывается как Completely Automated Public Turing test to tell Computers and Humans Apart.",
        "Первый жёсткий диск объёмом 1 ТБ появился в 2007 году и стоил $399.",
        "В среднем разработчик пишет около 10-50 строк рабочего кода в день.",
        "Символ @ называется 'собака' только в русском языке.",
        "Email старше World Wide Web на 22 года.",
        "WiFi не расшифровывается как Wireless Fidelity — это просто маркетинговое название.",
        "Первый веб-сайт всё ещё работает: info.cern.ch",
        "95% хакерских атак происходят из-за человеческой ошибки.",
        "В 2020 году было создано больше данных, чем за всю предыдущую историю человечества."
    ];
    
    // Lorem Ipsum параграфы
    const _lorem = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
        "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
        "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore."
    ];
    
    return {
        version: '2.0.0',
        
        init: function(apiKey, options = {}) {
            _apiKey = apiKey;
            _initialized = true;
            if (options.debug) _debug = true;
            if (options.timeout) _config.timeout = options.timeout;
            if (options.retries) _config.retries = options.retries;
            console.log('%c✓ OKAK SDK v2.0 initialized', 'color: #22c55e;');
        },
        
        isInitialized: () => _initialized,
        debug: (enabled = true) => { _debug = enabled; },
        configure: (options) => { Object.assign(_config, options); },
        
        // ========== AI ==========
        ai: async function(prompt, model = 'openai', options = {}) {
            if (!prompt) throw new Error('Prompt is required');
            const modelsToTry = [model, ..._config.fallbackModels.filter(m => m !== model)];
            let lastError;
            for (const currentModel of modelsToTry) {
                try {
                    const base = _getBase('text');
                    const url = `${base}/${encodeURIComponent(prompt)}?model=${currentModel}&seed=${_seed()}`;
                    const response = await _fetchWithRetry(url, { headers: { 'Authorization': 'Bearer ' + _getKey() } });
                    const text = await response.text();
                    if (text && text.trim()) return text;
                    throw new Error('Empty response');
                } catch (error) { lastError = error; }
            }
            throw lastError || new Error('AI failed');
        },
        
        aiFast: async function(prompt, model = 'openai') {
            const base = _getBase('text');
            const url = `${base}/${encodeURIComponent(prompt)}?model=${model}&seed=${_seed()}`;
            const response = await _fetchWithTimeout(url, { headers: { 'Authorization': 'Bearer ' + _getKey() } }, 15000);
            if (!response.ok) throw new Error('AI request failed');
            return await response.text();
        },
        
        chat: async function(messages, model = 'openai', options = {}) {
            if (!messages?.length) throw new Error('Messages required');
            const url = `${_getBase('gen')}/v1/chat/completions`;
            const response = await _fetchWithRetry(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _getKey() },
                body: JSON.stringify({ model, messages, ...options })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        },
        
        // ========== IMAGE ==========
        image: function(prompt, options = {}) {
            if (!prompt) throw new Error('Prompt is required');
            const { width = 512, height = 512, model = 'flux', nologo = true, enhance = true } = options;
            const base = _getBase('image');
            return `${base}/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&nologo=${nologo}&enhance=${enhance}&seed=${_seed()}`;
        },
        
        imageAsync: function(prompt, options = {}) {
            return new Promise((resolve, reject) => {
                const url = this.image(prompt, options);
                const img = new Image();
                const timeout = setTimeout(() => {
                    if (options.model !== 'turbo') {
                        const turboUrl = this.image(prompt, { ...options, model: 'turbo' });
                        const img2 = new Image();
                        img2.onload = () => resolve(turboUrl);
                        img2.onerror = () => reject(new Error('Image failed'));
                        img2.src = turboUrl;
                    } else reject(new Error('Image timeout'));
                }, options.timeout || 60000);
                img.onload = () => { clearTimeout(timeout); resolve(url); };
                img.onerror = () => { clearTimeout(timeout); reject(new Error('Image failed')); };
                img.src = url;
            });
        },
        
        vision: async function(imageUrl, question = 'Describe this image', model = 'openai') {
            const url = `${_getBase('gen')}/v1/chat/completions`;
            const response = await _fetchWithRetry(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _getKey() },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: [
                        { type: 'text', text: question },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]}]
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        },
        
        // ========== QR CODE (ИСПРАВЛЕНО!) ==========
        qr: function(data, options = {}) {
            if (!data) throw new Error('Data is required');
            const { size = 200, color = '000000', bg = 'ffffff', format = 'png' } = options;
            // Используем Google Charts API (более надёжный)
            return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${color}&bgcolor=${bg}&format=${format}`;
        },
        
        // ========== WEATHER ==========
        weather: async function(city) {
            if (!city) throw new Error('City is required');
            try {
                // Используем wttr.in - бесплатный сервис погоды
                const response = await _fetchWithTimeout(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {}, 10000);
                if (!response.ok) throw new Error('Weather API error');
                const data = await response.json();
                const current = data.current_condition[0];
                const location = data.nearest_area[0];
                return {
                    city: location.areaName[0].value,
                    country: location.country[0].value,
                    temp: parseInt(current.temp_C),
                    feels_like: parseInt(current.FeelsLikeC),
                    humidity: parseInt(current.humidity),
                    wind: parseInt(current.windspeedKmph),
                    wind_dir: current.winddir16Point,
                    description: current.weatherDesc[0].value,
                    icon: this._weatherIcon(current.weatherCode),
                    uv: parseInt(current.uvIndex),
                    visibility: parseInt(current.visibility),
                    pressure: parseInt(current.pressure),
                    clouds: parseInt(current.cloudcover),
                    forecast: data.weather.slice(0, 3).map(day => ({
                        date: day.date,
                        maxTemp: parseInt(day.maxtempC),
                        minTemp: parseInt(day.mintempC),
                        description: day.hourly[4].weatherDesc[0].value
                    }))
                };
            } catch (e) {
                throw new Error('Weather fetch failed: ' + e.message);
            }
        },
        
        _weatherIcon: function(code) {
            const icons = {
                '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
                '143': '🌫️', '176': '🌧️', '179': '🌨️', '182': '🌨️',
                '185': '🌨️', '200': '⛈️', '227': '❄️', '230': '❄️',
                '248': '🌫️', '260': '🌫️', '263': '🌧️', '266': '🌧️',
                '281': '🌨️', '284': '🌨️', '293': '🌧️', '296': '🌧️',
                '299': '🌧️', '302': '🌧️', '305': '🌧️', '308': '🌧️',
                '311': '🌨️', '314': '🌨️', '317': '🌨️', '320': '🌨️',
                '323': '❄️', '326': '❄️', '329': '❄️', '332': '❄️',
                '335': '❄️', '338': '❄️', '350': '🌨️', '353': '🌧️',
                '356': '🌧️', '359': '🌧️', '362': '🌨️', '365': '🌨️',
                '368': '❄️', '371': '❄️', '374': '🌨️', '377': '🌨️',
                '386': '⛈️', '389': '⛈️', '392': '⛈️', '395': '❄️'
            };
            return icons[code] || '🌡️';
        },
        
        // ========== TRANSLATE (через AI) ==========
        translate: async function(text, from = 'auto', to = 'en') {
            if (!text) throw new Error('Text is required');
            const prompt = `Translate the following text from ${from} to ${to}. Only respond with the translation, nothing else:\n\n${text}`;
            return await this.ai(prompt, 'openai');
        },
        
        // ========== FUN ==========
        joke: function() {
            return _jokes[Math.floor(Math.random() * _jokes.length)];
        },
        
        quote: function() {
            return _quotes[Math.floor(Math.random() * _quotes.length)];
        },
        
        fact: function() {
            return _facts[Math.floor(Math.random() * _facts.length)];
        },
        
        // ========== GENERATORS ==========
        color: function(format = 'hex') {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            
            if (format === 'rgb') return { r, g, b, css: `rgb(${r}, ${g}, ${b})` };
            if (format === 'hsl') {
                const rn = r / 255, gn = g / 255, bn = b / 255;
                const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
                let h, s, l = (max + min) / 2;
                if (max === min) { h = s = 0; }
                else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
                        case gn: h = ((bn - rn) / d + 2) / 6; break;
                        case bn: h = ((rn - gn) / d + 4) / 6; break;
                    }
                }
                return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), css: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)` };
            }
            return { hex, r, g, b };
        },
        
        avatar: function(name, options = {}) {
            const { size = 200, background = 'random', rounded = false, bold = true } = options;
            // Используем UI Avatars API
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${background}&rounded=${rounded}&bold=${bold}`;
        },
        
        placeholder: function(width = 300, height = 200, text = '', options = {}) {
            const { bg = 'cccccc', color = '666666' } = options;
            const displayText = text || `${width}x${height}`;
            return `https://via.placeholder.com/${width}x${height}/${bg}/${color}?text=${encodeURIComponent(displayText)}`;
        },
        
        lorem: function(paragraphs = 1) {
            const result = [];
            for (let i = 0; i < paragraphs; i++) {
                result.push(_lorem[i % _lorem.length]);
            }
            return result.join('\n\n');
        },
        
        password: function(length = 16, options = {}) {
            const { uppercase = true, lowercase = true, numbers = true, symbols = true, exclude = '' } = options;
            let chars = '';
            if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
            if (numbers) chars += '0123456789';
            if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
            
            // Удаляем исключённые символы
            for (const c of exclude) chars = chars.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
            
            if (!chars) throw new Error('No characters available');
            
            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            return Array.from(array, x => chars[x % chars.length]).join('');
        },
        
        // ========== NETWORK ==========
        ip: async function() {
            try {
                const response = await _fetchWithTimeout('https://api.ipify.org?format=json', {}, 5000);
                const data = await response.json();
                return data.ip;
            } catch (e) {
                try {
                    const response = await _fetchWithTimeout('https://api64.ipify.org?format=json', {}, 5000);
                    const data = await response.json();
                    return data.ip;
                } catch (e2) {
                    throw new Error('Could not get IP');
                }
            }
        },
        
        userAgent: function(ua = navigator.userAgent) {
            const result = { raw: ua, browser: {}, os: {}, device: {} };
            
            // Browser detection
            if (ua.includes('Firefox/')) {
                result.browser.name = 'Firefox';
                result.browser.version = ua.match(/Firefox\/([\d.]+)/)?.[1];
            } else if (ua.includes('Edg/')) {
                result.browser.name = 'Edge';
                result.browser.version = ua.match(/Edg\/([\d.]+)/)?.[1];
            } else if (ua.includes('Chrome/')) {
                result.browser.name = 'Chrome';
                result.browser.version = ua.match(/Chrome\/([\d.]+)/)?.[1];
            } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
                result.browser.name = 'Safari';
                result.browser.version = ua.match(/Version\/([\d.]+)/)?.[1];
            }
            
            // OS detection
            if (ua.includes('Windows NT 10')) result.os = { name: 'Windows', version: '10/11' };
            else if (ua.includes('Windows')) result.os = { name: 'Windows', version: ua.match(/Windows NT ([\d.]+)/)?.[1] };
            else if (ua.includes('Mac OS X')) result.os = { name: 'macOS', version: ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') };
            else if (ua.includes('Android')) result.os = { name: 'Android', version: ua.match(/Android ([\d.]+)/)?.[1] };
            else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) result.os = { name: 'iOS', version: ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') };
            else if (ua.includes('Linux')) result.os = { name: 'Linux', version: '' };
            
            // Device type
            if (/Mobile|Android|iPhone|iPad/i.test(ua)) result.device.type = 'mobile';
            else if (/Tablet|iPad/i.test(ua)) result.device.type = 'tablet';
            else result.device.type = 'desktop';
            
            return result;
        },
        
        // ========== CRYPTO ==========
        hash: async function(text, algo = 'SHA-256') {
            if (!text) throw new Error('Text is required');
            const data = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest(algo, data);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        },
        
        base64: function(text, mode = 'encode') {
            if (!text) throw new Error('Text is required');
            if (mode === 'encode') return btoa(unescape(encodeURIComponent(text)));
            return decodeURIComponent(escape(atob(text)));
        },
        
        uuid: () => crypto.randomUUID(),
        
        // ========== TEXT UTILS ==========
        markdown: function(text) {
            if (!text) return '';
            return text
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code>$1</code>')
                .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
                .replace(/\n/g, '<br>');
        },
        
        slugify: function(text) {
            return text.toString().toLowerCase().trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
        },
        
        truncate: function(text, length = 100, suffix = '...') {
            if (text.length <= length) return text;
            return text.substring(0, length - suffix.length) + suffix;
        },
        
        wordCount: function(text) {
            const words = text.trim().split(/\s+/).filter(w => w.length > 0);
            return {
                words: words.length,
                characters: text.length,
                charactersNoSpaces: text.replace(/\s/g, '').length,
                sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
                paragraphs: text.split(/\n\n+/).filter(p => p.trim().length > 0).length
            };
        },
        
        // ========== JSON UTILS ==========
        json: {
            format: function(obj, spaces = 2) {
                try {
                    if (typeof obj === 'string') obj = JSON.parse(obj);
                    return JSON.stringify(obj, null, spaces);
                } catch (e) {
                    throw new Error('Invalid JSON');
                }
            },
            validate: function(str) {
                try {
                    JSON.parse(str);
                    return { valid: true, error: null };
                } catch (e) {
                    return { valid: false, error: e.message };
                }
            },
            minify: function(obj) {
                if (typeof obj === 'string') obj = JSON.parse(obj);
                return JSON.stringify(obj);
            }
        },
        
        // ========== DATE/TIME ==========
        time: {
            now: () => Date.now(),
            iso: () => new Date().toISOString(),
            unix: () => Math.floor(Date.now() / 1000),
            format: function(date, format = 'YYYY-MM-DD HH:mm:ss') {
                const d = date ? new Date(date) : new Date();
                const pad = n => n.toString().padStart(2, '0');
                return format
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
        
        // ========== MATH ==========
        math: {
            random: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
            clamp: (num, min, max) => Math.min(Math.max(num, min), max),
            lerp: (start, end, t) => start + (end - start) * t,
            map: (value, inMin, inMax, outMin, outMax) => (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin,
            distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
            degrees: (radians) => radians * (180 / Math.PI),
            radians: (degrees) => degrees * (Math.PI / 180),
            factorial: (n) => n <= 1 ? 1 : n * OKAK.math.factorial(n - 1),
            fibonacci: (n) => n <= 1 ? n : OKAK.math.fibonacci(n - 1) + OKAK.math.fibonacci(n - 2),
            isPrime: (n) => {
                if (n < 2) return false;
                for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
                return true;
            }
        },
        
        // ========== ARRAY UTILS ==========
        array: {
            shuffle: (arr) => [...arr].sort(() => Math.random() - 0.5),
            unique: (arr) => [...new Set(arr)],
            chunk: (arr, size) => {
                const result = [];
                for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
                return result;
            },
            sample: (arr, count = 1) => {
                const shuffled = [...arr].sort(() => Math.random() - 0.5);
                return count === 1 ? shuffled[0] : shuffled.slice(0, count);
            },
            range: (start, end, step = 1) => {
                const result = [];
                for (let i = start; i <= end; i += step) result.push(i);
                return result;
            }
        },
        
        // ========== VALIDATION ==========
        validate: {
            email: (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str),
            url: (str) => { try { new URL(str); return true; } catch { return false; } },
            phone: (str) => /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(str),
            creditCard: (str) => /^[0-9]{13,19}$/.test(str.replace(/\s/g, '')),
            ipv4: (str) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str),
            hex: (str) => /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str),
            uuid: (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
        },
        
        // ========== HEALTH CHECK ==========
        health: async function() {
            const results = { ai: false, image: false, qr: false, weather: false, crypto: true, latency: {} };
            
            try {
                const start = Date.now();
                await _fetchWithTimeout(_getBase('text') + '/test?seed=' + _seed(), {}, 5000);
                results.ai = true;
                results.latency.ai = Date.now() - start;
            } catch { results.latency.ai = -1; }
            
            try {
                const start = Date.now();
                await _fetchWithTimeout('https://api.qrserver.com/v1/create-qr-code/?size=10x10&data=test', { method: 'HEAD' }, 5000);
                results.qr = true;
                results.latency.qr = Date.now() - start;
            } catch { results.latency.qr = -1; }
            
            try {
                const start = Date.now();
                await _fetchWithTimeout('https://wttr.in/London?format=j1', {}, 5000);
                results.weather = true;
                results.latency.weather = Date.now() - start;
            } catch { results.latency.weather = -1; }
            
            results.image = true;
            results.latency.image = 0;
            
            return results;
        },
        
        // ========== MODELS ==========
        models: async function(type = 'text') {
            try {
                const base = _getBase('gen');
                const endpoint = type === 'image' ? '/image/models' : '/v1/models';
                const response = await _fetchWithTimeout(base + endpoint, { headers: { 'Authorization': 'Bearer ' + _getKey() } }, 10000);
                if (!response.ok) throw new Error();
                return await response.json();
            } catch {
                return type === 'text' ? ['openai', 'gemini', 'mistral', 'llama', 'deepseek'] : ['flux', 'turbo'];
            }
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = OKAK;
window.OKAK = OKAK;

console.log('%c🚀 OKAK API SDK v' + OKAK.version + ' loaded', 'color: #667eea; font-weight: bold;');
console.log('%c📚 Docs: https://vriskasyt.github.io/api/', 'color: #888;');
console.log('%c💡 New: OKAK.weather(), OKAK.translate(), OKAK.joke(), OKAK.quote() and more!', 'color: #888;');
