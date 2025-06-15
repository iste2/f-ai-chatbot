import React, { useState } from 'react';
import { FullscreenIcon } from './icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogOverlay
} from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';

interface FullscreenWrapperProps {
  children: React.ReactNode | ((isFullscreen: boolean) => React.ReactNode);
  className?: string;
  style?: React.CSSProperties;
}

export const FullscreenWrapper: React.FC<FullscreenWrapperProps> = ({ children, className, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  const ContentWithButton = ({ onClick, isFullscreen, showButton }: { onClick: () => void; isFullscreen: boolean; showButton: boolean }) => (
    <div className="relative size-full flex-1">
      {showButton && (
        <Button
          className="absolute right-4 top-4 z-40 p-2 rounded-md focus:outline-none"
          onClick={onClick}
          aria-label={isOpen ? 'Close modal' : 'Open fullscreen modal'}
          variant="default"
          size="icon"
          type="button"
        >
          <FullscreenIcon size={20} />
        </Button>
      )}
      <div className="size-full overflow-auto flex-1">
        {typeof children === 'function' ? (children(isFullscreen)) : children}
      </div>
    </div>
  );

  return (
    <div className={className} style={style}>
      {/* Only the fullscreen button opens the dialog now */}
      <ContentWithButton onClick={() => setIsOpen(true)} isFullscreen={false} showButton={!isOpen} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent
          className={
            'bg-white dark:bg-gray-900 rounded-lg shadow-lg p-10 max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] flex flex-col ' +
            (className || '')
          }
          style={style}
        >
          <div className="flex-1 min-h-0 min-w-0 overflow-auto">
            <ContentWithButton onClick={() => setIsOpen(false)} isFullscreen={true} showButton={false} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
