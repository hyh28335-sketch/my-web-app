'use client';

import React, { useState, useRef } from 'react';
import { generateImage } from '@/lib/api';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  type: 'generated' | 'edited';
}

interface ImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGenerator({ isOpen, onClose }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await generateImage({
        prompt: prompt.trim(),
        model: 'google/gemini-2.0-flash-exp'
      });

      if (response.success && response.image_url) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: response.image_url,
          prompt: prompt,
          timestamp: new Date(),
          type: 'generated'
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error('图像生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const editImage = async () => {
    if (!selectedImage || !editPrompt.trim()) return;
    
    setIsEditing(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Edit this image: ${editPrompt}`,
          model: 'google/gemini-2.5-flash-image',
          type: 'image_editing',
          imageUrl: selectedImage
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const editedImage: GeneratedImage = {
          id: Date.now().toString(),
          url: data.imageUrl || selectedImage,
          prompt: editPrompt,
          timestamp: new Date(),
          type: 'edited'
        };
        setGeneratedImages(prev => [editedImage, ...prev]);
        setEditPrompt('');
      }
    } catch (error) {
      console.error('图像编辑失败:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `nano-banana-${prompt.slice(0, 20)}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveToNotes = async (image: GeneratedImage) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `AI生成图像: ${image.prompt.slice(0, 30)}...`,
          content: `![${image.prompt}](${image.url})\n\n**提示词:** ${image.prompt}\n**生成时间:** ${image.timestamp.toLocaleString()}\n**模型:** Nano Banana (Gemini 2.5 Flash Image)`,
          tags: ['AI生成', '图像', 'Nano Banana']
        }),
      });
      
      if (response.ok) {
        alert('图像已保存到笔记！');
      }
    } catch (error) {
      console.error('保存到笔记失败:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden overflow-y-auto">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nano Banana 图像生成器</h2>
                <p className="text-sm text-white/70">基于 Gemini 2.5 Flash Image 的 AI 图像生成</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              生成图像
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'edit'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              编辑图像
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'generate' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  描述你想要生成的图像
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例如：一只可爱的橙色小猫坐在彩虹上，卡通风格，明亮的色彩..."
                  className="w-full h-24 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <button
                onClick={handleGenerateImage}
                disabled={!prompt.trim() || isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    生成中...
                  </div>
                ) : (
                  '生成图像'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  上传要编辑的图像
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-white/30 rounded-lg text-white/70 hover:border-white/50 hover:text-white/90 transition-colors"
                >
                  点击上传图像
                </button>
                {uploadedImage && (
                  <div className="mt-4">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full max-w-xs mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  描述你想要的编辑效果
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="例如：将背景改为夕阳西下的海滩..."
                  className="w-full h-24 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <button
                onClick={editImage}
                disabled={!selectedImage || !editPrompt.trim() || isEditing}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isEditing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    编辑中...
                  </div>
                ) : (
                  '编辑图像'
                )}
              </button>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">生成的图像</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <div key={image.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <p className="text-sm text-white/80 mb-2 line-clamp-2">{image.prompt}</p>
                    <p className="text-xs text-white/60 mb-3">
                      {image.type === 'generated' ? '生成' : '编辑'} • {image.timestamp.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadImage(image.url, image.prompt)}
                        className="flex-1 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
                      >
                        下载
                      </button>
                      <button
                        onClick={() => saveToNotes(image)}
                        className="flex-1 py-2 bg-purple-500/20 text-purple-300 text-sm rounded-lg hover:bg-purple-500/30 transition-colors"
                      >
                        保存到笔记
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}