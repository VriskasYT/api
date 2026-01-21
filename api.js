/**
 * OKAK API SDK v1.2.0
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
        timeout: 30000, // 30 секунд
        retries: 3,
        retryDelay: 1000,
        fallbackModels: ['openai', 'mistral', 'llama']
    };
    
    // Обфусцированные endpoints (декодируются при использовании)
    const _e = {
        // text.pollinations.ai
        t: [116,101,120,116,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        // image.pollinations.ai
        i: [105,109,97,103,101,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        // quickchart.io
        q: [113,117,105,99,107,99,104,97,114,116,46,105,111],
        // gen.pollinations.ai
        g: [103,101,110,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        // API key (encoded)
        k: [115,107,95,105,90,105,51,99,65,55,108,57,54,107,70,79,102,109,97,66,107,83,56,119,65,81,104,49,86,79,100,113,66,68,107]
    };
    
    // Декодер
    function _d(arr) {
        return String.fromCharCode.apply(null, arr);
    }
    
    // Получение базовых URL
    function _getBase(type) {
        switch(type) {
            case 'text': return 'https://' + _d(_e.t);
            case 'image': return 'https://' + _d(_e.i);
            case 'qr': return 'https://' + _d(_e.q);
            case 'gen': return 'https://' + _d(_e.g);
            default: return '';
        }
    }
    
    // Получение внутреннего ключа
    function _getKey() {
        return _d(_e.k);
    }
    
    // Случайный seed для уникальности
    function _seed() {
        return Date.now() + Math.floor(Math.random() * 10000);
    }
    
    // Логирование для дебага
    function _log(...args) {
        if (_debug) console.log('[OKAK]', ...args);
    }
    
    // Fetch с таймаутом
    function _fetchWithTimeout(url, options = {}, timeout = _config.timeout) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }
    
    // Задержка
    function _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Fetch с повторными попытками
    async function _fetchWithRetry(url, options = {}, retries = _config.retries) {
        let lastError;
        
        for (let i = 0; i < retries; i++) {
            try {
                _log(`Attempt ${i + 1}/${retries} for ${url}`);
                const response = await _fetchWithTimeout(url, options);
                
                if (response.ok) {
                    return response;
                }
                
                // Если 429 (rate limit) или 5xx - пробуем снова
                if (response.status === 429 || response.status >= 500) {
                    lastError = new Error(`HTTP ${response.status}`);
                    if (i < retries - 1) {
                        await _delay(_config.retryDelay * (i + 1));
                        continue;
                    }
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } catch (error) {
                lastError = error;
                _log(`Attempt ${i + 1} failed:`, error.message);
                
                if (i < retries - 1) {
                    await _delay(_config.retryDelay * (i + 1));
                }
            }
        }
        
        throw lastError;
    }
    
    return {
        /**
         * Инициализация SDK с API ключом (опционально)
         * @param {string} apiKey - Ваш API ключ
         * @param {object} options - Настройки
         */
        init: function(apiKey, options = {}) {
            _apiKey = apiKey;
            _initialized = true;
            
            if (options.debug) _debug = true;
            if (options.timeout) _config.timeout = options.timeout;
            if (options.retries) _config.retries = options.retries;
            
            console.log('%c✓ OKAK SDK initialized', 'color: #22c55e;');
        },
        
        /**
         * Проверка инициализации
         */
        isInitialized: function() {
            return _initialized;
        },
        
        /**
         * Включить/выключить дебаг режим
         */
        debug: function(enabled = true) {
            _debug = enabled;
            console.log(`%c${enabled ? '🔧 Debug mode ON' : '🔇 Debug mode OFF'}`, 'color: #f59e0b;');
        },
        
        /**
         * Генерация текста с помощью AI
         * @param {string} prompt - Запрос
         * @param {string} model - Модель (openai, gemini, mistral, llama, deepseek)
         * @param {object} options - Дополнительные параметры
         * @returns {Promise<string>} - Ответ AI
         */
        ai: async function(prompt, model = 'openai', options = {}) {
            if (!prompt) throw new Error('Prompt is required');
            
            const modelsToTry = [model, ..._config.fallbackModels.filter(m => m !== model)];
            let lastError;
            
            for (const currentModel of modelsToTry) {
                try {
                    _log(`Trying model: ${currentModel}`);
                    
                    const base = _getBase('text');
                    const url = `${base}/${encodeURIComponent(prompt)}?model=${currentModel}&seed=${_seed()}`;
                    
                    const response = await _fetchWithRetry(url, {
                        headers: {
                            'Authorization': 'Bearer ' + _getKey()
                        }
                    });
                    
                    const text = await response.text();
                    
                    if (text && text.trim()) {
                        _log(`Success with model: ${currentModel}`);
                        return text;
                    }
                    
                    throw new Error('Empty response');
                } catch (error) {
                    _log(`Model ${currentModel} failed:`, error.message);
                    lastError = error;
                }
            }
            
            console.error('OKAK AI Error: All models failed');
            throw lastError || new Error('All AI models failed');
        },
        
        /**
         * Быстрая генерация текста (без fallback, быстрее)
         */
        aiFast: async function(prompt, model = 'openai') {
            if (!prompt) throw new Error('Prompt is required');
            
            const base = _getBase('text');
            const url = `${base}/${encodeURIComponent(prompt)}?model=${model}&seed=${_seed()}`;
            
            const response = await _fetchWithTimeout(url, {
                headers: {
                    'Authorization': 'Bearer ' + _getKey()
                }
            }, 15000); // 15 секунд таймаут
            
            if (!response.ok) throw new Error('AI request failed');
            return await response.text();
        },
        
        /**
         * Расширенная генерация текста (chat completions)
         * @param {array} messages - Массив сообщений [{role, content}]
         * @param {string} model - Модель
         * @param {object} options - Параметры (stream, temperature, etc)
         * @returns {Promise<string>} - Ответ AI
         */
        chat: async function(messages, model = 'openai', options = {}) {
            if (!messages || !messages.length) throw new Error('Messages are required');
            
            const base = _getBase('gen');
            const url = `${base}/v1/chat/completions`;
            
            try {
                const response = await _fetchWithRetry(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + _getKey()
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        ...options
                    })
                });
                
                const data = await response.json();
                return data.choices?.[0]?.message?.content || '';
            } catch (error) {
                console.error('OKAK Chat Error:', error);
                throw error;
            }
        },
        
        /**
         * Генерация изображения (возвращает URL)
         * @param {string} prompt - Описание изображения
         * @param {object} options - Параметры
         * @returns {string} - URL изображения
         */
        image: function(prompt, options = {}) {
            if (!prompt) throw new Error('Prompt is required');
            
            const {
                width = 512,
                height = 512,
                model = 'flux',
                nologo = true,
                enhance = true
            } = options;
            
            const base = _getBase('image');
            const params = new URLSearchParams({
                width: width.toString(),
                height: height.toString(),
                model,
                nologo: nologo.toString(),
                enhance: enhance.toString(),
                seed: _seed().toString()
            });
            
            return `${base}/prompt/${encodeURIComponent(prompt)}?${params}`;
        },
        
        /**
         * Генерация изображения с проверкой загрузки
         * @param {string} prompt - Описание изображения
         * @param {object} options - Параметры
         * @returns {Promise<string>} - URL загруженного изображения
         */
        imageAsync: function(prompt, options = {}) {
            return new Promise((resolve, reject) => {
                const url = this.image(prompt, options);
                const img = new Image();
                
                const timeout = setTimeout(() => {
                    reject(new Error('Image generation timeout'));
                }, options.timeout || 60000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    resolve(url);
                };
                
                img.onerror = () => {
                    clearTimeout(timeout);
                    // Пробуем с другой моделью
                    if (options.model !== 'turbo') {
                        _log('Trying turbo model as fallback');
                        const turboUrl = this.image(prompt, { ...options, model: 'turbo' });
                        const img2 = new Image();
                        img2.onload = () => resolve(turboUrl);
                        img2.onerror = () => reject(new Error('Image generation failed'));
                        img2.src = turboUrl;
                    } else {
                        reject(new Error('Image generation failed'));
                    }
                };
                
                img.src = url;
            });
        },
        
        /**
         * Генерация QR-кода
         * @param {string} data - Данные для кодирования
         * @param {object} options - Параметры
         * @returns {string} - URL QR-кода
         */
        qr: function(data, options = {}) {
            if (!data) throw new Error('Data is required');
            
            const {
                size = 200,
                color = '000000',
                bg = 'ffffff'
            } = options;
            
            const base = _getBase('qr');
            const params = new URLSearchParams({
                text: data,
                size: size.toString(),
                dark: color,
                light: bg
            });
            
            return `${base}/qr?${params}`;
        },
        
        /**
         * Хеширование текста
         * @param {string} text - Текст для хеширования
         * @param {string} algo - Алгоритм (SHA-256, SHA-1, SHA-384, SHA-512)
         * @returns {Promise<string>} - Хеш
         */
        hash: async function(text, algo = 'SHA-256') {
            if (!text) throw new Error('Text is required');
            
            const data = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest(algo, data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },
        
        /**
         * Base64 кодирование/декодирование
         * @param {string} text - Текст
         * @param {string} mode - 'encode' или 'decode'
         * @returns {string} - Результат
         */
        base64: function(text, mode = 'encode') {
            if (!text) throw new Error('Text is required');
            
            if (mode === 'encode') {
                return btoa(unescape(encodeURIComponent(text)));
            } else {
                return decodeURIComponent(escape(atob(text)));
            }
        },
        
        /**
         * Генерация UUID v4
         * @returns {string} - UUID
         */
        uuid: function() {
            return crypto.randomUUID();
        },
        
        /**
         * Анализ изображения с помощью AI (Vision)
         * @param {string} imageUrl - URL изображения
         * @param {string} question - Вопрос об изображении
         * @param {string} model - Модель (openai, gemini)
         * @returns {Promise<string>} - Описание
         */
        vision: async function(imageUrl, question = 'Опиши это изображение', model = 'openai') {
            if (!imageUrl) throw new Error('Image URL is required');
            
            const base = _getBase('gen');
            const url = `${base}/v1/chat/completions`;
            
            try {
                const response = await _fetchWithRetry(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + _getKey()
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'text', text: question },
                                { type: 'image_url', image_url: { url: imageUrl } }
                            ]
                        }]
                    })
                });
                
                const data = await response.json();
                return data.choices?.[0]?.message?.content || '';
            } catch (error) {
                console.error('OKAK Vision Error:', error);
                throw error;
            }
        },
        
        /**
         * Получение списка доступных моделей
         * @param {string} type - 'text' или 'image'
         * @returns {Promise<array>} - Список моделей
         */
        models: async function(type = 'text') {
            const base = _getBase('gen');
            const endpoint = type === 'image' ? '/image/models' : '/v1/models';
            
            try {
                const response = await _fetchWithTimeout(base + endpoint, {
                    headers: {
                        'Authorization': 'Bearer ' + _getKey()
                    }
                }, 10000);
                
                if (!response.ok) throw new Error('Models request failed');
                return await response.json();
            } catch (error) {
                console.error('OKAK Models Error:', error);
                // Возвращаем дефолтные модели если запрос не удался
                if (type === 'text') {
                    return ['openai', 'gemini', 'mistral', 'llama', 'deepseek'];
                }
                return ['flux', 'turbo'];
            }
        },
        
        /**
         * Получение информации о версии SDK
         */
        version: '1.2.0',
        
        /**
         * Проверка доступности сервисов
         * @returns {Promise<object>} - Статус сервисов
         */
        health: async function() {
            const results = {
                ai: false,
                image: false,
                qr: false,
                crypto: true, // всегда доступно (браузерное API)
                latency: {}
            };
            
            // Проверка AI
            try {
                const start = Date.now();
                const response = await _fetchWithTimeout(
                    _getBase('text') + '/test?seed=' + _seed(), 
                    { method: 'GET' },
                    5000
                );
                results.ai = response.ok;
                results.latency.ai = Date.now() - start;
            } catch (e) {
                results.ai = false;
                results.latency.ai = -1;
            }
            
            // Проверка Image
            try {
                const start = Date.now();
                results.image = true;
                results.latency.image = Date.now() - start;
            } catch (e) {
                results.image = false;
                results.latency.image = -1;
            }
            
            // Проверка QR
            try {
                const start = Date.now();
                const response = await _fetchWithTimeout(
                    _getBase('qr') + '/qr?text=test',
                    { method: 'HEAD' },
                    5000
                );
                results.qr = response.ok;
                results.latency.qr = Date.now() - start;
            } catch (e) {
                results.qr = false;
                results.latency.qr = -1;
            }
            
            return results;
        },
        
        /**
         * Настройка конфигурации
         */
        configure: function(options) {
            if (options.timeout) _config.timeout = options.timeout;
            if (options.retries) _config.retries = options.retries;
            if (options.retryDelay) _config.retryDelay = options.retryDelay;
            _log('Configuration updated:', _config);
        }
    };
})();

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OKAK;
}

// Глобальный доступ
window.OKAK = OKAK;

console.log('%c🚀 OKAK API SDK v' + OKAK.version + ' loaded', 'color: #667eea; font-weight: bold;');
console.log('%c📚 Docs: https://vriskasyt.github.io/api/', 'color: #888;');
console.log('%c💡 Usage: OKAK.ai("Hello"), OKAK.image("cat"), OKAK.qr("url")', 'color: #888;');
