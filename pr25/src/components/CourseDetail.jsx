import { useParams, Link } from "react-router-dom";
import "./CourseDetail.css";

const coursesData = {
  frontend: {
    title: "Frontend-разработка",
    duration: "4 месяца",
    level: "Начальный",
    format: "Онлайн",
    description:
      "Полный курс по созданию современных веб-интерфейсов. Научишься верстать сайты, создавать интерактивные приложения и работать с React.",
    program: [
      "HTML5, CSS3, Flexbox, Grid",
      "JavaScript (ES6+)",
      "React: хуки, компоненты, роутинг",
      "State management (Redux)",
      "TypeScript основы",
      "Работа с API (fetch, axios)",
      "Сборка проектов (Vite/Webpack)",
    ],
    requirements: [
      "Базовое понимание компьютера",
      "Желание учиться каждый день",
      "Ноутбук или компьютер с выходом в интернет",
    ],
  },
  backend: {
    title: "Backend-разработка",
    duration: "4 месяца",
    level: "Начальный",
    format: "Онлайн",
    description:
      "Освой создание серверной части веб-приложений, работу с базами данных и API.",
    program: [
      "Node.js и npm",
      "Express.js фреймворк",
      "REST API проектирование",
      "Базы данных: PostgreSQL, MongoDB",
      "Аутентификация (JWT)",
      "Docker контейнеризация",
      "Деплой на сервер",
    ],
    requirements: [
      "JavaScript основы",
      "Понимание работы HTTP",
      "Базовые знания командной строки",
    ],
  },
};

function CourseDetail() {
  const { id } = useParams();
  const course = coursesData[id];

  if (!course) {
    return (
      <div className="not-found">
        <h2>Курс не найден</h2>
        <Link to="/" className="btn">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="course-detail">
      <Link to="/" className="back-link">
        Назад к курсам
      </Link>

      <div className="course-header">
        <h1>{course.title}</h1>
        <div className="course-meta">
          <span className="meta-item">Длительность: {course.duration}</span>
          <span className="meta-item">Уровень: {course.level}</span>
          <span className="meta-item">Формат: {course.format}</span>
        </div>
      </div>

      <div className="course-description">
        <h2>Описание курса</h2>
        <p>{course.description}</p>
      </div>

      <div className="course-program">
        <h2>Программа обучения</h2>
        <ul>
          {course.program.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="course-requirements">
        <h2>Требования</h2>
        <ul>
          {course.requirements.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="course-actions">
        <button className="btn-primary">Записаться на курс</button>
      </div>
    </div>
  );
}

export default CourseDetail;
