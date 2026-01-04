'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import 'react-day-picker/dist/style.css';

interface FeedbackCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  datesWithFeedback: string[]; // Array of date strings in YYYY-MM-DD format
}

export function FeedbackCalendar({ selectedDate, onDateSelect, datesWithFeedback }: FeedbackCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  // Convert datesWithFeedback array to Set for O(1) lookup
  const feedbackDatesSet = new Set(datesWithFeedback);

  // Custom modifiers for styling
  const modifiers = {
    hasFeedback: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return feedbackDatesSet.has(dateStr);
    },
  };

  const modifiersClassNames = {
    hasFeedback: 'has-feedback',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      {/* Instruction Text */}
      <div className="mb-4 text-center">
        <p className="text-gray-300 text-sm md:text-base">
          Choose a date to see customer feedback for songs played on that date.
        </p>
        {datesWithFeedback.length > 0 && (
          <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 shadow-[0_0_6px_rgba(207,174,69,0.6)]"></span>
            Dates with feedback are highlighted
          </p>
        )}
      </div>

      {/* Calendar Container */}
      <div className="glass rounded-2xl p-5 md:p-6 w-full max-w-sm relative overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          .rdp {
            --rdp-cell-size: 36px;
            --rdp-accent-color: #cfae45;
            --rdp-background-color: #1e293b;
            --rdp-accent-color-dark: #8a7429;
            --rdp-background-color-dark: #0f172a;
            --rdp-outline: 2px solid var(--rdp-accent-color);
            --rdp-outline-selected: 3px solid var(--rdp-accent-color);
            margin: 0;
            font-family: inherit;
          }

          .rdp-months {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          .rdp-month {
            margin: 0 auto;
            width: 100%;
          }

          .rdp-caption {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 0.25rem;
            margin-bottom: 1rem;
            color: white;
            font-weight: 600;
          }

          .rdp-caption_label {
            font-size: 1rem;
            font-weight: 600;
            color: white;
            font-family: 'DM Sans', sans-serif;
            text-align: center;
            flex: 1;
          }

          .rdp-nav {
            display: flex;
            gap: 0.5rem;
          }

          .rdp-button {
            padding: 0.375rem 0.5rem;
            border-radius: 0.5rem;
            background-color: transparent;
            border: none;
            color: #a9b9d4;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
          }

          .rdp-button:hover {
            opacity: 1;
            color: #cfae45;
          }

          .rdp-button:focus {
            outline: none;
          }

          .rdp-button:active {
            transform: scale(0.95);
          }

          .rdp-table {
            width: 100%;
            max-width: none;
            border-collapse: separate;
            border-spacing: 4px;
            margin: 0 auto;
          }

          .rdp-head_cell {
            color: #a9b9d4;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.75rem 0.5rem 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.8;
          }

          .rdp-cell {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            text-align: center;
            font-size: 0.875rem;
            padding: 2px;
          }

          .rdp-button_reset {
            background-color: transparent;
            border: none;
            cursor: pointer;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            color: #f0f3f8;
            transition: all 0.15s ease;
            font-weight: 400;
            position: relative;
            min-width: 36px;
            min-height: 36px;
          }

          .rdp-day {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            margin: 0;
          }

          .rdp-day:hover .rdp-button_reset {
            background-color: rgba(207, 174, 69, 0.1);
            color: #cfae45;
          }

          .rdp-day_selected .rdp-button_reset {
            background-color: #cfae45;
            color: #080f1c;
            font-weight: 600;
            border-radius: 0.375rem;
          }

          .rdp-day_selected:hover .rdp-button_reset {
            background-color: #e8d68a;
            color: #080f1c;
          }

          .rdp-day_today .rdp-button_reset {
            font-weight: 600;
            color: #cfae45;
          }

          .rdp-day_today.rdp-day_selected .rdp-button_reset {
            color: #080f1c;
          }

          .rdp-day_outside .rdp-button_reset {
            opacity: 0.25;
            color: #9ca3af;
          }

          .rdp-day_outside {
            opacity: 0.3;
          }

          .rdp-day_disabled {
            opacity: 0.2;
            cursor: not-allowed;
          }

          .rdp-day_disabled:hover .rdp-button_reset {
            background-color: transparent;
            color: #9ca3af;
          }

          /* Custom styling for dates with feedback */
          .rdp-day.has-feedback .rdp-button_reset {
            position: relative;
          }

          .rdp-day.has-feedback .rdp-button_reset::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: #cfae45;
          }

          .rdp-day.has-feedback.rdp-day_selected .rdp-button_reset::after {
            background-color: #080f1c;
          }
        `}} />
        <div className="relative z-10 flex justify-center">
          <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onDateSelect(date);
            }
          }}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="text-white"
          classNames={{
            months: 'months',
            month: 'month',
            caption: 'caption',
            caption_label: 'caption_label',
            nav: 'nav',
            nav_button: 'button',
            nav_button_previous: 'button',
            nav_button_next: 'button',
            table: 'table',
            head_row: 'head_row',
            head_cell: 'head_cell',
            row: 'row',
            cell: 'cell',
            day: 'day',
            day_button: 'button_reset',
            day_selected: 'day_selected',
            day_today: 'day_today',
            day_outside: 'day_outside',
            day_disabled: 'day_disabled',
            day_range_middle: 'day_range_middle',
            day_hidden: 'day_hidden',
          }}
          />
        </div>
      </div>
    </motion.div>
  );
}

