import React from "react";
import { Link, useNavigate } from "react-router-dom";

// Adjusted imports — make sure these images exist in src/assets/
import Onlinelearn from "../assets/onlinelearn.jpg";
import Smartleaern from "../assets/smartlearn.jpg";
import test1 from "../assets/test1.jpg";
import test2 from "../assets/test2.jpg";
import test3 from "../assets/test3.jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24"> {/* padding to prevent content hiding */}
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
    <nav className="bg-gray-900 text-white fixed top-0 left-0 w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* logo */}
        <Link to="/" className="text-5xl font-bold text-orange-500">
          Smart_Learn
        </Link>

        {/* nav links */}
        <ul className="flex gap-8 items-center">
          <li>
            <a href="#" className="hover:text-orange-400">Home</a>
          </li>
          <li>
          <a href="#about" className="hover:text-orange-400">About</a>

          </li>
          {/* <li>
            <a href="#service" className="hover:text-orange-400">Service</a>
          </li> */}
          <li>
            <a href="#features" className="hover:text-orange-400">Feature</a>
          </li>
          <li>
            <a href="#contact" className="hover:text-orange-400">Contact</a>
          </li>
          <li>
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 text-white rounded-full px-4 py-2 hover:bg-orange-600"
            >
              Login
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

/* ----------------- Hero ----------------- */
function Hero() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-extrabold mb-4 text-gray-900">
            Learn Smarter, Anywhere
          </h1>
          <p className="text-gray-600 mb-6">
            Join thousands of learners — flexible online classes, expert instructors, and
            practical projects to help you grow your skills.
          </p>
          <div className="flex gap-4">
            <Link
              to="/course1"
              className="bg-orange-500 px-6 py-3 rounded-md text-white font-semibold hover:bg-orange-600"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        <div>
          <img
            src={Onlinelearn}
            alt="Learning"
            className="w-[120%] max-w-none rounded-lg shadow-lg"
          />
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
      <div className="max-w-8xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
        <img
          src={Smartleaern}
          alt="Business Man"
          className="w-full rounded-lg shadow-sm"
        />
        <div>
          <h2 className="text-4xl font-bold mb-4">Learn With Us</h2>
          <p className="text-gray-600 mb-6">
            Online education is learning that happens over the internet using devices like
            computers and tablets, instead of in a physical classroom. Students can take
            classes, watch videos, and interact with teachers and classmates from anywhere,
            at any time.
          </p>

          <div className="grid grid-cols-2 gap-6 text-center">
            {stats.map(({ icon, num, label }) => (
              <div
                key={label}
                className="bg-gray-100 p-4 rounded-lg shadow-sm"
              >
                <i className={`fa ${icon} text-orange-500 text-3xl mb-2`} />
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
    {
      img: test1,
      text: "Features like live classes, assignment tracking, performance dashboards, and  frequently highlighted as beneficial..",
      name: "Jomon",
      role: "Bsc.computerscience",
    },
    {
      img: test2,
      text: "Good teaching and improve my skills",
      name: "Aryan",
      role: "MSc",
    },
    {
      img: test3,
      text: "Easy to learn anyone from anywhere.",
      name: "Client Name",
      role: "Btech",
    },
  ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-orange-500 uppercase font-semibold">
          Testimonial Carousel
        </p>
        <h2 className="text-4xl font-bold mb-10">
          100% Positive Customer Reviews
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div
              key={`${t.name}-${idx}`}
              className="bg-gray-100 p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <img
                src={t.img}
                alt={t.name}
                className="w-20 h-20 mx-auto rounded-full mb-4 object-cover"
              />
              <p className="text-gray-600 mb-4">{t.text}</p>
              <h3 className="font-bold">{t.name}</h3>
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
    <section id="contact" className="py-16 bg-white">
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-orange-500">
            Our Head Office
          </h2>
          <p>
            <i className="fa fa-map-marker-alt mr-2"></i>123 Street, Kerala, India
          </p>
          <p>
            <i className="fa fa-phone-alt mr-2"></i>+012 345 67890
          </p>
          <p>
            <i className="fa fa-envelope mr-2"></i>anjupavithranm95@gmail.com
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-orange-500">
            Quick Links
          </h2>
          <ul className="space-y-2">
            {["Terms of Use", "Privacy Policy", "Cookies", "Help", "FAQs"].map(
              (link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white">
                    {link}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-orange-500">Newsletter</h2>
          <p className="mb-4">Subscribe for updates and offers.</p>
          <div className="flex">
            <input
              type="email"
              placeholder="Email"
              className="flex-grow p-2 rounded-l bg-gray-800 border border-gray-700 text-white"
            />
            <button className="bg-orange-500 px-4 rounded-r text-black font-semibold">
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-8 border-t border-gray-700 pt-4">
        &copy; {new Date().getFullYear()} Smart_Learn
      </div>
    </footer>
    </section>
  );
}
