import "./styles/App.css";
import Navbar from "./components/Navbar";
import Home from "./components/basicInformation/Home";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Profile from "./components/basicInformation/Profile";
import Projects from "./components/basicInformation/Projects";
import Hobbies from "./components/basicInformation/Hobbies";
import About from "./components/additionalInformation/About";
import AdditionalInformationBar from "./components/additionalInformation/AdditionalInformationBar";
import Contact from "./components/additionalInformation/Contact";
import StoryBehindTheWebsite from "./components/additionalInformation/StoryBehindTheWebsite";
import TransmissionLineSimulator from "./utils/transmissionTheory";
import SmithChartTransmissionLine from "./utils/SmithChartTransmissionLine";
import BlogList from "./Blogs/BlogList";
import BlogPost from "./Blogs/BlogPost";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/blogList" element={<BlogList />} />
            <Route path="/blog/:postId" element={<BlogPost />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/hobbies" element={<Hobbies />} />
            <Route path="/T-Line-visualizer" element={<TransmissionLineSimulator />} />
          </Routes>
        </div>

        <div className="additional-information">
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/storybehindthewebsite"
              element={<StoryBehindTheWebsite />}
            />
          </Routes>
        </div>
        <AdditionalInformationBar />
        

      </div>
    </Router>
  );
}

export default App;
