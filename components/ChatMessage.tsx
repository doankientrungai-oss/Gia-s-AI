
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax/browser';
import remarkGfm from 'remark-gfm';
import { type Message, Role } from '../types';
import { ScholarIcon, StudentIcon, CopyIcon, CheckIcon } from './IconComponents';

interface ChatMessageProps {
  message: Message;
}

const UserIcon: React.FC = () => (
    <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 overflow-hidden shadow-lg border-2 border-white">
        <StudentIcon className="w-7 h-7 text-white" />
    </div>
);

const ModelIcon: React.FC = () => (
    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-lg border-2 border-blue-500">
        <ScholarIcon className="w-7 h-7 text-blue-600" />
    </div>
);


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = message.parts
      .map(part => ('text' in part ? part.text : ''))
      .join('\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Renderers shared between both User and Model but with slight color adjustments
  const createRenderers = (isModel: boolean) => ({
    a: ({...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className={isModel ? "text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4 font-semibold" : "text-blue-200 hover:text-white underline decoration-2 underline-offset-4 font-semibold"} />,
    table: ({...props}) => <div className="overflow-x-auto my-4 rounded-xl border border-gray-200"><table className="table-auto border-collapse w-full" {...props} /></div>,
    th: ({...props}) => <th className={`border border-gray-200 px-4 py-2 ${isModel ? 'bg-blue-50 text-blue-700' : 'bg-white/10 text-white'} font-bold text-left`} {...props} />,
    td: ({...props}) => <td className="border border-gray-100 px-4 py-2" {...props} />,
    code: ({node, inline, className, children, ...props}: any) => (
      <code className={`${className} ${isModel ? 'bg-gray-100 text-pink-600' : 'bg-black/20 text-pink-200'} rounded px-1 py-0.5 font-mono text-sm break-words`} {...props}>
        {children}
      </code>
    ),
    pre: ({...props}) => <pre className={`${isModel ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-black/30 border-white/10 text-white'} rounded-xl p-4 overflow-x-auto my-3 border font-mono text-sm`} {...props} />,
    p: ({...props}) => <p className="leading-relaxed text-[16px] inline" {...props} />, // Changed to inline to prevent formula breaks
    li: ({...props}) => <li className="mb-1 last:mb-0" {...props} />,
  });

  return (
    <div className={`flex items-start gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? <UserIcon /> : <ModelIcon />}
      </div>
      <div className={`flex flex-col max-w-[90%] md:max-w-5xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative group rounded-3xl px-6 py-4 shadow-xl prose prose-slate max-w-none transition-all duration-300 w-full ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-tr-none border border-blue-400 prose-invert' 
            : 'bg-white text-gray-800 rounded-tl-none border-2 border-blue-50 border-b-blue-100'
        }`}>
          {message.parts.map((part, index) => {
              if ('inlineData' in part) {
                  return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="User upload" className="rounded-2xl mb-3 max-w-full shadow-lg border-2 border-white/20 not-prose" />;
              }
              return (
                  <div key={index} className="markdown-content font-medium leading-relaxed tracking-normal whitespace-normal">
                      <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeMathjax]}
                          components={createRenderers(!isUser)}
                      >
                          {part.text}
                      </ReactMarkdown>
                  </div>
              );
          })}
          
          {/* Action Row at the bottom of the message */}
          <div className={`mt-3 pt-2 flex justify-end items-center border-t ${isUser ? 'border-white/10' : 'border-gray-50'}`}>
            <button 
                onClick={handleCopy}
                title="Sao chép nội dung"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    isUser 
                        ? 'bg-white/10 hover:bg-white/20 text-white shadow-sm' 
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm'
                }`}
            >
                {copied ? (
                    <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Đã chép</span>
                    </>
                ) : (
                    <>
                        <CopyIcon className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                    </>
                )}
            </button>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-2 font-bold uppercase tracking-widest flex items-center gap-2">
            {isUser ? 'Học sinh' : 'Ông Giáo'}
        </span>
      </div>
    </div>
  );
};
