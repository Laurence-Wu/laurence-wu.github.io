import { Link } from "react-router-dom";
import Search from "../utils/Search";
const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Laurence website</div>
      <Link to="/" className="homePage">
        Home
      </Link>
      <Link to="/blogList" className="blogs">
        Blogs
      </Link>
      <Link to="/profile" className="profile">
        Profiles
      </Link>
      <Link to="/projects" className="projects">
        Projects
      </Link>
      <Link to="/hobbies" className="hobbies">
        Hobbies
      </Link>
      <Link to="T-Line-visualizer"  className="T-Line-visualizer">
        T-Line-Visualizer
      </Link>
      <Search />
    </nav>
  );
};

export default Navbar;
