import React from "react";
import { Link, useNavigate } from "react-router-dom";

// assets (make sure paths exist)
import Onlinelearn from "../assets/onlinelearn.jpg";
import Smartleaern from "../assets/smartlearn.jpg";
import test1 from "../assets/test1.jpg";
import test2 from "../assets/test2.jpg";
import test3 from "../assets/test3.jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <main className="flex-grow pt-24">
        <Hero />
        <FeatureSection />
        <TestimonialSection />
      </main>
      <Footer />
    </div>
  );
}

/* ----------------- Navbar ----------------- */
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 w-full z-50 shadow-lg bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-700 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* logo */}
        <Link to="/" className="text-2xl sm:text-3xl font-bold text-white inline-flex items-center gap-3">
          <span className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-xl font-extrabold">SL</span>
          <span className="text-indigo-100">Smart_Learn</span>
        </Link>

        {/* nav links */}
        <ul className="hidden md:flex gap-8 items-center">
          <li><a href="#" className="hover:text-indigo-300 transition">Home</a></li>
          <li><a href="#about" className="hover:text-indigo-300 transition">About</a></li>
          <li><a href="#features" className="hover:text-indigo-300 transition">Feature</a></li>
          <li><a href="#contact" className="hover:text-indigo-300 transition">Contact</a></li>
          <li>
            <button
              onClick={() => navigate("/login")}
              className="rounded-full px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold shadow-md hover:opacity-95 transition"
            >
              Login
            </button>
          </li>
        </ul>

        {/* mobile: simple login button */}
        <div className="md:hidden">
          <button onClick={() => navigate("/login")} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ----------------- Hero ----------------- */
function Hero() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-extrabold mb-4 text-gray-900">Learn Smarter, Anywhere</h1>
          <p className="text-gray-600 mb-6">
            Join thousands of learners — flexible online classes, expert instructors, and practical projects to help you grow your skills.
          </p>
          <div className="flex gap-4">
            <Link
              to="/course1"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-3 rounded-md text-white font-semibold shadow-lg hover:opacity-95 transition"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end">
          <img src={Onlinelearn} alt="Learning" className="w-full max-w-lg rounded-lg shadow-xl object-cover" />
        </div>
      </div>
    </section>
  );
}

/* ----------------- FeatureSection ----------------- */
function FeatureSection() {
  const stats = [
    { icon: "fa-user", num: 100, label: "Our Staffs" },
    { icon: "fa-users", num: 200, label: "Our Clients" },
  ];

  return (
    <section className="py-16 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
        <img src={Smartleaern} alt="Business Man" className="w-full rounded-lg shadow-sm object-cover" />
        <div>
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Learn With Us</h2>
          <p className="text-gray-600 mb-6">
            Online education is learning that happens over the internet using devices like computers and tablets, instead of in a physical classroom. Students can take classes, watch videos, and interact with teachers and classmates from anywhere, at any time.
          </p>

          <div className="grid grid-cols-2 gap-6 text-center">
            {stats.map(({ icon, num, label }) => (
              <div key={label} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <i className={`fa ${icon} text-indigo-600 text-3xl mb-2`} />
                <h3 className="text-2xl font-bold">{num}</h3>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------- TestimonialSection ----------------- */
function TestimonialSection() {
  const testimonials = [
    { img: test1, text: "Features like live classes, assignment tracking, performance dashboards, and frequently highlighted as beneficial..", name: "Jomon", role: "Bsc.computerscience" },
    { img: test2, text: "Good teaching and improve my skills", name: "Aryan", role: "MSc" },
    { img: test3, text: "Easy to learn anyone from anywhere.", name: "Client Name", role: "Btech" },
  ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="text-indigo-600 uppercase font-semibold">Testimonial Carousel</p>
        <h2 className="text-4xl font-bold mb-10">100% Positive Customer Reviews</h2>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div key={`${t.name}-${idx}`} className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
              <img src={t.img} alt={t.name} className="w-20 h-20 mx-auto rounded-full mb-4 object-cover" />
              <p className="text-gray-600 mb-4">{t.text}</p>
              <h3 className="font-bold text-gray-900">{t.name}</h3>
              <p className="text-sm text-gray-500">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------- Footer ----------------- */
function Footer() {
  return (
    <footer id="contact" className="bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-700 text-gray-100 py-10 mt-8">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-indigo-200">Our Head Office</h2>
          <p><i className="fa fa-map-marker-alt mr-2" />123 Street, Kerala, India</p>
          <p><i className="fa fa-phone-alt mr-2" />+012 345 67890</p>
          <p><i className="fa fa-envelope mr-2" />anjupavithranm95@gmail.com</p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-indigo-200">Quick Links</h2>
          <ul className="space-y-2">
            {["Terms of Use", "Privacy Policy", "Cookies", "Help", "FAQs"].map(link => (
              <li key={link}><a href="#" className="hover:text-white transition">{link}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-indigo-200">Newsletter</h2>
          <p className="mb-4">Subscribe for updates and offers.</p>
          <div className="flex">
            <input type="email" placeholder="Email" className="flex-grow p-2 rounded-l bg-gray-800 border border-gray-700 text-white" />
            <button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 rounded-r text-white font-semibold">Submit</button>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-300 mt-8 border-t border-gray-700 pt-4">
        &copy; {new Date().getFullYear()} Smart_Learn
      </div>
    </footer>
  );
}
