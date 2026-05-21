import { Suspense, lazy } from "react";
import { Routes, Route, Link } from "react-router-dom";
import CourseCard from "./components/CourseCard";
import CourseDetail from "./components/CourseDetail";
import "./App.css";

const courses = [
  {
    id: "frontend",
    title: "Frontend",
    description: "Создание современных веб-интерфейсов",
    technologies: ["React", "HTML", "CSS", "JS"],
  },
  {
    id: "backend",
    title: "Backend",
    description: "Серверная разработка и базы данных",
    technologies: ["Node.js", "Express", "PostgreSQL"],
  },
];

const Home = () => {
  return (
    <div className="home">
      <h1 className="title">IT Курсы</h1>
      <p className="subtitle">Научись программировать с нуля</p>
      <div className="courses">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            description={course.description}
            technologies={course.technologies}
          />
        ))}
      </div>
    </div>
  );
};

const About = lazy(() => import("./components/About"));

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="nav-link">
          Главная
        </Link>
        <Link to="/about" className="nav-link">
          О нас
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route
          path="/about"
          element={
            <Suspense fallback={<div className="loading">Загрузка...</div>}>
              <About />
            </Suspense>
          }
        />
      </Routes>

      <footer className="footer">
        <p>2026 IT Курсы.</p>
      </footer>
    </div>
  );
}

export default App;
