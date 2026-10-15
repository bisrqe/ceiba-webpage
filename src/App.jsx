import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Founders from "./pages/Founders";
import Initiatives from "./pages/Initiatives";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Plataforma from "./pages/Plataforma";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/founders" element={<Founders />} />
          <Route path="/iniciativas" element={<Initiatives />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/plataforma" element={<Plataforma />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
