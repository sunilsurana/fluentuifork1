import * as React from 'react';
import { getNativeElementProps } from '@fluentui/react-utilities';
import type { CalendarYearProps, CalendarYearState } from './CalendarYear.types';

/**
 * Create the state required to render CalendarYear.
 *
 * The returned state can be modified with hooks such as useCalendarYearStyles_unstable,
 * before being passed to renderCalendarYear_unstable.
 *
 * @param props - props from this instance of CalendarYear
 * @param ref - reference to root HTMLElement of CalendarYear
 */
export const useCalendarYear_unstable = (props: CalendarYearProps, ref: React.Ref<HTMLElement>): CalendarYearState => {
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
