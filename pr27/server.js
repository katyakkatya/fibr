import amqplib from "amqplib";
import express from "express";

const app = express();
const port = 3000;
const MAX_RETRIES = 3;

app.use(express.json());

async function sendMessage(queueName, data) {
  const connection = await amqplib.connect("amqp://localhost");
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });

  const message = JSON.stringify(data);

  channel.sendToQueue(queueName, Buffer.from(message), {
    persistent: true,
    headers: { "x-retry-count": 0 },
  });

  console.log(`[Producer] Отправлено: ${message}`);

  setTimeout(() => connection.close(), 500);
}

app.post("/tasks", async (req, res) => {
  try {
    const { taskType, taskData } = req.body;

    if (!taskType || !taskData)
      return res.status(400).json({ error: "Missing taskType or taskData" });

    await sendMessage("work_queue", { type: taskType, payload: taskData });
    res.status(202).json({ status: "accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
