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
      const response = await fetch('http://localhost:3000/api/chat', {
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
      setMessages(prev => [...prev, { role: 'ai', text: `ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}` }]);
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
    <div className="bg-gray-100 text-gray-800 h-screen flex flex-col font-sans antialiased overflow-hidden w-full">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-3 shrink-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-sm">
              <i className="fa-solid fa-microchip text-sm"></i>
            </div>
            <div>
              <h1 className="font-semibold text-sm text-gray-900 tracking-tight">AI RAG Agent</h1>
              <p className="text-[11px] text-gray-400">Inventory Module • DummyJSON</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Ready</span>
            </div>
            <button
              type="button"
              onClick={() => setMessages(INITIAL_MESSAGES)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
              <div key={idx} className="flex gap-3 items-end w-full max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shrink-0 flex items-center justify-center text-gray-600 shadow-sm mb-1">
                  <i className="fa-solid fa-shield-dog text-xl"></i>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-700 shadow-sm leading-relaxed w-full">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {msg.recommendedProducts.map((product) => (
                        <div key={product.id} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex gap-3 items-center hover:bg-gray-100 transition-colors cursor-pointer">
                          <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={product.thumbnail} alt={product.title} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-gray-900 truncate">{product.title}</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">Category: {product.category} | <i className="fa-solid fa-star text-yellow-400"></i> {product.rating || "4.9"}</p>
                            <p className="font-semibold text-sm text-gray-900 mt-1">${product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={idx} className="flex gap-3 items-end w-full max-w-[85%] self-end flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 mb-1">
                  <i className="fa-solid fa-user text-lg"></i>
                </div>
                <div className="bg-gray-800 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            )
          ))}

          {isLoading && (
            <div id="typingIndicator" className="flex gap-3 items-end w-full max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-white border border-gray-200 shrink-0 flex items-center justify-center text-gray-600 shadow-sm mb-1">
                <i className="fa-solid fa-shield-dog text-xl"></i>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white p-3 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
          <form
            id="chatForm"
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl transition-all focus-within:border-gray-400 focus-within:bg-white shadow-inner"
          >
            <textarea
              id="userInput"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent py-3 pl-5 pr-12 text-sm focus:outline-none resize-none placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="ค้นหาสินค้า เช่น 'อยากได้ลิปติกสีแดงแบบ เริ่ด เลยล่ะ'..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 bottom-1.5 p-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-transform active:scale-95 flex items-center justify-center"
            >
              <i className="fa-solid fa-paper-plane text-[13px] -translate-x-[1px] translate-y-[1px]"></i>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
