import React from 'react';

// 临时壳组件：通过 renderLegacy 复用 App.jsx 中现有的 renderExplore，实现安全拆分。
export const ExploreTabView = ({ renderLegacy }) => {
  return renderLegacy();
};

