import * as React from 'react';
import { getNativeElementProps } from '@fluentui/react-utilities';
import type { CalendarPickerProps, CalendarPickerState } from './CalendarPicker.types';

/**
 * Create the state required to render CalendarPicker.
 *
 * The returned state can be modified with hooks such as useCalendarPickerStyles_unstable,
 * before being passed to renderCalendarPicker_unstable.
 *
 * @param props - props from this instance of CalendarPicker
 * @param ref - reference to root HTMLElement of CalendarPicker
 */
export const useCalendarPicker_unstable = (
  props: CalendarPickerProps,
  ref: React.Ref<HTMLElement>,
): CalendarPickerState => {
  return {
    // TODO add appropriate props/defaults
    components: {
      // TODO add each slot's element type or component
      root: 'div',
    },
    // TODO add appropriate slots, for example:
    // mySlot: resolveShorthand(props.mySlot),
    root: getNativeElementProps('div', {
      ref,
      ...props,
    }),
  };
};
