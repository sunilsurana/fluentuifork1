import * as React from 'react';
import { FontIncrease24Regular, FontDecrease24Regular, TextFont24Regular } from '@fluentui/react-icons';
import { Toolbar, ToolbarButton } from '@fluentui/react-components/unstable';
import type { ToolbarProps } from '@fluentui/react-components/unstable';

export const Small = (props: Partial<ToolbarProps>) => (
  <Toolbar
    {...props}
    aria-label="Small"
    size="small"
    style={{
      border: '2px solid black',
      borderRadius: '8px',
    }}
  >
    <ToolbarButton aria-label="Increase Font Size" appearance="primary" icon={<FontIncrease24Regular />} />
    <ToolbarButton aria-label="Decrease Font Size" icon={<FontDecrease24Regular />} />
    <ToolbarButton aria-label="Reset Font Size" icon={<TextFont24Regular />} />
  </Toolbar>
);
