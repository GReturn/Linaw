import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ChevronRight,
  MousePointer2,
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

export default function InteractiveReader() {
  const [activeWord, setActiveWord] = useState('Photosynthesis');
  const [isExplaining, setIsExplaining] = useState(false);

  const handleWordClick = (word) => {
    if (activeWord === word && !isExplaining) return;
    setActiveWord(word);
    setIsExplaining(true);
    // Simulate AI "thinking" time
    setTimeout(() => setIsExplaining(false), 800);
  };

  return (
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
  );
}