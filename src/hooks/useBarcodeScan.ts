import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';

type BarcodeConfig = {
  onScan?: (barcode: string) => void;
  enabled?: boolean;
};

export const useBarcodeScan = ({ onScan, enabled = true }: BarcodeConfig = {}) => {
  const [buffer, setBuffer] = useState<string>('');
  const [lastScan, setLastScan] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if the active element is an input or textarea
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement
        || activeElement instanceof HTMLTextAreaElement;

      // If we're in an input field and it's not a barcode scan (Enter key),
      // let the default behavior happen
      if (isInputFocused && event.key !== 'Enter') {
        return;
      }

      // Only process if it's a keypress event
      if (event.type !== 'keypress') {
        return;
      }

      // If it's Enter, process the buffer
      if (event.key === 'Enter') {
        const scannedValue = buffer.trim().toUpperCase();

        // Validate the scanned value matches our expected formats
        const isValidFormat = /^(?:S|IF)\d{5}$/.test(scannedValue);

        if (isValidFormat) {
          // Prevent default Enter behavior
          event.preventDefault();

          setLastScan(scannedValue);

          // Show success toast
          toast({
            title: 'Barcode Scanned',
            description: `Processing ${scannedValue}...`,
            duration: 2000,
          });

          // If onScan is provided, call it
          if (onScan) {
            onScan(scannedValue);
          } else {
            // Default behavior: navigate to the order page
            router.push(`/service/labelgenerator/${scannedValue}`);
          }
        }

        // Clear the buffer
        setBuffer('');
      } else {
        // For non-Enter keys, append to buffer and prevent default if in an input
        if (isInputFocused) {
          // Only prevent default if we already have content in the buffer
          // (likely a barcode scan in progress)
          if (buffer.length > 0) {
            event.preventDefault();
          }
        }
        setBuffer(prev => prev + event.key);
      }
    };

    // Add event listener
    window.addEventListener('keypress', handleKeyPress);

    // Add a timeout to clear the buffer if no new input for 100ms
    const clearBufferTimeout = setInterval(() => {
      setBuffer(prev => prev.length > 0 ? '' : prev);
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearInterval(clearBufferTimeout);
    };
  }, [buffer, enabled, onScan, router, toast]);

  return {
    lastScan,
    isValidScan: (code: string) => /^(?:S|IF)\d{5}$/.test(code.toUpperCase()),
  };
};
