'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    _mNHandle?: any;
    _mN?: any;
  }
}

const SocialBar = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scriptId = '_mNScriptTag_27d72879876998e556c48fcae6fb7203';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src =
      'https://degreeeruptionpredator.com/27/d7/28/27d72879876998e556c48fcae6fb7203.js';
    script.async = true;
    script.defer = true;

    // Wait until body exists before appending
    if (document.body) {
      document.body.appendChild(script);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(script);
      });
    }

    // Clean up on unmount
    return () => {
      const el = document.getElementById(scriptId);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }

      if (window._mNHandle?._instance) {
        try {
          window._mNHandle._instance.remove();
        } catch (err) {
          console.warn('Could not remove SocialBar instance:', err);
        }
      }
    };
  }, []);

  return null;
};

export default SocialBar;
