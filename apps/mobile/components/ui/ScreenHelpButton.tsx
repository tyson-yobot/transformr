// =============================================================================
// TRANSFORMR — ScreenHelpButton
// ? button placed in screen headers to open the screen-level help sheet.
// =============================================================================

import React from 'react';
import { HelpIcon } from './HelpIcon';
import type { HelpContent } from '../../constants/helpContent';

interface ScreenHelpButtonProps {
  content: HelpContent;
}

export function ScreenHelpButton({ content }: ScreenHelpButtonProps) {
  return (
    <HelpIcon
      content={content}
      size={22}
      style={{ paddingRight: 16 }}
    />
  );
}
