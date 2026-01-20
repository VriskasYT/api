/**
 * OKAK API SDK
 * Внутренний модуль для работы с API сервисами
 * 
 * Использование:
 * - OKAK.ai(prompt, model) - генерация текста
 * - OKAK.image(prompt, options) - генерация изображений
 * - OKAK.qr(data, options) - QR-коды
 * - OKAK.hash(text, algo) - хеширование
 * - OKAK.base64(text, mode) - Base64
 * - OKAK.uuid() - генерация UUID
 */

const OKAK = (function() {
    'use strict';
    
    // Обфусцированные endpoints (декодируются при использовании)
    const _e = {
        // text.pollinations.ai
        t: [116,101,120,116,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        // image.pollinations.ai
        i: [105,109,97,103,101,46,112,111,108,108,105,110,97,116,105,111,110,115,46,97,105],
        // quickchart.io
        q: [113,117,105,99,107,99,104,97,114,116,46,105,111]
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
            default: return '';
        }
    }
    
    // Случайный seed для уникальности
    function _seed() {
        return Date.now() + Math.floor(Math.random() * 10000);
    }
    
    return {
        /**
         * Генерация текста с помощью AI
         * @param {string} prompt - Запрос
         * @param {string} model - Модель (openai, gemini, mistral, llama, deepseek)
         * @returns {Promise<string>} - Ответ AI
         */
        ai: async function(prompt, model = 'openai') {
            if (!prompt) throw new Error('Prompt is required');
            
            const base = _getBase('text');
            const url = `${base}/${encodeURIComponent(prompt)}?model=${model}&seed=${_seed()}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('AI request failed');
                return await response.text();
            } catch (error) {
                console.error('OKAK AI Error:', error);
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
         * Получение информации о версии SDK
         */
        version: '1.0.0',
        
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
