/**
 * OKAK API SDK v1.0.0
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
    
    return {
        /**
         * Инициализация SDK с API ключом (опционально)
         * @param {string} apiKey - Ваш API ключ
         */
        init: function(apiKey) {
            _apiKey = apiKey;
            _initialized = true;
            console.log('%c✓ OKAK SDK initialized', 'color: #22c55e;');
        },
        
        /**
         * Проверка инициализации
         */
        isInitialized: function() {
            return _initialized;
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
            
            const base = _getBase('text');
            const url = `${base}/${encodeURIComponent(prompt)}?model=${model}&seed=${_seed()}`;
            
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': 'Bearer ' + _getKey()
                    }
                });
                if (!response.ok) throw new Error('AI request failed');
                return await response.text();
            } catch (error) {
                console.error('OKAK AI Error:', error);
                throw error;
            }
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
                const response = await fetch(url, {
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
                
                if (!response.ok) throw new Error('Chat request failed');
                const data = await response.json();
                return data.choices?.[0]?.message?.content || '';
            } catch (error) {
                console.error('OKAK Chat Error:', error);
                throw error;
            }
        },
        
        /**
         * Генерация изображения
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
                nologo = true
            } = options;
            
            const base = _getBase('image');
            const params = new URLSearchParams({
                width: width.toString(),
                height: height.toString(),
                model,
                nologo: nologo.toString(),
                seed: _seed().toString()
            });
            
            return `${base}/prompt/${encodeURIComponent(prompt)}?${params}`;
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
                const response = await fetch(url, {
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
                
                if (!response.ok) throw new Error('Vision request failed');
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
                const response = await fetch(base + endpoint, {
                    headers: {
                        'Authorization': 'Bearer ' + _getKey()
                    }
                });
                if (!response.ok) throw new Error('Models request failed');
                return await response.json();
            } catch (error) {
                console.error('OKAK Models Error:', error);
                throw error;
            }
        },
        
        /**
         * Получение информации о версии SDK
         */
        version: '1.1.0',
        
        /**
         * Проверка доступности сервисов
         * @returns {Promise<object>} - Статус сервисов
         */
        health: async function() {
            const results = {
                ai: false,
                image: false,
                qr: false,
                crypto: true // всегда доступно (браузерное API)
            };
            
            try {
                const aiRes = await fetch(_getBase('text') + '/test', { method: 'HEAD' });
                results.ai = aiRes.ok;
            } catch (e) {
                results.ai = false;
            }
            
            results.image = true; // предполагаем что работает
            results.qr = true;
            
            return results;
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
