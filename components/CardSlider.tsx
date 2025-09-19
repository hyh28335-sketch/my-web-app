"use client";

import React from 'react';

interface Card {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

interface CardSliderProps {
  cards: Card[];
}

export default function CardSlider({ cards }: CardSliderProps) {

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* 主滑动容器 */}
      <div className="relative overflow-hidden">
        {/* 卡片容器 - 响应式网格布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-6xl mx-auto px-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 
                       border border-white/20 hover:border-white/40 transition-all duration-300
                       cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20
                       min-h-[180px] flex flex-col justify-center items-center text-center
                       before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br 
                       before:from-white/5 before:to-transparent before:opacity-0 
                       hover:before:opacity-100 before:transition-opacity before:duration-300"
              onClick={card.onClick}
            >
              {/* 光晕效果 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              
              <div className="relative z-10">
                <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-white/70 text-xs group-hover:text-white/90 transition-colors duration-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}