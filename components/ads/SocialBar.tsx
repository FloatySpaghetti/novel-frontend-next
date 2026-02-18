// components/ads/SocialBar.tsx
import React, { useEffect } from 'react';

declare global {
  interface Window {
    _mNHandle?: any;
    _mN?: any;
  }
}

const SocialBar: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scriptId = '_mNScriptTag_27d72879876998e556c48fcae6fb7203';

      // Avoid duplicate script loading
      if (document.getElementById(scriptId)) return;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://degreeeruptionpredator.com/27/d7/28/27d72879876998e556c48fcae6fb7203.js';
      script.async = true;
      script.defer = true;

      document.body.appendChild(script);

      // Cleanup function
      return () => {
        if (window._mNHandle?._instance) {
          try {
            window._mNHandle._instance.remove();
          } catch (err) {
            console.warn('Failed to remove SocialBar', err);
          }
        }
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  return null;
};

export default SocialBar;
