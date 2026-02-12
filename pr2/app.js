const express = require('express');
const app = express();
const port = 3000;
let items = [
    {id: 1, name: 'Бананы', cost: 160},
    {id: 2, name: 'Апельсины', cost: 200},
    {id: 3, name: 'Ананасы', cost: 400},
]
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Главная страница');
});
app.post('/items', (req, res) => {
    const { name, cost } = req.body;
    const newItem = {
        id: Date.now(),
        name,
        cost
    };
    items.push(newItem);
    res.status(201).json(newItem);
});
app.get('/items', (req, res) => {
    res.send(JSON.stringify(items));
});
app.get('/items/:id', (req, res) => {
    let item = items.find(u => u.id == req.params.id);
    res.send(JSON.stringify(item));
});
app.patch('/items/:id', (req, res) => {
    const item = items.find(u => u.id == req.params.id);
    const { name, cost } = req.body;
    if (name !== undefined) item.name = name;
    if (cost !== undefined) item.cost = cost;
    res.json(item);
});
app.delete('/items/:id', (req, res) => {
    items = items.filter(u => u.id != req.params.id);
    res.send('Ok');
});
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});