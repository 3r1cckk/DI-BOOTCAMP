import React, { useEffect, useRef } from 'react';

interface LandingPageViewProps {
  onDashboardRequest: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onDashboardRequest }) => {
  const landingFrame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleLandingMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === landingFrame.current?.contentWindow &&
        event.data?.type === 'akiba-ai-auth'
      ) {
        onDashboardRequest();
      }
    };

    window.addEventListener('message', handleLandingMessage);
    return () => window.removeEventListener('message', handleLandingMessage);
  }, [onDashboardRequest]);

  return (
    <iframe
      ref={landingFrame}
      src="/akiba-landing/index.html"
      title="Akiba landing page"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 0,
        background: '#fff',
      }}
    />
  );
};
