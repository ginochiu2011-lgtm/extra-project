import React from 'react';

// 当前仅做轻量封装：通过 renderLegacy 复用 App.jsx 里的原有 renderWish，避免一次性大改。
// 后续可以逐步把 JSX 和逻辑从 App.jsx 下沉到本组件。
export const WishView = ({ renderLegacy }) => {
  return renderLegacy();
};

