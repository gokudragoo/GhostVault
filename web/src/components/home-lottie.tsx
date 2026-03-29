'use client';

import Script from 'next/script';

const SCRIPT = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js';
const SRC =
  'https://lottie.host/0ea1d17c-0b56-4e52-86ee-62b8adc83f40/k7X7gNZDZY.lottie';

export function HomeLottie() {
  return (
    <div className="flex justify-center md:justify-end">
      <Script src={SCRIPT} type="module" strategy="afterInteractive" />
      <dotlottie-wc
        src={SRC}
        style={{ width: 300, height: 300 }}
        autoplay
        loop
      />
    </div>
  );
}
