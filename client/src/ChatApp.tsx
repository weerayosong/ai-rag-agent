import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
  rating?: number;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  recommendedProducts?: Product[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'ai',
    text: 'ระบบพร้อมทำงานค่ะ\nวันนี้มีสินค้าหมวดไหนที่อยากให้หนูช่วยค้นหาจากฐานข้อมูลไหมคะ?'
  }
];

const engToThaiMap: Record<string, string> = {
  '1': 'ๅ', '2': '/', '3': '-', '4': 'ภ', '5': 'ถ', '6': 'ุ', '7': 'ึ', '8': 'ค', '9': 'ต', '0': 'จ', '-': 'ข', '=': 'ช',
  'q': 'ๆ', 'w': 'ไ', 'e': 'ำ', 'r': 'พ', 't': 'ะ', 'y': 'ั', 'u': 'ี', 'i': 'ร', 'o': 'น', 'p': 'ย', '[': 'บ', ']': 'ล', '\\': 'ฃ',
  'a': 'ฟ', 's': 'ห', 'd': 'ก', 'f': 'ด', 'g': 'เ', 'h': '้', 'j': '่', 'k': 'า', 'l': 'ส', ';': 'ว', '\'': 'ง',
  'z': 'ผ', 'x': 'ป', 'c': 'แ', 'v': 'อ', 'b': 'ิ', 'n': 'ื', 'm': 'ท', ',': 'ม', '.': 'ใ', '/': 'ฝ',
  '!': '+', '@': '๑', '#': '๒', '$': '๓', '%': '๔', '^': 'ู', '&': '฿', '*': '๕', '(': '๖', ')': '๗', '_': '๘', '+': '๙',
  'Q': '๐', 'W': '"', 'E': 'ฎ', 'R': 'ฑ', 'T': 'ธ', 'Y': 'ํ', 'U': '๊', 'I': 'ณ', 'O': 'ฯ', 'P': 'ญ', '{': 'ฐ', '}': ',', '|': 'ฅ',
  'A': 'ฤ', 'S': 'ฆ', 'D': 'ฏ', 'F': 'โ', 'G': 'ฌ', 'H': '็', 'J': '๋', 'K': 'ษ', 'L': 'ศ', ':': 'ซ', '"': '.',
  'Z': '(', 'X': ')', 'C': 'ฉ', 'V': 'ฮ', 'B': 'ฺ', 'N': '์', 'M': '?', '<': 'ฒ', '>': 'ฬ', '?': 'ฦ'
};

const thaiToEngMap: Record<string, string> = Object.entries(engToThaiMap).reduce((acc, [eng, thai]) => {
  acc[thai] = eng;
  return acc;
}, {} as Record<string, string>);

const isInvalidThaiPattern = (text: string) => 
  /^[ัิีึืุู่้๊๋์็ะาำ]/.test(text) || 
  /[เแโใไ][ะาำเแโใไัิีึืุู่้๊๋์็]/.test(text) || 
  /[เแโใไ]$/.test(text) || 
  /[ัิีึืุู][ัิีึืุู]/.test(text) ||
  /[่้๊๋][่้๊๋]/.test(text) ||
  /[ัิีึืุู][ำ]/.test(text) ||
  /[ะา][ะาำ]/.test(text) ||
  /(ยย|ฟฟ|สส|หห|ดด|พพ|ะะ|าา|ิิ|ีี|ึึ|ืื|ุุ|ูู|เเ|แแ|โโ|ใใ|ไไ)/.test(text);

