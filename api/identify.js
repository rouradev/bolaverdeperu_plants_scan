/**
 * Vercel Serverless Function: Proxy para Pl@ntNet API
 */

export const config = {
    api: {
        bodyParser: false, // Manejamos el stream manualmente
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Solo se permite POST' });
    }

    const apiKey = '2b1013KnpQM3yJeivZoMmFm9iu';
    const lang = req.query.lang || 'es';

    try {
        // Leer el stream del request y convertirlo en un Buffer
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const bodyBuffer = Buffer.concat(chunks);

        const response = await fetch(
            `https://my-api.plantnet.org/v2/identify/all?lang=${lang}&api-key=${apiKey}`,
            {
                method: 'POST',
                body: bodyBuffer,
                headers: {
                    'Content-Type': req.headers['content-type'],
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Pl@ntNet API Error:', errorText);
            return res.status(response.status).json({ message: 'Error de Pl@ntNet', error: errorText });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Internal Error:', error);
        return res.status(500).json({ message: 'Error interno del proxy', error: error.message });
    }
}
