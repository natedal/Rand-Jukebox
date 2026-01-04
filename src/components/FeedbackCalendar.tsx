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
      <div className="glass rounded-3xl p-6 md:p-8 w-full max-w-md relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-400/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl"></div>
        
        {/* Border Glow Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gold-400/20 via-transparent to-gold-400/20 opacity-50 pointer-events-none"></div>
        <style dangerouslySetInnerHTML={{__html: `
          .rdp {
            --rdp-cell-size: 40px;
            --rdp-accent-color: #fbbf24;
            --rdp-background-color: #1e293b;
            --rdp-accent-color-dark: #f59e0b;
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
            padding: 0.75rem 0.5rem;
            margin-bottom: 0.5rem;
            color: white;
            font-weight: 600;
          }

          .rdp-caption_label {
            font-size: 1.125rem;
            font-weight: 700;
            color: white;
            font-family: 'Syne', sans-serif;
            background: linear-gradient(135deg, #e8d68a 0%, #cfae45 50%, #8a7429 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .rdp-nav {
            display: flex;
            gap: 0.5rem;
          }

          .rdp-button {
            padding: 0.5rem 0.75rem;
            border-radius: 0.75rem;
            background-color: rgba(207, 174, 69, 0.1);
            border: 1px solid rgba(207, 174, 69, 0.2);
            color: #cfae45;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .rdp-button:hover {
            background-color: rgba(207, 174, 69, 0.2);
            border-color: rgba(207, 174, 69, 0.4);
            transform: scale(1.05);
          }

          .rdp-button:focus {
            outline: 2px solid rgba(207, 174, 69, 0.5);
            outline-offset: 2px;
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
            color: #e5e7eb;
            transition: all 0.2s;
          }

          .rdp-day {
            width: var(--rdp-cell-size);
            height: var(--rdp-cell-size);
            margin: 0;
          }

          .rdp-day:hover .rdp-button_reset {
            background-color: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
          }

          .rdp-day_selected .rdp-button_reset {
            background-color: #fbbf24;
            color: #1e293b;
            font-weight: 700;
          }

          .rdp-day_selected:hover .rdp-button_reset {
            background-color: #f59e0b;
            color: #1e293b;
          }

          .rdp-day_today .rdp-button_reset {
            font-weight: 700;
            border: 1px solid rgba(251, 191, 36, 0.5);
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
            bottom: 3px;
            left: 50%;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: linear-gradient(135deg, #cfae45 0%, #e8d68a 100%);
            box-shadow: 0 0 6px rgba(207, 174, 69, 0.6);
            animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .rdp-day.has-feedback.rdp-day_selected .rdp-button_reset::after {
            background: linear-gradient(135deg, #080f1c 0%, #0f1e33 100%);
            box-shadow: 0 0 4px rgba(8, 15, 28, 0.8);
          }

          .rdp-day.has-feedback:hover .rdp-button_reset::after {
            width: 6px;
            height: 6px;
            box-shadow: 0 0 8px rgba(207, 174, 69, 0.8);
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

