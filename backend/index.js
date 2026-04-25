const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Microservicio Cálculo IVA y Descuento',
      version: '1.0.0',
      description: 'API para calcular el valor final de un producto aplicando IVA y descuento.',
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Local' },
      { url: 'https://tu-app.onrender.com', description: 'Producción (Render)' },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /calcularValorFinal/:
 *   post:
 *     summary: Calcula el valor final de un producto con IVA y descuento
 *     description: |
 *       Recibe el costo base, IVA y descuento. El descuento se aplica ANTES del IVA.
 *       Fórmula: valorConDescuento = costoBase - (costoBase * descuento/100)
 *                valorFinal = valorConDescuento + (costoBase * iva/100)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valorBase
 *               - iva
 *               - descuento
 *             properties:
 *               valorBase:
 *                 type: number
 *                 example: 100000
 *               iva:
 *                 type: number
 *                 example: 19
 *               descuento:
 *                 type: number
 *                 example: 15
 *     responses:
 *       200:
 *         description: Cálculo exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoHTTP:
 *                   type: integer
 *                   example: 200
 *                 Titulo:
 *                   type: string
 *                   example: Valor Final a Pagar
 *                 valorBase:
 *                   type: number
 *                   example: 100000
 *                 iva:
 *                   type: number
 *                   example: 19
 *                 descuento:
 *                   type: number
 *                   example: 15
 *                 Valor:
 *                   type: number
 *                   example: 101150
 *       404:
 *         description: Parámetros inválidos o no se pudo realizar el cálculo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoHTTP:
 *                   type: integer
 *                   example: 404
 *                 Titulo:
 *                   type: string
 *                   example: Valor No Encontrado
 *                 Valor:
 *                   type: integer
 *                   example: 0
 */
app.post('/calcularValorFinal/', (req, res) => {
  const { valorBase, iva, descuento } = req.body;

  // Validar que existan los campos
  if (valorBase === undefined || iva === undefined || descuento === undefined) {
    return res.status(404).json({
      codigoHTTP: 404,
      Titulo: 'Valor No Encontrado',
      Valor: 0,
    });
  }

  // Convertir a número y validar que sean numéricos reales (no NaN, no Infinity, no strings con 'e')
  const base = Number(valorBase);
  const ivaNum = Number(iva);
  const desc = Number(descuento);

  if (
    isNaN(base) || isNaN(ivaNum) || isNaN(desc) ||
    !isFinite(base) || !isFinite(ivaNum) || !isFinite(desc)
  ) {
    return res.status(404).json({
      codigoHTTP: 404,
      Titulo: 'Valor No Encontrado',
      Valor: 0,
    });
  }

  // Validar que no sean negativos -> 400 Bad Request
  if (base < 0 || ivaNum < 0 || desc < 0) {
    return res.status(400).json({
      codigoHTTP: 400,
      Titulo: 'Parámetros Inválidos',
      Mensaje: 'Los valores no pueden ser negativos.',
      Valor: 0,
    });
  }

  // Fórmula: descuento primero, luego IVA sobre el precio ya descontado
  const montoDescuento = base * (desc / 100);
  const precioConDescuento = base - montoDescuento;
  const montoIva = precioConDescuento * (ivaNum / 100);
  const valorFinal = precioConDescuento + montoIva;

  return res.status(200).json({
    codigoHTTP: 200,
    Titulo: 'Valor Final a Pagar',
    valorBase: base,
    iva: ivaNum,
    descuento: desc,
    Valor: Math.round(valorFinal * 100) / 100,
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Microservicio activo', docs: '/api-docs' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Swagger docs en http://localhost:${PORT}/api-docs`);
});
