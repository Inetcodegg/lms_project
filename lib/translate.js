/**
 * LibreTranslate API wrapper for real-time AI translation.
 * 
 * Target URLs for public instances:
 * - https://libretranslate.de/translate
 * - https://translate.argosopentech.com/translate
 */

const LIBRE_TRANSLATE_URL = "https://libretranslate.de/translate";

/**
 * Translates text to a target language.
 * @param {string} q - The text to translate.
 * @param {string} target - Target language code ('en', 'uz', 'ru').
 * @param {string} source - Source language code (optional).
 * @returns {Promise<string>} - Translated text.
 */
export async function translateText(q, target, source = "auto") {
    if (!q || q.trim() === "") return q;

    try {
        const res = await fetch(LIBRE_TRANSLATE_URL, {
            method: "POST",
            body: JSON.stringify({
                q: q,
                source: source,
                target: target,
                format: "text",
                api_key: ""
            }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (data.translatedText) {
            return data.translatedText;
        }

        console.error("Translation API error:", data);
        return q; // Fallback to original text
    } catch (error) {
        console.error("Translation request failed:", error);
        return q; // Fallback to original text
    }
}

/**
 * Helper to translate a menu item or event into multiple languages at once.
 */
export async function translateAll(text, source = "auto") {
    const targets = ["en", "uz", "ru"];
    const results = {};

    await Promise.all(targets.map(async (lang) => {
        if (lang === source) {
            results[lang] = text;
        } else {
            results[lang] = await translateText(text, lang, source);
        }
    }));

    return results;
}
