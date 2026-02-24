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

// Middleware для парсинга JSON
app.use(express.json());
// Middleware для логирования запросов
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}]
        ${res.statusCode} ${req.path}`);
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
]
// Функция-помощник для получения пользователя из списка
function findproductOr404(id, res) {
    const product = products.find(u => u.id == id);
    if (!product) {
        res.status(404).json({ error: "product not found" });
        return null;
    }
    return product;
}
// Функция-помощник
// POST /api/products
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
// GET /api/products
app.get("/api/products", (req, res) => {
    res.json(products);
});
// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findproductOr404(id, res);
    if (!product) return;
    res.json(product);
});
// PATCH /api/products/:id
app.patch("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findproductOr404(id, res);
    if (!product) return;
// Нельзя PATCH без полей
    if (req.body?.name === undefined && req.body?.cost === undefined) {
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
// DELETE /api/products/:id
app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some((u) => u.id === id);
    if (!exists) return res.status(404).json({ error: "product not found" });
    products = products.filter((u) => u.id !== id);
// Правильнее 204 без тела
    res.status(204).send();
});
// 404 для всех остальных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});
// Глобальный обработчик ошибок (чтобы сервер не падал)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});