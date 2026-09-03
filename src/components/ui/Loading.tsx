import React from 'react';
import Image from 'next/image';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Cargando...', 
  size = 'md', 
  variant = 'default' 
}) => {
  // Tamaños ajustados para que el logotipo sea visible
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = {
    default: 'flex flex-col items-center justify-center py-12 px-4 min-h-[50vh]',
    minimal: 'flex items-center justify-center py-4'
  };

  if (variant === 'minimal') {
    return (
      <div className={containerClasses.minimal}>
        <div className={`relative flex justify-center items-center ${sizeClasses[size]}`}>
          {/* Anillo exterior multicolor giratorio */}
          <div className="absolute inset-0 border-2 border-t-[#fcc238] border-r-[#63bae9] border-b-[#5a5a5a] border-l-transparent rounded-full animate-spin"></div>
          
          {/* Logo interno pulsante */}
          <div className="w-3/5 h-3/5 relative animate-pulse">
            <Image src="/logo.png" alt="Cargando" fill className="object-contain" priority sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
        {message && (
          <span className={`ml-3 ${textSizes[size]} font-medium text-gray-600 gradient-text`}>
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses.default}>
      <div className="inline-flex flex-col items-center justify-center">
        {/* Contenedor del Spinner y Logo */}
        <div className={`relative flex justify-center items-center ${sizeClasses[size]} mb-6`}>
          {/* Anillo giratorio con los colores de la marca */}
          <div className="absolute inset-0 border-[3px] border-t-[#fcc238] border-r-[#63bae9] border-b-[#5a5a5a] border-l-transparent rounded-full animate-spin"></div>
          
          {/* Logo central pulsante */}
          <div className="absolute inset-3 animate-pulse flex items-center justify-center">
            <div className="relative w-full h-full">
               <Image src="/logo.png" alt="Inmovación Cargando" fill className="object-contain drop-shadow-md" priority sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
        
        {/* Texto de carga */}
        <div className="space-y-3 flex flex-col items-center">
          <p className={`${textSizes[size]} font-semibold gradient-text tracking-wide`}>
            {message}
          </p>
          
          {/* Puntos animados con colores de la marca */}
          <div className="flex justify-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: '#fcc238' }}></div>
            <div className="w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: '#63bae9' }}></div>
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: '#5a5a5a' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;