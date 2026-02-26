const express = require('express');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

const cors = require("cors");
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

let products = [
    {id: nanoid(6), name: 'Бананы', category: 'фрукты', description: 'Бананы Египетские', count: 100, cost: 160},
    {id: nanoid(6), name: 'Апельсины', category: 'фрукты', description: 'Апельсины Абхазские', count: 100, cost: 180},
    {id: nanoid(6), name: 'Помидоры', category: 'овощи', description: 'Помидоры сливовидные отечественные', count: 100, cost: 200},
];

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API управления продуктами',
            version: '1.0.0',
            description: 'Простое API для управления продуктами',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - count
 *         - cost
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID продукта
 *         name:
 *           type: string
 *           description: Название продукта
 *         category:
 *           type: string
 *           description: Категория продукта
 *         description:
 *           type: string
 *           description: Описание продукта
 *         count:
 *           type: integer
 *           description: Количество на складе
 *         cost:
 *           type: integer
 *           description: Стоимость продукта
 *       example:
 *         id: "abc123"
 *         name: "Бананы"
 *         category: "Фрукты"
 *         description: "Бананы египетские"
 *         count: 100
 *         cost: 160
 */

// Функция-помощник для получения продукта из списка
function findProductOr404(id, res) {
    const product = products.find(u => u.id === id);
    if (!product) {
        res.status(404).json({ error: "product not found" });
        return null;
    }
    return product;
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый продукт
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - count
 *               - cost
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               count:
 *                 type: integer
 *               cost:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Продукт успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в теле запроса
 */
app.post("/api/products", (req, res) => {
    const { name, category, description, count, cost } = req.body;
    const newproduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        count: Number(count),
        cost: Number(cost),
    };
    products.push(newproduct);
    res.status(201).json(newproduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех продуктов
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список продуктов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает продукт по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID продукта
 *     responses:
 *       200:
 *         description: Данные продукта
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Продукт не найден
 */
app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные продукта
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID продукта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               count:
 *                 type: integer
 *               cost:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Обновленный продукт
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Продукт не найден
 */
app.patch("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;

    // Нельзя PATCH без полей
    if (req.body && Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: "Nothing to update",
        });
    }

    const { name, category, description, count, cost } = req.body;
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (count !== undefined) product.count = Number(count);
    if (cost !== undefined) product.cost = Number(cost);
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет продукт
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID продукта
 *     responses:
 *       204:
 *         description: Продукт успешно удален (нет тела ответа)
 *       404:
 *         description: Продукт не найден
 */
app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "product not found" });
    products = products.filter((u) => u.id !== id);
    res.status(204).send();
});

// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен на http://localhost:${port}/api-docs`);
});