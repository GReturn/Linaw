import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Image as ImageIcon, 
  MousePointer2,
  Star,
  Gamepad2 
} from 'lucide-react';

// Mock database for the AI explanations - Now with real illustration images!
const dictionary = {
  'Photosynthesis': {
    cebuano: "Ang Photosynthesis kay ang pamaagi sa mga tanom pagbuhat sa ilang kaugalingong pagkaon gamit ang silaw sa adlaw, tubig, ug hangin (carbon dioxide).",
    english: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.",
    imageUrl: ""
  },
  'Chlorophyll': {
    cebuano: "Ang Chlorophyll mao ang naghatag sa kolor nga lunhaw (green) sa mga dahon. Kini usab ang mosalo sa silaw sa adlaw para makahimo og pagkaon ang tanom.",
    english: "Chlorophyll is the green pigment in plants that absorbs sunlight, providing the energy needed for photosynthesis.",
    imageUrl: ""
  }
};

function App() {
  const [activeWord, setActiveWord] = useState('Photosynthesis');
  const [isExplaining, setIsExplaining] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleWordClick = (word) => {
    if (activeWord === word && !isExplaining) return;
    setActiveWord(word);
    setIsExplaining(true);
    // Simulate AI "thinking" time
    setTimeout(() => setIsExplaining(false), 800);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#2D3748] font-sans overflow-x-hidden relative selection:bg-[#FF6B6B] selection:text-white">
      
      {/* Dynamic Background Gradients */}
      <div 
        className="fixed inset-0 pointer-events-none transition-transform duration-700 ease-out z-0"
        style={{ transform: `translate(${mousePos.x * -0.01}px, ${mousePos.y * -0.01}px)` }}
      >
        <div className="absolute top-[-10%] left-[10%] w-[800px] h-[800px] bg-[#4ECDC4] opacity-[0.1] blur-[100px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#FF6B6B] opacity-[0.08] blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-[#FFD93D] opacity-[0.1] blur-[100px] rounded-full mix-blend-multiply"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b-4 border-[#FFD93D] px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <strong className="text-3xl font-black tracking-tight text-[#2D3748]">Linaw</strong>
          <span className="text-sm text-[#4ECDC4] font-bold hidden sm:inline-block border-l-2 border-gray-200 pl-3 uppercase tracking-wider">
            Reading Superpowers
          </span>
        </div>
        <button className="px-6 py-3 rounded-2xl bg-[#4ECDC4] text-white font-bold hover:bg-[#3dbdb4] hover:scale-105 hover:rotate-1 transition-all shadow-[0_4px_0_#2b9e96] active:shadow-none active:translate-y-[4px]">
          Get Extension
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        
        {/* HERO SECTION */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD93D] text-[#2D3748] font-black text-sm mb-6 animate-bounce shadow-sm border-2 border-white">
            <Star size={16} className="fill-white text-white" /> 
            Make it rain, make it rainnnn!
            <Star size={16} className="fill-white text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight mb-4 text-[#2D3748]">
            Unlock the <span className="text-[#FF6B6B] underline decoration-wavy decoration-[#FFD93D]">Magic Words</span>!
          </h1>
          <p className="text-xl text-[#718096] flex items-center justify-center gap-2 font-medium">
            <MousePointer2 size={24} className="text-[#4ECDC4]" /> 
            Tap the glowing words to see who they really are.
          </p>
        </section>

        {/* Interactive Reader UI */}
        <div className="relative rounded-[2.5rem] bg-white border-4 border-[#4ECDC4] shadow-[8px_8px_0px_#2b9e96] overflow-hidden flex flex-col md:flex-row h-auto md:min-h-[600px] mb-32">
          
          {/* Left Side: Document Reader */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-[#fafcfb]">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-[#6b7280] mb-8 pb-4 border-b border-gray-200">
                <BookOpen size={20} />
                <span className="font-medium">Science_Grade5_Photosynthesis.pdf</span>
              </div>

              <div className="prose prose-lg text-gray-700 leading-relaxed space-y-6">
                <p>
                  Plants are amazing living things. Unlike animals, they don't need to hunt or find food. Instead, they make their own food through a process called <span 
                    onClick={() => handleWordClick('Photosynthesis')}
                    className={`px-1 rounded cursor-pointer transition-all duration-200 font-bold ${activeWord === 'Photosynthesis' ? 'bg-[#ffe55c] ring-2 ring-[#FFD93D]' : 'bg-[#fff1a8] hover:bg-[#ffe55c]'}`}
                  >
                    Photosynthesis
                  </span>. To do this, they need sunlight, water from the soil, and a gas from the air called carbon dioxide.
                </p>
                <p>
                  The secret ingredient that makes this possible is <span 
                    onClick={() => handleWordClick('Chlorophyll')}
                    className={`px-1 rounded cursor-pointer transition-all duration-200 font-bold ${activeWord === 'Chlorophyll' ? 'bg-[#ffe55c] ring-2 ring-[#FFD93D]' : 'bg-[#fff1a8] hover:bg-[#ffe55c]'}`}
                  >
                    Chlorophyll
                  </span>, which is also what makes leaves look green! It acts like a tiny solar panel, catching the sunlight so the plant can cook its meal.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Explanation Panel */}
          <div className="w-full md:w-[420px] bg-white border-t md:border-t-0 md:border-l border-gray-200 p-8 flex flex-col min-h-[500px] shadow-2xl md:shadow-none">
            {activeWord && dictionary[activeWord] ? (
              <div key={activeWord} className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-2">Explanation</h2>
                <h3 className="text-3xl font-bold text-[#1f2933] capitalize mb-4">{activeWord}</h3>

                {isExplaining ? (
                  <div className="space-y-4 flex-1">
                    <div className="h-48 bg-gray-100 rounded-xl animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-full"></div>
                    <div className="h-32 bg-gray-50 rounded-xl mt-6 animate-pulse border border-gray-100"></div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-5">
                    {/* Embedded Illustration */}
                    {dictionary[activeWord].imageUrl && (
                      <div className="rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm bg-white">
                        <img 
                          src={dictionary[activeWord].imageUrl} 
                          alt={`Illustration for ${activeWord}`} 
                          className="w-full h-auto object-cover max-h-52 hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#dcfce7]">
                      <div className="flex items-center gap-2 mb-3 text-[#4f7f6a] font-bold text-xs uppercase tracking-wider">
                        <Sparkles size={16} /> In Cebuano
                      </div>
                      <p className="text-[#1f2933] text-[1.05rem] leading-relaxed font-medium">
                        {dictionary[activeWord].cebuano}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">English Context</h4>
                      <p className="text-gray-500 text-sm leading-relaxed font-medium">
                        {dictionary[activeWord].english}
                      </p>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button className="w-full bg-[#1f2933] text-white py-4 rounded-xl font-medium hover:bg-[#4f7f6a] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                        Explain Simpler <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center">
                <MousePointer2 size={48} className="mb-4 opacity-50 animate-bounce" />
                <p className="font-medium">Tap a highlighted word to start your quest!</p>
              </div>
            )}
          </div>
        </div>

        {/* FEATURES SECTION */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold inline-block relative">
              Superpowers for Reading
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 bg-[#FFD93D] rounded-full"></span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: "Speak your language", desc: "Concepts are explained in Bisaya or Tagalog, just like how your friends talk!" },
              { icon: ImageIcon, title: "Picture this", desc: "Fun pictures and diagrams help you remember tricky science stuff." },
              { icon: Volume2, title: "Listen & Learn", desc: "Tired of reading? Just press play and listen to the explanation." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2 border-gray-100 hover:border-[#4ECDC4] group">
                <div className="w-14 h-14 bg-[#E0F7FA] text-[#4ECDC4] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#4ECDC4] group-hover:text-white transition-all duration-300 rotate-3 group-hover:rotate-6">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#6b7280] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="relative">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl font-bold inline-block relative">
              More than translation
              <span className="absolute -bottom-3 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-16 h-2 bg-[#FF6B6B] rounded-full"></span>
            </h2>
            <p className="text-[#6b7280] max-w-xl mt-6 text-lg mx-auto md:mx-0">
              Linaw does not simply convert words between languages. It explains ideas the way learners naturally understand them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Bad Example */}
            <div className="bg-white border-l-4 border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-gray-400 font-semibold mb-6 uppercase tracking-wider text-sm">
                <XCircle size={18} /> What most tools do
              </div>
              <h3 className="text-xl font-bold mb-4">Literal translation</h3>
              <div className="bg-gray-50 p-4 rounded-xl mb-4 font-medium text-lg flex items-center gap-3">
                Photosynthesis <ChevronRight className="text-gray-400"/> Fotosintesis
              </div>
              <p className="text-[#6b7280]">
                Direct word substitution with little regard for meaning, context, or cognitive load.
              </p>
            </div>

            {/* Good Example */}
            <div className="bg-white border-l-4 border-[#4ECDC4] rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-2 text-[#4ECDC4] font-black mb-6 uppercase tracking-wider text-sm">
                <CheckCircle2 size={18} /> The Linaw Way
              </div>
              <h3 className="text-xl font-bold mb-4">Localized understanding</h3>
              <div className="bg-[#E0F7FA] p-4 rounded-xl mb-4 font-medium text-lg flex items-center gap-3 border border-[#4ECDC4]">
                <span className="bg-[#FFD93D] px-2 rounded text-[#2D3748] font-bold">Photosynthesis</span> 
                <ChevronRight className="text-[#4ECDC4] shrink-0"/> 
                <span className="text-[#008080] italic font-bold">Pagluto sa pagkaon gamit ang adlaw</span>
              </div>
              <p className="text-[#6b7280]">
                Concepts are explained in familiar language, grounded in how learners think and reason.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;