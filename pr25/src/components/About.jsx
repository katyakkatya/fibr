import "./About.css";

function About() {
  return (
    <div className="about">
      <h1 className="about-title">О нас</h1>
      <p className="about-text">
        Мы - команда опытных разработчиков, которые обучают программированию с
        2020 года. Наши студенты работают в ведущих IT-компаниях.
      </p>
      <div className="stats">
        <div className="stat-item">
          <h2>500+</h2>
          <p>студентов</p>
        </div>
        <div className="stat-item">
          <h2>95%</h2>
          <p>трудоустройство</p>
        </div>
        <div className="stat-item">
          <h2>50+</h2>
          <p>проектов</p>
        </div>
      </div>
    </div>
  );
}

export default About;
