import React from 'react';
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page } from 'react-pdf';

const Reader = ({
    mobileView,
    notebook,
    currentFile,
    scale,
    setScale,
    numPages,
    setNumPages,
    pageNumber,
    setPageNumber,
    handleTextSelection
}) => {
    return (
        <main className={`${mobileView === 'reader' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-[#F8FAFC] relative`}>
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
                <div className="flex items-center gap-4 text-[#2D3748]">
                    <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} className="text-[#3DBDB4]" />
                        {notebook.title}
                    </h3>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-gray-100 rounded-full p-1">
                        <button onClick={() => setScale(s => s - 0.1)} className="p-1.5 hover:bg-white rounded-full transition-all"><ZoomOut size={16} /></button>
                        <span className="text-[10px] font-black px-2 w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => s + 0.1)} className="p-1.5 hover:bg-white rounded-full transition-all"><ZoomIn size={16} /></button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto flex justify-center py-8 px-4" onMouseUp={handleTextSelection}>
                <div className="shadow-xl bg-white h-fit border border-gray-200">
                    {currentFile && (
                        <Document
                            file={currentFile}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={true}
                            />
                        </Document>
                    )}
                </div>
            </div>

            {numPages && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 py-2 px-6 bg-[#2D3748] shadow-xl rounded-full z-10 text-white">
                    <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="hover:text-[#FFD93C] disabled:opacity-30">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs font-black tracking-widest">{pageNumber} / {numPages}</span>
                    <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="hover:text-[#FFD93C] disabled:opacity-30">
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </main>
    );
};

export default Reader;
