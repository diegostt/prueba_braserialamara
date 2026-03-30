const { Client } = require('@notionhq/client');

// Vercel Serverless Function
module.exports = async function(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const databaseId = process.env.NOTION_DATABASE_ID;

    const { nombre, fechaIso, hora, personas, tipo, pedido, total } = req.body;
    const tipoFormateado = tipo === 'aqui' ? 'Comer Aquí' : 'Para Llevar';

    // Enviar a Notion
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "Nombre completo": {
          title: [
            { text: { content: nombre || 'Sin nombre' } }
          ]
        },
        "Fecha": {
          date: {
            start: fechaIso 
          }
        },
        "Número de personas": {
          number: parseInt(personas) || 1
        },
        "Comer Aquí / Para Llevar": {
          select: {
            name: tipoFormateado
          }
        },
        "Pedido": {
          rich_text: [
            { text: { content: pedido || 'Sin pedido' } }
          ]
        },
        "Total": {
          rich_text: [
            { text: { content: total || '0,00 €' } }
          ]
        }
      }
    });

    return res.status(200).json({ success: true, message: 'Reserva guardada', data: response });
  } catch (error) {
    console.error("Error Notion API:", error.body || error);
    return res.status(500).json({ success: false, error: 'Ocurrió un error al procesar la reserva' });
  }
}
