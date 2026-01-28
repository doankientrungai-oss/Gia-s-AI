
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Spinner } from './components/Spinner';
import { AppFooter } from './components/AppFooter';
import { WordIcon } from './components/IconComponents';
import { type Message, Role } from './types';
import { generateResponse } from './services/geminiService';
import { readFileContent } from './services/fileReaderService';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      parts: [{ text: "Chào mừng em! Thầy là **Ông Giáo Biết Tuốt**, gia sư đồng hành cùng em. Thầy có thể giúp em giải Toán, viết Văn, học Anh văn hay bất cứ môn nào em cần. \n\nĐể thầy hỗ trợ tốt nhất, em cho thầy biết tên và em đang học lớp mấy nhé? 😊" }],
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    if ((window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise();
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string, file: File | null) => {
    if (!text.trim() && !file) return;

    setIsLoading(true);
    const userTextPart = text.trim() ? [{ text: text.trim() }] : [];

    if (file) {
        const userMessageForUi: Message = {
            role: Role.USER,
            parts: [
                ...userTextPart,
                ...(file.type.startsWith('image/') ? [] : [{ text: `\n\n📄 *Thầy đang xem tệp: ${file.name}*` }])
            ]
        };

        try {
            if (file.type.startsWith('image/')) {
                const base64Image = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = error => reject(error);
                });

                userMessageForUi.parts.push({
                    inlineData: { mimeType: file.type, data: base64Image }
                });
                setMessages(prev => [...prev, userMessageForUi]);
                await fetchBotResponse(userMessageForUi, [...messages, userMessageForUi]);

            } else {
                setMessages(prev => [...prev, userMessageForUi]);
                const fileContent = await readFileContent(file);
                
                const userMessageForApi: Message = {
                    role: Role.USER,
                    parts: [
                        ...userTextPart,
                        { text: `\n\n[Dữ liệu từ tệp "${file.name}"]\n\n${fileContent}\n\n[Hết nội dung tệp]` }
                    ]
                };
                await fetchBotResponse(userMessageForApi, [...messages, userMessageForUi]);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            const errorMessage: Message = {
                role: Role.MODEL,
                parts: [{ text: `Ôi, thầy không đọc được tệp "${file.name}" rồi. Em thử gửi lại hoặc copy nội dung vào đây nhé!` }],
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    } else {
        const newUserMessage: Message = {
            role: Role.USER,
            parts: userTextPart,
        };
        setMessages(prev => [...prev, newUserMessage]);
        await fetchBotResponse(newUserMessage, [...messages, newUserMessage]);
    }
  }, [messages]);

  const fetchBotResponse = async (apiMessage: Message, currentFullHistory: Message[]) => {
      try {
        const botResponse = await generateResponse(currentFullHistory.slice(0, -1), apiMessage);
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error("Failed to get response from Gemini:", error);
        const errorMessage: Message = {
          role: Role.MODEL,
          parts: [{ text: "Hệ thống đang bận một chút, em hỏi lại thầy câu này nhé!" }],
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
  };

  const handleExportWord = async () => {
    if (messages.length === 0) return;
    setIsExporting(true);

    try {
      const docChildren = [
        new Paragraph({
          text: "Nội dung cuộc trò chuyện với Ông Giáo Biết Tuốt",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
      ];

      messages.forEach((msg) => {
        const roleText = msg.role === Role.USER ? "Học sinh:" : "Ông Giáo:";
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: roleText,
                bold: true,
                color: msg.role === Role.USER ? "4F46E5" : "2563EB",
                size: 28,
              }),
            ],
            spacing: { before: 200 },
          })
        );

        msg.parts.forEach((part) => {
          if ('text' in part) {
            // Split by lines to preserve some structure
            const lines = part.text.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                docChildren.push(
                  new Paragraph({
                    children: [new TextRun({ text: line, size: 24 })],
                    spacing: { after: 120 },
                  })
                );
              }
            });
          } else {
            docChildren.push(
              new Paragraph({
                children: [new TextRun({ text: "[Hình ảnh/Tệp đính kèm]", italic: true, color: "94A3B8" })],
              })
            );
          }
        });
      });

      const doc = new Document({
        sections: [{ children: docChildren }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CuocTroChuyen_ÔngGiáoBiếtTuốt_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Word error:", error);
      alert("Có lỗi xảy ra khi xuất file Word. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-gray-800 font-sans">
      <Header />
      
      {/* Global Actions Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex justify-end">
        <button 
          onClick={handleExportWord}
          disabled={isExporting || messages.length <= 1}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white rounded-full text-sm font-bold shadow-md hover:shadow-green-100 transition-all active:scale-95"
        >
          {isExporting ? <Spinner /> : <WordIcon className="w-4 h-4" />}
          {isExporting ? 'Đang xuất...' : 'Xuất Word (.docx)'}
        </button>
      </div>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-8 w-full">
            {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white border-2 border-blue-50 rounded-2xl rounded-tl-none p-5 shadow-lg">
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-blue-500 animate-pulse">Ông Giáo đang suy nghĩ</span>
                        <Spinner />
                    </div>
                </div>
            </div>
            )}
        </div>
      </main>
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 sticky bottom-0 z-10 pb-safe">
        <div className="p-4 md:p-6">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
        <AppFooter />
      </footer>
    </div>
  );
};

export default App;
