/* eslint-disable no-unused-vars */
/* eslint-disable id-blacklist */
import bootstrapDatepicker from './bootstrap-datepicker1.8.0.min';
import $ from 'jquery';
import moment from 'moment/moment';
import { differenceWith, indexOf, isEqual, last } from 'lodash';
import datePickerUtils from './date-picker-utils';
const four = 4;

const datePicker = {

  init: () => {
    datePicker.getBankHolidays(bankholidays => {
      datePicker.buildDatePicker(bankholidays);
    });
  },

  getBankHolidays: callback => {
    $.ajax({
      type: 'GET',
      url: 'https://www.gov.uk/bank-holidays.json',
      success: res => {
        const events = res['england-and-wales'].events;
        const dates = events.map(event => moment(event.date).format('MM-D-YYYY'));
        callback(dates);
      }
    });
  },
  hijackTabIndex: () => {
    $('.day:not(".disabled")').each(function addTabIndex(index) {
      /* eslint-disable no-invalid-this */
      $(this).attr('tabindex', 1 + index);
      /* eslint-disable no-invalid-this */
    });
  },

  buildDatePicker: datesDisabled => {
    datePicker.selector().datepicker({
      multidate: true,
      daysOfWeekDisabled: '06',
      defaultViewDate: moment().add(four, 'weeks').format('MM-D-YYYY'),
      startDate: '+4w',
      endDate: '+22w',
      weekStart: 1,
      maxViewMode: 0,
      datesDisabled,
      beforeShowDay: date => datePickerUtils.displayFirstOfMonth(date)
    }).on('changeDate', event => datePicker.changeDateHandler(event));
    // Update the date-picker with dates that have already been added.
    datePicker.selector().datepicker('setDates', datePicker.getData().map(date => date.value));
    datePicker.selector().off('keydown');
    window.setTimeout(datePicker.hijackTabIndex, 0);
  },

  selector: () => $('#date-picker'),

  changeDateHandler: event => {
    const dates = event.dates;
    datePicker.hijackTabIndex();
    const currentDates = datePicker.getData();
    if (datePickerUtils.isDateAdded(currentDates, dates)) {
      return datePicker.postDate(dates);
    } else if (datePickerUtils.isDateRemoved(currentDates, dates)) {
      return datePicker.removeDate(dates);
    }
    return datePicker.displayDateList(dates);
  },

  displayDateList: dates => {
    const datesIndex = dates.map((date, index) => datePickerUtils.buildDatesArray(index, date));
    const orderDates = datePickerUtils.sortDates(datesIndex);
    let elements = '';

    orderDates.forEach(date => {
      elements += `<div id="add-another-list-items-${date.index}">
        <dd class="add-another-list-item">
          <span data-index="items-${date.index}">
            ${datePickerUtils.formatDateForDisplay(date.value)}
          </span>
        </dd>
        <dd class="add-another-list-controls">
          <a href="/dates-cant-attend/item-${date.index}/delete">Remove</a>
        </dd>
       </div>`;
    });
    if (elements === '') {
      const noItems = `<dt class="add-another-list-item">
                    <div>No dates added yet</div></dt><dd></dd>`;
      $('.add-another-list').empty().append(noItems);
    } else {
      $('.add-another-list').empty().append(elements);
    }
  },

  postDate: dates => {
    const lastestDateAdded = last(dates);
    const mDate = moment(lastestDateAdded);
    const body = {
      'item.day': mDate.date().toString(),
      'item.month': (mDate.month() + 1).toString(),
      'item.year': mDate.year().toString()
    };
    const index = indexOf(dates, lastestDateAdded);

    return $.ajax({
      type: 'POST',
      url: `/dates-cant-attend/item-${index}`,
      data: body,
      success: () => datePicker.displayDateList(dates)
    });
  },

  removeDate: dates => {
    const data = datePicker.getData();
    const oldDates = data.map(date => date.value);
    const newDates = dates;
    const dateToRemove = differenceWith(oldDates, newDates, isEqual).toString();
    const index = datePickerUtils.getIndexFromDate(data, dateToRemove);

    return $.ajax({
      type: 'GET',
      url: `/dates-cant-attend/item-${index}/delete`,
      success: () => datePicker.displayDateList(newDates)
    });
  },

  getData: () => {
    const list = $('.add-another-list .add-another-list-item > span').toArray();
    return list.map(item => datePickerUtils.buildDatesArray(
      datePickerUtils.getIndexOfDate(item),
      datePickerUtils.getValueOfDate(item)
    ));
  }

};

module.exports = datePicker;
