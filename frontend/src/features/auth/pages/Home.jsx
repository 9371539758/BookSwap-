import bgImage from "../assets/homebg.jpg";
import "../shared/global.scss"
const Home = () => {
  return (
    <div
      className="home"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <h1>Home Page</h1>
    </div>
  );
};

export default Home;