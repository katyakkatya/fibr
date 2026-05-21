import { Link } from "react-router-dom";
import "./CourseCard.css";

function CourseCard({ id, title, description, icon, technologies }) {
  return (
    <div className="course-card">
      <div className="course-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="technologies">
        {technologies.map((tech, index) => (
          <span key={index} className="tech-tag">
            {tech}
          </span>
        ))}
      </div>
      <Link to={`/course/${id}`} className="btn">
        Подробнее
      </Link>
    </div>
  );
}

export default CourseCard;
