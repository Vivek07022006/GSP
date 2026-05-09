import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Shield, ChevronDown, ArrowRight, Star, Lock } from 'lucide-react';

/* ─── Logo ─── */
const SathyabamaLogo = () => (
  <div className="flex items-center gap-2.5 select-none">
    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
      <GraduationCap size={22} className="text-[#7B1535]" />
    </div>
    <div className="leading-tight">
      <span className="block text-white font-black text-sm tracking-wider">SATHYABAMA</span>
      <span className="block text-white/60 text-[9px] tracking-widest uppercase">Institute of Science and Technology</span>
    </div>
  </div>
);

/* ─── Glassmorphism card ─── */
const GlassCard = ({ children, className = '' }) => (
  <div className={`backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl ${className}`}>
    {children}
  </div>
);

/* ─── Review stages (5 only) ─── */
const REVIEW_STAGES = [
  { num: 0, name: 'Zeroth Review',  desc: 'Topic & Guide Selection',                       locked: false },
  { num: 1, name: 'First Review',   desc: 'PPT & Paper Publication / Patent Document',      locked: false },
  { num: 2, name: 'Second Review',  desc: 'Status of Publication / Patent, PPT updation',  locked: false, needsApproval: true },
  { num: 3, name: 'Model Review',   desc: 'Main project model evaluation by guide',         locked: true },
  { num: 4, name: 'Final Review',   desc: 'Final project submission & assessment',          locked: true },
];

export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();
  const homeRef = useRef(null);
  const aboutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref, section) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(section);
  };

  const navLinkCls = (section) =>
    `text-sm font-semibold transition-all duration-200 px-1 py-0.5 cursor-pointer ${
      activeSection === section
        ? 'text-white border-b-2 border-white/60 pb-0'
        : 'text-white/75 hover:text-white'
    }`;

  return (
    <div className="font-sans">

      {/* ════════════════════════════════════
          NAVBAR
      ════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navScrolled ? 'bg-[#7B1535]/95 backdrop-blur-md shadow-xl' : 'bg-[#7B1535]'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <SathyabamaLogo />

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollTo(homeRef, 'home')} className={navLinkCls('home')}>Home</button>
            <button onClick={() => scrollTo(aboutRef, 'about')} className={navLinkCls('about')}>About</button>
          </div>

          {/* Right: Login button */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-white text-[#7B1535] font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#f0e0e5] transition-colors shadow-md"
          >
            Login <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════
          HOME SECTION
      ════════════════════════════════════ */}
      <section ref={homeRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Background image — Background.jpg from Photos folder */}
        <div className="absolute inset-0 z-0">
          <img
            src="http://localhost:5000/photos/Background.jpg"
            alt="Sathyabama Campus"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-[#7B1535]/60 to-black/75" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <Star size={12} className="text-white fill-white" />
              <span className="text-white text-xs font-bold tracking-wide">Guide Selection & Review Management Portal</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 drop-shadow-lg">
              WELCOME..
            </h1>

            <p className="text-white/85 text-base md:text-lg leading-relaxed mb-8 max-w-xl font-medium drop-shadow">
              We're thrilled to have you join our dynamic and innovative community. Here, you'll embark on a journey of
              exploration, learning, and collaboration in the ever-evolving world of technology. Manage your project
              guides, submit reviews, and track your academic progress — all in one place.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/login', { state: { role: 'student' } })}
                className="flex items-center gap-2 bg-[#7B1535] hover:bg-[#961a42] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-white/10"
              >
                Student Login <ArrowRight size={15} />
              </button>
              <button
                onClick={() => scrollTo(aboutRef, 'about')}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all border border-white/30 shadow-sm"
              >
                Learn More <ChevronDown size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown size={28} className="text-white/60" />
        </div>
      </section>

      {/* ════════════════════════════════════
          ABOUT SECTION
      ════════════════════════════════════ */}
      <section ref={aboutRef} className="relative py-24 overflow-hidden bg-white">
        {/* Pattern Background */}
        <div className="absolute inset-0 z-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #7B1535 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6">

          {/* Title */}
          <div className="text-center mb-12">
            <span className="text-[#7B1535] text-xs font-bold tracking-widest uppercase bg-[#7B1535]/10 px-3 py-1 rounded-full">About the Portal</span>
            <h2 className="text-4xl font-black text-gray-900 mt-4 mb-4">What is GuideSelect?</h2>
            <p className="text-gray-600 font-medium max-w-2xl mx-auto text-base leading-relaxed">
              A comprehensive digital platform designed for Sathyabama Institute to streamline the process
              of project guide allocation and multi-stage review tracking for students.
            </p>
          </div>


          {/* ── Review Flow ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8">
            <h3 className="text-gray-900 font-black text-xl mb-8 text-center">Review Flow</h3>

            {/* Stages */}
            <div className="flex flex-col gap-0 max-w-2xl mx-auto">
              {REVIEW_STAGES.map((r, i) => (
                <div key={i}>
                  {/* Stage row */}
                  <div className={`flex items-start gap-5 p-4 rounded-xl transition-all ${
                    r.locked ? 'opacity-60 bg-white border border-gray-100' : 'bg-white shadow-sm border border-gray-200'
                  }`}>
                    {/* Number bubble */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${
                      r.locked
                        ? 'bg-gray-100 border border-gray-200 text-gray-400'
                        : 'bg-[#7B1535] text-white'
                    }`}>
                      {r.locked ? <Lock size={14} /> : r.num}
                    </div>

                    {/* Text */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-bold text-sm">{r.name}</span>
                        {r.needsApproval && (
                          <span className="text-[10px] bg-yellow-50 border border-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full font-bold tracking-wide">
                            ✓ Approval needed to proceed
                          </span>
                        )}
                        {r.locked && (
                          <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold tracking-wide">
                            🔒 Unlocks after approval
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 font-medium text-xs mt-1">{r.desc}</p>
                    </div>
                  </div>

                  {/* Connector line only */}
                  {i < REVIEW_STAGES.length - 1 && (
                    <div className="flex items-center gap-4 px-4 py-1">
                      <div className="w-10 flex justify-center">
                        <div className="w-0.5 h-6 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* No "Ready to get started" section here */}
        </div>
      </section>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
      <footer className="bg-[#5a0f27] py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <SathyabamaLogo />
          <div className="text-center">
            <p className="text-white/80 text-sm font-semibold">Department of Information Technology</p>
            <p className="text-white/40 text-xs mt-0.5">
              Sathyabama Institute of Science and Technology
            </p>
          </div>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Guide Selection Portal
          </p>
        </div>
      </footer>

    </div>
  );
}
