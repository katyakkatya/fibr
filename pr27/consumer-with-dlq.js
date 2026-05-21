import amqplib from "amqplib";

const RETRY_LIMIT = 3;
const WORKER_ID = process.env.WORKER_ID || "default";

// функция, которая имитирует обработку задачи
async function handleTask(data) {
  console.log(`[Handler] Processing:`, data);

  // симуляция ошибки для теста retry
  if (Math.random() < 0.5) {
    throw new Error("Service temporarily unavailable");
  }
}

// главная функция - запуск воркера
async function runWorker() {
  const connection = await amqplib.connect("amqp://localhost");
  const channel = await connection.createChannel();

  await channel.assertQueue("main_queue", { durable: true });
  await channel.assertQueue("dead_queue", { durable: true });

  await channel.assertExchange("dead_exchange", "direct", { durable: true });
  await channel.bindQueue("dead_queue", "dead_exchange", "dead_key");

  // пересоздаём основную очередь, но теперь с настройками для DLQ
  await channel.assertQueue("main_queue", {
    durable: true,
    deadLetterExchange: "dead_exchange",
    deadLetterRoutingKey: "dead_key",
  });

  channel.prefetch(1);

  channel.consume("main_queue", async (msg) => {
    if (!msg) return;

    const taskData = JSON.parse(msg.content.toString());
    const attemptCount = msg.properties.headers?.["x-retry-count"] || 0;

    console.log(
      `[${WORKER_ID}] Attempt ${attemptCount + 1}/${RETRY_LIMIT}:`,
      taskData,
    );

    try {
      await handleTask(taskData);
      channel.ack(msg);
      console.log(`[${WORKER_ID}] Success`);
    } catch (err) {
      console.error(`[${WORKER_ID}] Error: ${err.message}`);

      if (attemptCount < RETRY_LIMIT) {
        channel.nack(msg, false, false);

        const waitMs = 1000 * Math.pow(2, attemptCount);
        console.log(`[${WORKER_ID}] Retry in ${waitMs}ms`);

        await new Promise((resolve) => setTimeout(resolve, waitMs));

        channel.sendToQueue("main_queue", msg.content, {
          persistent: true,
          headers: { "x-retry-count": attemptCount + 1 },
        });
      } else {
        console.log(`[${WORKER_ID}] Moving to DLQ`);
        channel.nack(msg, false, false);
      }
    }
  });

  console.log(`[${WORKER_ID}] Waiting for messages...`);
}

runWorker().catch(console.error);