const convertWordEngToThai = (word: string) => {
  if (word.length === 0) return word;
  if (/[\u0E00-\u0E7F]/.test(word)) return word; 

  const isLikelyMistake = 
    /[a-zA-Z][0-9\-=\[\];',.\/][a-zA-Z]/.test(word) || 
    /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/.test(word) ||
    word.length > 7;

  if (!isLikelyMistake) return word;

  const mapped = word.split('').map(char => engToThaiMap[char] || char).join('');
  return isInvalidThaiPattern(mapped) ? word : mapped;
};

const convertWordThaiToEng = (word: string) => {
  if (word.length === 0) return word;
  if (!/[\u0E00-\u0E7F]/.test(word)) return word; 

  if (!isInvalidThaiPattern(word)) return word;

  const mapped = word.split('').map(char => thaiToEngMap[char] || char).join('');
  
  if (!/[aeiouyAEIOUY]/.test(mapped)) return word;

  return mapped;
};

const convertKeyboardLayout = (text: string) => {
  const words = text.split(/(\s+)/); 
  return words.map(word => {
    if (word.trim() === '') return word;
    
    const thaiCharCount = (word.match(/[\u0E00-\u0E7F]/g) || []).length;
    const engCharCount = (word.match(/[a-zA-Z]/g) || []).length;

    if (engCharCount > 0 && thaiCharCount === 0) {
      return convertWordEngToThai(word);
    } else if (thaiCharCount > 0 && engCharCount === 0) {
      return convertWordThaiToEng(word);
    }
    return word; 
  }).join('');
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      let newHeight = textareaRef.current.scrollHeight;
      if (newHeight > 100) newHeight = 100;
      textareaRef.current.style.height = newHeight + 'px';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = input.trim();
    if (!rawInput || isLoading) return;

    const trimmedInput = convertKeyboardLayout(rawInput);

    setMessages(prev => [...prev, { role: 'user', text: trimmedInput }]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedInput })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: data.text, recommendedProducts: data.recommendedProducts }]);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message === 'Failed to fetch' 
        ? 'ขออภัยค่ะ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ รบกวนคุณลูกค้าลองใหม่อีกครั้งนะคะ 🙇‍♀️'
        : (error.message || 'ขออภัยค่ะ ระบบมีปัญหาขัดข้องเล็กน้อย รบกวนคุณลูกค้าลองใหม่อีกครั้งนะคะ 🙇‍♀️');
      setMessages(prev => [...prev, { role: 'ai', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 h-screen flex flex-col font-sans antialiased overflow-hidden w-full">
      <header className="bg-white/90 backdrop-blur-md border-b-2 border-green-500 p-3 shrink-0 z-10 transition-colors duration-300 shadow-sm relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-orange-500 to-red-500"></div>
        <div className="max-w-3xl mx-auto flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white border-2 border-green-500 flex items-center justify-center text-green-600 shadow-sm">
              <i className="fa-solid fa-store text-sm"></i>
            </div>
            <div>
              <h1 className="font-semibold text-sm text-gray-900 tracking-tight">AI RAG Agent</h1>
              <p className="text-[11px] text-gray-500">Inventory Module • DummyJSON</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-medium text-green-700 uppercase tracking-wider">Ready</span>
            </div>
            <button
              type="button"
              onClick={() => setMessages(INITIAL_MESSAGES)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
              title="Clear Chat"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 scroll-smooth" id="chatContainer" ref={chatContainerRef}>
        <div className="max-w-3xl mx-auto flex flex-col gap-5" id="chatBox">
          {messages.map((msg, idx) => (
            msg.role === 'ai' ? (
              <div key={idx} className="flex gap-3 items-end w-full max-w-[85%] animate-fade-in-up">
                <div className="w-7 h-7 rounded-full bg-white border-2 border-green-500 shrink-0 flex items-center justify-center text-green-600 shadow-sm mb-1 overflow-hidden">
                  <i className="fa-solid fa-user-astronaut text-[14px]"></i>
                </div>
                <div className="bg-white border-t-2 border-t-green-500 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-800 shadow-sm leading-relaxed w-full transition-all duration-300 hover:shadow-md">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-orange-600 hover:text-orange-500 hover:underline transition-colors" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-gray-900" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 text-gray-900" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 text-gray-900" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                      {msg.recommendedProducts.map((product) => (
                        <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-3 flex gap-3 items-center hover:border-green-300 hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-pointer shadow-sm hover:shadow-md group relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                          <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-1 group-hover:border-green-200 transition-colors">
                            <img src={product.thumbnail} alt={product.title} className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-900 truncate group-hover:text-green-600 transition-colors">{product.title}</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">{product.category}</span>
                              <span className="flex items-center gap-0.5"><i className="fa-solid fa-star text-orange-400 text-[9px]"></i> {product.rating || "4.9"}</span>
                            </p>
                            <p className="font-bold text-sm text-orange-600 mt-1.5">${product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={idx} className="flex gap-3 items-end w-full max-w-[85%] self-end flex-row-reverse animate-fade-in-up">
                <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 shrink-0 flex items-center justify-center text-orange-600 mb-1 shadow-sm">
                  <i className="fa-solid fa-user text-[13px]"></i>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-md shadow-orange-500/20 transition-all duration-300">
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            )
          ))}

          {isLoading && (
            <div id="typingIndicator" className="flex gap-3 items-end w-full max-w-[85%] animate-fade-in-up">
              <div className="w-7 h-7 rounded-full bg-white border-2 border-green-500 shrink-0 flex items-center justify-center text-green-600 shadow-sm mb-1 overflow-hidden">
                <i className="fa-solid fa-user-astronaut text-[14px]"></i>
              </div>
              <div className="bg-white border-t-2 border-t-green-500 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white p-3 shrink-0 border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10 transition-colors duration-300">
        <div className="max-w-3xl mx-auto">
          <form
            id="chatForm"
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl transition-all duration-300 focus-within:border-green-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-500/10 shadow-inner"
          >
            <textarea
              id="userInput"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent py-3 pl-5 pr-12 text-sm text-gray-800 focus:outline-none resize-none placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              placeholder="ค้นหาสินค้า เช่น 'อยากได้ลิปสติกสีแดงแบบ เริ่ด เลยล่ะ'..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 bottom-1.5 w-8 h-8 bg-green-600 hover:bg-green-500 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-sm disabled:shadow-none"
            >
              <i className="fa-solid fa-paper-plane text-[13px] -translate-x-[1px] translate-y-[1px]"></i>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
