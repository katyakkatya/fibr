const contentDiv = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");
const socket = io("http://localhost:3001");

let currentNotes = [];

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}

async function loadContent(page) {
  try {
    const response = await fetch(`./content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    if (page === "home") {
      initNotes();
    }
  } catch (err) {
    contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
    console.error(err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        "BG3GENdKwNdTfYqVcjoEqNDZHlU5dhBibXRiCV9YLERvuGRJODCZwb9iGIc-Mxi9-8FNLIfovUKsuDmPlB_YKYE",
      ),
    });
    await fetch("http://localhost:3001/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    console.log("Подписка на push отправлена");
  } catch (err) {
    console.error("Ошибка подписки на push:", err);
  }
}

async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch("http://localhost:3001/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    console.log("Отписка выполнена");
  }
}

homeBtn.addEventListener("click", () => {
  setActiveButton("home-btn");
  loadContent("home");
});

aboutBtn.addEventListener("click", () => {
  setActiveButton("about-btn");
  loadContent("about");
});

loadContent("home");

// Функционал заметок с напоминаниями
function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const reminderForm = document.getElementById("reminder-form");
  const reminderText = document.getElementById("reminder-text");
  const reminderTime = document.getElementById("reminder-time");
  const list = document.getElementById("notes-list");

  // Загрузка заметок из localStorage
  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    currentNotes = notes;
    list.innerHTML = notes
      .map((note) => {
        let reminderInfo = "";
        if (note.reminder) {
          const date = new Date(note.reminder);
          reminderInfo = `<br><small style="color: #e67e22;"> Напоминание: ${date.toLocaleString()}</small>`;
        }
        return `
                <li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">
                    <strong>${escapeHtml(note.text)}</strong>
                    ${reminderInfo}
                    <button class="button small error" style="float: right; margin-top: -0.25rem;" data-id="${note.id}">Удалить</button>
                </li>
            `;
      })
      .join("");

    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll("#notes-list button[data-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(btn.dataset.id);
        deleteNote(id);
      });
    });
  }

  // Функция для экранирования HTML
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Добавление обычной заметки
  function addNote(text) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const newNote = {
      id: Date.now(),
      text: text,
      reminder: null,
    };
    notes.push(newNote);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();
    socket.emit("newTask", { text, timestamp: Date.now() });
  }

  // Добавление заметки с напоминанием
  function addReminder(text, reminderTime) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const timestamp = new Date(reminderTime).getTime();
    const newNote = {
      id: Date.now(),
      text: text,
      reminder: timestamp,
    };
    notes.push(newNote);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();

    // Отправляем на сервер для планирования push-уведомления
    socket.emit("newReminder", {
      id: newNote.id,
      text: text,
      reminderTime: timestamp,
    });
  }

  // Удаление заметки
  function deleteNote(id) {
    let notes = JSON.parse(localStorage.getItem("notes") || "[]");
    notes = notes.filter((note) => note.id !== id);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();

    // Сообщаем серверу об удалении напоминания
    socket.emit("deleteReminder", { id: id });
  }

  // Обработчики форм
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addNote(text);
      input.value = "";
    }
  });

  reminderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = reminderText.value.trim();
    const time = reminderTime.value;
    if (text && time) {
      addReminder(text, time);
      reminderText.value = "";
      reminderTime.value = "";
    }
  });

  loadNotes();
}

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered");

      const enableBtn = document.getElementById("enable-push");
      const disableBtn = document.getElementById("disable-push");

      if (enableBtn && disableBtn) {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          enableBtn.style.display = "none";
          disableBtn.style.display = "inline-block";
        }

        enableBtn.addEventListener("click", async () => {
          if (Notification.permission === "denied") {
            alert("Уведомления запрещены. Разрешите их в настройках браузера.");
            return;
          }
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              alert("Необходимо разрешить уведомления.");
              return;
            }
          }
          await subscribeToPush();
          enableBtn.style.display = "none";
          disableBtn.style.display = "inline-block";
        });

        disableBtn.addEventListener("click", async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = "none";
          enableBtn.style.display = "inline-block";
        });
      }
    } catch (err) {
      console.log("SW registration failed:", err);
    }
  });
}

socket.on("taskAdded", (task) => {
  console.log("Задача от другого клиента:", task);
  const notification = document.createElement("div");
  notification.textContent = `Новая задача: ${task.text}`;
  notification.style.cssText = `
        position: fixed; top: 10px; right: 10px;
        background: #4285f4; color: white; padding: 1rem;
        border-radius: 5px; z-index: 1000;
    `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
});
