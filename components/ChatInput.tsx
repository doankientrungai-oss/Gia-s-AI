
import React, { useState, useRef, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { PaperclipIcon, SendIcon, XIcon, FileIcon } from './IconComponents';

interface ChatInputProps {
  onSendMessage: (text: string, file: File | null) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
                event.preventDefault();
                processFile(file);
                break;
            }
        }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreviewUrl(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if ((text.trim() || attachedFile) && !isLoading) {
      onSendMessage(text, attachedFile);
      setText('');
      removeFile();
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2">
       {attachedFile && (
          <div className="p-3 relative w-max max-w-full bg-white border-2 border-blue-200 rounded-2xl mb-3 shadow-md animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center space-x-3">
                {filePreviewUrl ? (
                  <img src={filePreviewUrl} alt="Preview" className="rounded-xl object-cover h-24 w-24 border border-gray-100" />
                ) : (
                  <div className="flex items-center space-x-2 p-2">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <FileIcon className="w-8 h-8 text-blue-600 shrink-0" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 break-all">{attachedFile.name}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={removeFile} 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 active:scale-90 transition-all border-2 border-white"
              >
                  <XIcon className="w-4 h-4" />
              </button>
          </div>
        )}
      <div className="flex items-end bg-white rounded-[2rem] p-3 border-2 border-gray-100 shadow-xl focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-200">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all active:scale-90"
          aria-label="Attach file"
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          placeholder="Thầy ơi, giải giúp em bài này với..."
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none p-2 text-lg outline-none placeholder:text-gray-400"
          rows={1}
          style={{maxHeight: '150px'}}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !attachedFile)}
          className={`p-3 rounded-full text-white shadow-lg transition-all active:scale-90 disabled:scale-100 ${
            isLoading || (!text.trim() && !attachedFile) 
              ? 'bg-gray-200 cursor-not-allowed text-gray-400 shadow-none' 
              : 'bg-blue-500 hover:bg-blue-600 hover:shadow-blue-200'
          }`}
          aria-label="Send message"
        >
          <SendIcon className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
