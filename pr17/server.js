const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const vapidKeys = {
  publicKey:
    "BG3GENdKwNdTfYqVcjoEqNDZHlU5dhBibXRiCV9YLERvuGRJODCZwb9iGIc-Mxi9-8FNLIfovUKsuDmPlB_YKYE",
  privateKey: "rUrT8TJPHDOvgGHD_Q8jzKnxEeNZaHyINrzZZk9UZRI",
};

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "./")));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

let subscriptions = [];
const reminders = new Map();

async function sendPushNotification(
  subscription,
  title,
  body,
  reminderId = null,
) {
  const payload = JSON.stringify({ title, body, reminderId });
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      const index = subscriptions.findIndex(
        (sub) => sub.endpoint === subscription.endpoint,
      );
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    }
    return false;
  }
}

async function notifyAllSubscribers(title, body, reminderId = null) {
  const promises = subscriptions.map((sub) =>
    sendPushNotification(sub, title, body, reminderId),
  );
  await Promise.all(promises);
}

function scheduleReminder(id, text, delay) {
  if (delay <= 0) return null;

  const timeoutId = setTimeout(async () => {
    await notifyAllSubscribers("!!! Напоминание", text, id);

    if (reminders.has(id)) {
      const reminder = reminders.get(id);
      reminder.notificationSent = true;
      reminders.set(id, reminder);
    }
  }, delay);

  return timeoutId;
}

io.on("connection", (socket) => {
  socket.on("newTask", (task) => {
    io.emit("taskAdded", task);
    notifyAllSubscribers("Новая задача", task.text);
  });

  socket.on("newReminder", (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();

    if (delay <= 0) return;

    if (reminders.has(id)) {
      clearTimeout(reminders.get(id).timeoutId);
    }

    const timeoutId = scheduleReminder(id, text, delay);

    reminders.set(id, {
      timeoutId,
      text,
      reminderTime,
      notificationSent: false,
    });
  });

  socket.on("deleteReminder", ({ id }) => {
    if (reminders.has(id)) {
      clearTimeout(reminders.get(id).timeoutId);
      reminders.delete(id);
    }
  });

  socket.on("disconnect", () => {});
});

app.post("/snooze", (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(400).json({ error: "Reminder not found" });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const snoozeDelay = 5 * 60 * 1000;

  const newTimeoutId = setTimeout(async () => {
    await notifyAllSubscribers(
      "Напоминание отложено",
      reminder.text,
      reminderId,
    );
    reminders.delete(reminderId);
  }, snoozeDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + snoozeDelay,
    notificationSent: false,
  });

  res.status(200).json({ message: "Reminder snoozed for 5 minutes" });
});

app.post("/dismiss", (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (reminderId && reminders.has(reminderId)) {
    clearTimeout(reminders.get(reminderId).timeoutId);
    reminders.delete(reminderId);
  }

  res.status(200).json({ message: "Reminder dismissed" });
});

app.get("/reminders", (req, res) => {
  const activeReminders = Array.from(reminders.entries()).map(([id, data]) => ({
    id,
    text: data.text,
    reminderTime: data.reminderTime,
    timeLeft: data.reminderTime - Date.now(),
    notificationSent: data.notificationSent,
  }));
  res.json({
    activeReminders,
    totalSubscriptions: subscriptions.length,
  });
});

app.post("/subscribe", (req, res) => {
  const subscription = req.body;
  const exists = subscriptions.some(
    (sub) => sub.endpoint === subscription.endpoint,
  );
  if (!exists) {
    subscriptions.push(subscription);
  }
  res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  res.status(200).json({ message: "Подписка удалена" });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
