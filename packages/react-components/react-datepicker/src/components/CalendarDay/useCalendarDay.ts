import * as React from 'react';
import { getNativeElementProps } from '@fluentui/react-utilities';
import type { CalendarDayProps, CalendarDayState } from './CalendarDay.types';

/**
 * Create the state required to render CalendarDay.
 *
 * The returned state can be modified with hooks such as useCalendarDayStyles_unstable,
 * before being passed to renderCalendarDay_unstable.
 *
 * @param props - props from this instance of CalendarDay
 * @param ref - reference to root HTMLElement of CalendarDay
 */
export const useCalendarDay_unstable = (props: CalendarDayProps, ref: React.Ref<HTMLElement>): CalendarDayState => {
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
