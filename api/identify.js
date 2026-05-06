/**
 * Vercel Serverless Function: Proxy para Pl@ntNet API
 * Esto soluciona los errores de CORS y oculta la API Key.
 */

export const config = {
    api: {
        bodyParser: false, // Desactivamos el parser para manejar el stream binario directamente
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Solo se permite el método POST' });
    }

    const apiKey = '2b1013KnpQM3yJeivZoMmFm9iu';
    const lang = req.query.lang || 'es';

    try {
        const response = await fetch(
            `https://my-api.plantnet.org/v2/identify/all?lang=${lang}&api-key=${apiKey}`,
            {
                method: 'POST',
                body: req, // Pasamos el request original como stream
                headers: {
                    'content-type': req.headers['content-type'], // Mantenemos el boundary original
                }
            }
        );

        const data = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*'); // Aseguramos CORS de salida
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ message: 'Error en el servidor proxy', error: error.message });
    }
}
