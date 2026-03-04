import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { ke } from '@/lib/sdk';
import { 
  Bot, 
  Send, 
  User, 
  Info, 
  Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const FAQ_CONTEXT = `
❗️MOST ASKED QUESTIONS❗️

Q1. FASTPAYZ PANEL KYA HAI?
Ans: FastPayz panel mein aapka account add hoga, usmein fund aayega aur aapko uska 10% commission milega.

Q2. FASTPAYZ PANEL MEIN KITNE TYPE KA FUND HAI?
Ans: FastPayz panel mein ONLY PURE GAMING FUND aata hai.

Q3. FASTPAYZ PANEL MEIN ACCOUNT ADD KRNE KE LIYE KYA DOCUMENTS LAGEGA?
Ans: FastPayz panel mein account add karne ke liye aapko ONLY (Account Number aur IFSC Code) dena hoga.

Q4. KYA FUND CREDIT/DEBIT AUTOMATIC HOGA?
Ans: Nahi, FastPayz panel mein fund auto-debit nahi hoga. Paisa transfer user ko MANUAL karna hoga.

Q5. PAISA KAB TRANSFER KARNA HAI AUR KAISE?
Ans: Jab aapke account mein ₹5,000 ka deposit complete ho jayega, tab hamara Agent khud aapse contact karega. Uske baad aapko wo paisa manual transfer karna hoga.

Q6. AGAR USER PAISA TRANSFER NAHI KARTA TO KYA HOGA?
Ans: Agar account mein fund aane ke baad user paisa transfer nahi karta hai, to uska account turant BLOCK kar diya jayega.

Q7. FASTPAYZ PANEL LENE KE LIYE SECURITY DEPOSIT KITNA HAI?
Ans: Panel activate karne ke liye Security Deposit slabs niche diye gaye hain:
👉 ₹2,000 Security Deposit — 2 Bank Accounts Add
👉 ₹5,000 Security Deposit — 4 Bank Accounts Add
👉 ₹10,000 Security Deposit — 8 Bank Accounts Add

Q8. PANEL KAB TAK ACTIVATE HOGA?
Ans: Security deposit pay karne ke 30 minutes ke andar aapka panel activate kar diya jayega.

Q9. FASTPAYZ PANEL MEIN KONSA ACCOUNT RUN KAR SAKTE HAI?
Ans: Ismein aap Savings, Current, aur Corporate saare accounts run kar sakte ho. Digital banks bhi allow hain.

Q10. KYA PANEL MEIN ALAG SE DEPOSIT KARNA HOGA?
Ans: Security Deposit ke alawa kaam shuru karne ke liye koi aur extra deposit nahi lagega. 👀

Q11. EK DIN MEIN KITNA FUND TRANSFER HO SAKTA HAI?
Ans: FastPayz panel mein daily koi limit nahi hai. Aapke bank account ka jo daily transaction limit hai, wo pura limit use ho sakta hai. Jitni aapke bank ki daily limit hogi, utna hi fund aayega aur transfer hoga.

Q12. BANK ACCOUNT KI LIMIT KAISE BADHAYE?
Ans: Aap apne bank se contact karke daily transaction limit badha sakte hain. Jitni zyada limit hogi, utna zyada fund aayega aur utna zyada commission milega.

Q13. AGAR ₹2000 PAYMENT MEIN PROBLEM AA RAHI HAI TO KYA KARE?
Ans: Agar aapko ₹2000 ek saath payment karne mein dikkat aa rahi hai (failed ya koi error), to aap yeh kar sakte hain:
👉 4 baar mein ₹500-₹500 payment kariye
👉 Har payment ka UTR number aur screenshot submit kariye (4 baar)
👉 Isse bhi aapka account activate ho jayega

YA

👉 Aap Bank Transfer (IMPS) se bhi ek baar mein full amount kar sakte hain

Koi bhi problem ho to Telegram pe contact karein:
📱 Telegram: https://t.me/FastPayz010
👤 Support: @Fastpayz00
`;

const quickQuestions = [
  "FastPayz panel kya hai?",
  "Security deposit kitna hai?",
  "Panel kab activate hoga?",
  "Commission kitna milega?",
  "Kya documents chahiye?",
  "Fund kaise transfer kare?"
];

export default function AIChat() {
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", content: "🙏 Namaste! Main FastPayz AI Assistant hoon. Aap mujhse FastPayz panel ke baare mein kuch bhi pooch sakte hain. Kaise madad kar sakta hoon aapki?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content = input) => {
    if (!content.trim()) return;

    const userMsg = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await ke.integrations.Core.InvokeLLM({
        prompt: `You are FastPayz AI Assistant. Answer the user's question in Hindi/Hinglish based on this FAQ:

${FAQ_CONTEXT}

User Question: ${content}

Instructions:
- Answer ONLY from the FAQ context provided
- Be friendly and helpful
- Use Hindi/Hinglish like the FAQ
- If question is not in FAQ, politely say "Yeh question mere FAQ mein nahi hai. Kripya humse Telegram par contact karein: https://t.me/FastPayz010"
- Keep answers concise and clear
- Use emojis where appropriate

Answer:`,
        add_context_from_internet: false
      });

      const botMsg = { role: "bot", content: response };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg = { role: "bot", content: "Maaf kijiye, kuch technical issue ho raha hai. Kripya dobara try karein ya Telegram par contact karein." };
      setMessages(prev => [...prev, errorMsg]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                FastPayz AI Assistant
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </h1>
              <p className="text-purple-100 text-sm">Aapke sawaalon ka jawaab, 24x7</p>
            </div>
          </div>
        </div>

        {messages.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Info className="w-4 h-4" />
              <span>Quick questions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <Button 
                  key={i}
                  onClick={() => handleSend(q)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  {q}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-4 min-h-[500px] max-h-[600px] overflow-y-auto pb-4 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-2xl p-4",
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" 
                    : "bg-gray-800 text-gray-100"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-4 bg-gray-800 rounded-2xl p-4 border border-gray-700 shadow-2xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Apna sawal yahan type karein..."
              className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-12"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
